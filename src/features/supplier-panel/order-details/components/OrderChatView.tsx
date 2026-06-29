import React, { useState, useEffect, useRef } from 'react';
import { View, ScrollView, StyleSheet, ActivityIndicator, Text, KeyboardAvoidingView, Platform } from 'react-native';
import { getOrderMessages, sendOrderMessage, OrderMessage } from '../api/order-messages.api';
import { ChatMessageBubble, ChatMessageInput } from '@/shared/components/chatbox';
import socketService from '@/services/socket.service';
import { useAppSelector } from '@/store/hooks';

interface OrderChatViewProps {
    supplierOrderId: number;
    supplierId?: number; // Optional, will be fetched from auth if not provided
}

export default function OrderChatView({ supplierOrderId, supplierId }: OrderChatViewProps) {
    const [messages, setMessages] = useState<OrderMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const scrollViewRef = useRef<ScrollView>(null);

    // Read supplier identity from Redux for socket authentication
    const { supplier: supplierData } = useAppSelector((state) => state.supplierAuth);
    const resolvedSupplierId = supplierId ?? supplierData?.id;

    // Fetch messages on mount
    useEffect(() => {
        fetchMessages();
    }, [supplierOrderId]);

    // Socket.IO real-time integration
    useEffect(() => {
        if (!resolvedSupplierId) return;

        const socketToken = `supplier_${resolvedSupplierId}`;
        const room = `order:${supplierOrderId}:${resolvedSupplierId}`;

        // Join room safely — handles both "already connected" and "just connecting" cases
        const joinRoom = () => {
            console.log('📡 Supplier joining order room:', room);
            socketService.joinRoom(room);
        };

        // Connect (no-op if already connected with same token)
        socketService.connect(socketToken, 'supplier');

        // If already connected, join immediately; otherwise wait for connect event
        if (socketService.isConnected()) {
            joinRoom();
        } else {
            socketService.onConnect(joinRoom);
        }

        // Listen for new messages
        socketService.onOrderNewMessage((data) => {
            console.log('📨 New supplier message received via Socket.IO:', data);

            if (data.message) {
                const newMessage: OrderMessage = {
                    id: data.message.id,
                    message: data.message.message,
                    sender_type: data.message.sender_type,
                    sender_name: data.message.sender_name,
                    is_read: data.message.is_read,
                    attachments: null,
                    created_at: data.message.created_at,
                };

                // Add message only if not already present (dedup)
                setMessages(prev => {
                    const exists = prev.some(msg => msg.id === newMessage.id);
                    if (exists) return prev;
                    return [...prev, newMessage];
                });
            }
        });

        // Cleanup on unmount
        return () => {
            socketService.leaveOrderRoom(supplierOrderId, resolvedSupplierId);
            socketService.offOrderNewMessage();
            socketService.offConnect(joinRoom);
        };
    }, [supplierOrderId, resolvedSupplierId]);

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        if (messages.length > 0) {
            setTimeout(() => {
                scrollViewRef.current?.scrollToEnd({ animated: true });
            }, 100);
        }
    }, [messages]);

    const fetchMessages = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await getOrderMessages(supplierOrderId);
            setMessages(response.data);
        } catch (err: any) {
            console.error('Failed to fetch messages:', err);
            setError('Failed to load messages');
        } finally {
            setLoading(false);
        }
    };

    const handleSendMessage = async (message: string) => {
        try {
            setSending(true);
            const response = await sendOrderMessage(supplierOrderId, { message });

            // Add the new message to the list optimistically
            const newMessage: OrderMessage = {
                id: response.data.id,
                message: response.data.message,
                sender_type: 'supplier',
                sender_name: 'You',
                is_read: false,
                attachments: null,
                created_at: response.data.created_at,
            };

            setMessages(prev => {
                const exists = prev.some(msg => msg.id === newMessage.id);
                if (exists) return prev;
                return [...prev, newMessage];
            });
        } catch (err: any) {
            console.error('Failed to send message:', err);
            setError('Failed to send message');
        } finally {
            setSending(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#00615E" />
            </View>
        );
    }

    if (error && messages.length === 0) {
        return (
            <View style={styles.centerContainer}>
                <Text style={styles.errorText}>{error}</Text>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior="padding"
            keyboardVerticalOffset={Platform.OS === 'ios' ? 140 : 120}
        >
            {/* Messages List */}
            <ScrollView
                ref={scrollViewRef}
                style={styles.messagesContainer}
                contentContainerStyle={styles.messagesContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {messages.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No messages yet</Text>
                        <Text style={styles.emptySubtext}>Start a conversation with the customer</Text>
                    </View>
                ) : (
                    messages.map((msg) => (
                        <ChatMessageBubble
                            key={msg.id}
                            message={msg.message}
                            senderType={msg.sender_type}
                            senderName={msg.sender_name}
                            timestamp={msg.created_at}
                        />
                    ))
                )}
            </ScrollView>

            {/* Message Input */}
            <View style={styles.inputContainer}>
                <ChatMessageInput onSend={handleSendMessage} disabled={sending} />
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'column',
        padding: 8,
        gap: 8,
        borderRadius: 8,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    messagesContainer: {
        flex: 1,
    },
    messagesContent: {
        flexDirection: 'column',
        gap: 4,
        paddingBottom: 8,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    emptyText: {
        fontFamily: 'Inter',
        fontSize: 16,
        fontWeight: '600',
        color: '#6B7280',
        marginBottom: 8,
    },
    emptySubtext: {
        fontFamily: 'Inter',
        fontSize: 14,
        color: '#9CA3AF',
    },
    errorText: {
        fontFamily: 'Inter',
        fontSize: 14,
        color: '#EF4444',
        textAlign: 'center',
    },
    inputContainer: {
        paddingTop: 8,
        paddingBottom: Platform.OS === 'android' ? 36 : 24, // Add padding to avoid touching bottom edge
    },
});
