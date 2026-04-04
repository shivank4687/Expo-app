import React, { useState, useEffect, useRef } from 'react';
import { View, ScrollView, StyleSheet, ActivityIndicator, Text, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { ordersApi, OrderMessage, OrderMessageSupplier } from '@/services/api/orders.api';
import { ChatMessageBubble, ChatMessageInput } from '@/shared/components/chatbox';
import socketService from '@/services/socket/socketService';
import { useAppSelector } from '@/store/hooks';
import { COLORS } from '@/features/supplier-panel/styles/colors';

interface OrderChatViewProps {
    orderId: number;
}

export const OrderChatView = ({ orderId }: OrderChatViewProps) => {
    const [messages, setMessages] = useState<OrderMessage[]>([]);
    const [suppliers, setSuppliers] = useState<OrderMessageSupplier[]>([]);
    const [activeSupplierId, setActiveSupplierId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const scrollViewRef = useRef<ScrollView>(null);

    // Read customer identity from Redux for socket authentication
    const { user: customerData } = useAppSelector((state) => state.auth);
    const customerId = customerData?.id;

    const lastFetchedSupplier = useRef<number | null>(null);

    // Fetch messages on mount or when active supplier changes
    useEffect(() => {
        // Skip fetch if we already just fetched for this exact supplier (prevents duplicate fetch on auto-select)
        if (lastFetchedSupplier.current === activeSupplierId && activeSupplierId !== null) {
            return;
        }
        
        lastFetchedSupplier.current = activeSupplierId;
        fetchMessages(activeSupplierId || undefined);
    }, [orderId, activeSupplierId]);

    // Socket.IO real-time integration
    useEffect(() => {
        if (!customerId || !activeSupplierId) return;

        // Get the specific b2b marketplace order id for this supplier
        const activeSupplierData = suppliers.find(s => s.id === activeSupplierId);
        const supplierOrderId = activeSupplierData?.supplier_order_id || orderId;

        // Connect to Socket.IO with customer authentication
        const socketToken = `customer_${customerId}`;
        socketService.connect(socketToken, 'customer');

        // Join room using the B2B marketplace order ID to match the supplier panel exactly
        socketService.joinRoom(`order:${supplierOrderId}:${activeSupplierId}`);

        // Listen for new messages
        socketService.onNewMessage((data) => {
            console.log('📨 New customer message received via Socket.IO:', data);

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



                // Add message to list if it's not already there
                setMessages(prev => {
                    const exists = prev.some(msg => msg.id === newMessage.id);
                    if (exists) return prev;
                    return [...prev, newMessage];
                });
            }
        });

        return () => {
            if (activeSupplierData) {
                socketService.leaveRoom(`order:${supplierOrderId}:${activeSupplierId}`);
            }
            socketService.offNewMessage();
        };
    }, [orderId, customerId, activeSupplierId, suppliers]);

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        if (messages.length > 0) {
            setTimeout(() => {
                scrollViewRef.current?.scrollToEnd({ animated: true });
            }, 100);
        }
    }, [messages]);

    const fetchMessages = async (supplierId?: number) => {
        try {
            setLoading(true);
            setError(null);
            const response = await ordersApi.getOrderMessages(orderId, supplierId);
            
            if (response.supplier_id) {
                lastFetchedSupplier.current = response.supplier_id;
            }
            
            setSuppliers(response.suppliers || []);
            setMessages(response.data || []);
            if (!activeSupplierId && response.supplier_id) {
                setActiveSupplierId(response.supplier_id);
            }
            if (response.unread_count && response.unread_count > 0 && response.supplier_id) {
                ordersApi.markMessagesAsRead(orderId, response.supplier_id).catch(() => { });
            }
        } catch (err: any) {
            console.error('Failed to fetch messages:', err);
            setError('Failed to load messages');
        } finally {
            setLoading(false);
        }
    };

    const handleSendMessage = async (message: string) => {
        if (!activeSupplierId) return;
        try {
            setSending(true);
            const response = await ordersApi.sendOrderMessage(orderId, activeSupplierId, message);

            // Add the new message to the list optimistically
            const newMessage: OrderMessage = {
                id: response.data.id,
                message: response.data.message,
                sender_type: 'customer',
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
            keyboardVerticalOffset={Platform.OS === 'ios' ? 140 : 100}
        >
            {/* Supplier Selector Tabs - Only show if more than 1 supplier */}
            {suppliers.length > 1 && (
                <View style={styles.supplierTabsContainer}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.supplierTabsContent}>
                        {suppliers.map((supplier) => (
                            <TouchableOpacity
                                key={supplier.id}
                                style={[
                                    styles.supplierTab,
                                    activeSupplierId === supplier.id && styles.supplierTabActive
                                ]}
                                onPress={() => {
                                    if (activeSupplierId !== supplier.id) {
                                        setMessages([]);
                                        setActiveSupplierId(supplier.id);
                                    }
                                }}
                            >
                                <Text
                                    style={[
                                        styles.supplierTabText,
                                        activeSupplierId === supplier.id && styles.supplierTabTextActive
                                    ]}
                                >
                                    {supplier.company_name}
                                </Text>
                                {supplier.unread_count > 0 && activeSupplierId !== supplier.id && (
                                    <View style={styles.unreadBadge}>
                                        <Text style={styles.unreadBadgeText}>{supplier.unread_count}</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            )}

            {suppliers.length === 1 && (
                <View style={styles.singleSupplierHeader}>
                    <Text style={styles.singleSupplierLabel}>Messaging with</Text>
                    <Text style={styles.singleSupplierName}>{suppliers[0].company_name}</Text>
                </View>
            )}

            {/* Messages List */}
            <ScrollView
                ref={scrollViewRef}
                style={styles.messagesContainer}
                contentContainerStyle={styles.messagesContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {loading ? (
                    <View style={styles.centerContainer}>
                        <ActivityIndicator size="large" color="#00615E" />
                    </View>
                ) : messages.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No messages yet</Text>
                        <Text style={styles.emptySubtext}>Start a conversation regarding this order</Text>
                    </View>
                ) : (
                    messages.map((msg) => (
                        <ChatMessageBubble
                            key={`msg-${msg.id}`}
                            message={msg.message}
                            senderType={msg.sender_type}
                            senderName={msg.sender_name}
                            timestamp={msg.created_at}
                            currentUserType="customer"
                        />
                    ))
                )}
            </ScrollView>

            {/* Message Input */}
            <View style={styles.inputContainer}>
                {!activeSupplierId && !loading ? (
                    <Text style={styles.disabledText}>No supplier available for this order.</Text>
                ) : (
                    <ChatMessageInput onSend={handleSendMessage} disabled={sending} />
                )}
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
    supplierTabsContainer: {
        marginBottom: 8,
    },
    supplierTabsContent: {
        gap: 8,
        paddingHorizontal: 4,
    },
    supplierTab: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        gap: 6
    },
    supplierTabActive: {
        backgroundColor: '#00615E',
        borderColor: '#00615E',
    },
    supplierTabText: {
        fontFamily: 'Inter',
        fontSize: 14,
        fontWeight: '600',
        color: '#4B5563',
    },
    supplierTabTextActive: {
        color: '#FFFFFF',
    },
    unreadBadge: {
        backgroundColor: '#EF4444',
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 4,
    },
    unreadBadgeText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: 'bold',
    },
    singleSupplierHeader: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderLeftWidth: 3,
        borderLeftColor: '#00615E',
        marginBottom: 8,
        backgroundColor: '#F9FAFB',
        borderRadius: 4
    },
    singleSupplierLabel: {
        fontSize: 10,
        color: '#6B7280',
        textTransform: 'uppercase',
        fontWeight: 'bold',
        letterSpacing: 0.5,
        marginBottom: 2
    },
    singleSupplierName: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#111827'
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
        paddingBottom: 24,
    },
    disabledText: {
        fontFamily: 'Inter',
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        paddingVertical: 12,
    },
});
