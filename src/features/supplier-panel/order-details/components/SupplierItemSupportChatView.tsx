import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    ScrollView,
    StyleSheet,
    ActivityIndicator,
    Text,
    Animated,
    Image,
} from 'react-native';
import { 
    getSupplierItemSupportConversation, 
    sendSupplierItemSupportMessage, 
    markSupplierItemSupportRead, 
    ItemSupportMessage 
} from '../../orders/api/orders.api';
import { ChatMessageBubble, ChatMessageInput } from '@/shared/components/chatbox';
import { AnimatedTypingDots } from '@/shared/components/AnimatedTypingDots';
import socketService from '@/services/socket.service';
import { useAppSelector } from '@/store/hooks';
import { theme } from '@/theme';
import { Ionicons } from '@expo/vector-icons';

const AI_COLOR = '#7C3AED';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SupplierItemSupportChatViewProps {
    orderId: number;
    itemId: number;
    productName: string;
    itemImage?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const SupplierItemSupportChatView = ({ orderId, itemId, productName, itemImage }: SupplierItemSupportChatViewProps) => {
    const [messages, setMessages] = useState<ItemSupportMessage[]>([]);
    const [conversationId, setConversationId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const scrollViewRef = useRef<ScrollView>(null);
    const activeTempMessagesRef = useRef<Set<number>>(new Set());

    // Read supplier identity from Redux for socket authentication
    const { user: supplierData } = useAppSelector((state) => state.auth);
    const supplierId = supplierData?.id;

    // ─── Lifecycle ───────────────────────────────────────────────────────────

    useEffect(() => {
        fetchConversation();
    }, [orderId, itemId]);

    // Socket.IO real-time integration
    useEffect(() => {
        if (!supplierId || !itemId) return;

        const roomName = `support:item:${itemId}`;
        socketService.joinRoom(roomName);

        socketService.onItemSupportNewMessage((data) => {
            console.log('📨 New item support message received via Socket.IO:', data);

            if (data.message) {
                const newMessage: ItemSupportMessage = {
                    id: data.message.id,
                    message: data.message.message,
                    sender_type: data.message.sender_type,
                    sender_name: data.message.sender_name,
                    is_read: data.message.is_read,
                    created_at: data.message.created_at,
                };

                setMessages(prev => {
                    const exists = prev.some(msg => msg.id === newMessage.id);
                    if (exists) return prev;

                    let filtered = prev;
                    // Deduplicate our own temp messages
                    if (newMessage.sender_type === 'supplier') {
                        const tempMsg = prev.find(msg =>
                            activeTempMessagesRef.current.has(msg.id) &&
                            msg.message === newMessage.message
                        );
                        if (tempMsg) {
                            filtered = prev.filter(m => m.id !== tempMsg.id);
                            activeTempMessagesRef.current.delete(tempMsg.id);
                        }
                    }
                    return [...filtered, newMessage];
                });
            }
        });

        return () => {
            socketService.leaveRoom(roomName);
            socketService.offItemSupportNewMessage();
        };
    }, [itemId, supplierId]);

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        if (messages.length > 0) {
            setTimeout(() => {
                scrollViewRef.current?.scrollToEnd({ animated: true });
            }, 100);
        }
    }, [messages]);

    // ─── Handlers ────────────────────────────────────────────────────────────

    const fetchConversation = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await getSupplierItemSupportConversation(orderId, itemId);
            const convoData = response.data;

            setConversationId(convoData.conversation_id);
            setMessages(convoData.messages || []);

            if (convoData.conversation_id) {
                markSupplierItemSupportRead(orderId, itemId, convoData.conversation_id).catch(() => { });
            }
        } catch (err: any) {
            console.error('Failed to fetch support conversation:', err);
            setError('Failed to load support conversation');
        } finally {
            setLoading(false);
        }
    };

    const handleSendMessage = async (text: string) => {
        if (!text.trim()) return;

        const tempId = Date.now();
        activeTempMessagesRef.current.add(tempId);
        const tempMessage: ItemSupportMessage = {
            id: tempId,
            message: text,
            sender_type: 'supplier',
            sender_name: 'You',
            is_read: false,
            created_at: new Date().toISOString(),
        };

        setMessages(prev => [...prev, tempMessage]);

        try {
            setSending(true);
            const response = await sendSupplierItemSupportMessage(orderId, itemId, text);

            const data = response.data;
            const newMsgs: ItemSupportMessage[] = [];

            if (data.supplier_message) {
                newMsgs.push({
                    id: data.supplier_message.id,
                    message: data.supplier_message.message,
                    sender_type: 'supplier',
                    sender_name: 'You',
                    is_read: false,
                    created_at: data.supplier_message.created_at,
                });
            }

            setMessages(prev => {
                const filtered = prev.filter(m => m.id !== tempId);
                activeTempMessagesRef.current.delete(tempId);
                return [...filtered, ...newMsgs];
            });

        } catch (err: any) {
            console.error('Failed to send message:', err);
            setMessages(prev => prev.filter(m => m.id !== tempId));
            activeTempMessagesRef.current.delete(tempId);
        } finally {
            setSending(false);
        }
    };

    // ─── Renderers ───────────────────────────────────────────────────────────

    if (loading && messages.length === 0) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary[500]} />
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
        <View style={styles.container}>
            {/* ── Item header ──────────────────────────────────────────────── */}
            <View style={styles.itemHeader}>
                <View style={styles.itemHeaderLeft}>
                    <View style={[styles.itemIconWrap, itemImage ? styles.itemImageWrap : {}]}>
                        {itemImage ? (
                            <Image source={{ uri: itemImage }} style={styles.itemImage} />
                        ) : (
                            <Ionicons name="cube-outline" size={14} color={theme.colors.primary[500]} />
                        )}
                    </View>
                    <View style={styles.itemHeaderTextContainer}>
                        <Text style={styles.itemName} numberOfLines={1}>
                            {productName}
                        </Text>
                        <Text style={styles.headerSubtitle}>Customer Support Chat</Text>
                    </View>
                </View>
            </View>

            <ScrollView
                ref={scrollViewRef}
                style={styles.chatScroll}
                contentContainerStyle={styles.chatScrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {messages.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyStateText}>No messages yet.</Text>
                    </View>
                ) : (
                    <>
                        {messages.map((msg) => {
                            if (msg.sender_type === 'ai') {
                                return (
                                    <View key={msg.id} style={styles.aiBubbleRow}>
                                        <View style={styles.aiAvatarSmall}>
                                            <Ionicons name="sparkles" size={10} color="#FFFFFF" />
                                        </View>
                                        <View style={styles.aiBubble}>
                                            <Text style={styles.aiSenderLabel}>✨ AI Support</Text>
                                            <Text style={styles.aiBubbleText}>{msg.message}</Text>
                                            <Text style={styles.aiBubbleTimestamp}>
                                                {msg.created_at
                                                    ? new Date(msg.created_at).toLocaleTimeString('en-US', {
                                                        hour: 'numeric',
                                                        minute: '2-digit',
                                                        hour12: true,
                                                    })
                                                    : ''}
                                            </Text>
                                        </View>
                                    </View>
                                );
                            }

                            return (
                                <ChatMessageBubble
                                    key={msg.id}
                                    message={msg.message}
                                    senderType={msg.sender_type === 'supplier' ? 'supplier' : 'customer'}
                                    senderName={msg.sender_name}
                                    timestamp={msg.created_at}
                                    currentUserType="supplier"
                                />
                            );
                        })}

                        {sending && (
                            <View style={styles.typingRow}>
                                <View style={styles.aiAvatarSmall}>
                                    <Ionicons name="sparkles" size={10} color="#FFFFFF" />
                                </View>
                                <View style={styles.typingBubble}>
                                    <AnimatedTypingDots color="#7C3AED" size={7} />
                                    <Text style={styles.typingLabel}>Supplier is typing</Text>
                                </View>
                            </View>
                        )}
                    </>
                )}
            </ScrollView>

            <View style={styles.inputWrapper}>
                <ChatMessageInput
                    onSend={handleSendMessage}
                    placeholder="Type your reply..."
                    disabled={sending}
                />
            </View>
        </View>
    );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
    },
    errorText: {
        color: '#DC2626',
        fontSize: 16,
        fontFamily: 'Inter',
    },
    itemHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: theme.spacing.md,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border.card_light,
        backgroundColor: theme.colors.background.default,
    },
    itemHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flex: 1,
        marginRight: 8,
    },
    itemIconWrap: {
        width: 32,
        height: 32,
        borderRadius: 6,
        backgroundColor: theme.colors.primary[50],
        alignItems: 'center',
        justifyContent: 'center',
    },
    itemImageWrap: {
        backgroundColor: theme.colors.gray[100],
        borderWidth: 1,
        borderColor: theme.colors.gray[200],
        overflow: 'hidden',
    },
    itemImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    itemHeaderTextContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    itemName: {
        fontSize: theme.typography.fontSize.sm,
        fontWeight: theme.typography.fontWeight.semiBold,
        color: theme.colors.text.primary,
    },
    headerSubtitle: {
        fontSize: theme.typography.fontSize.xs,
        color: theme.colors.text.secondary,
        marginTop: 2,
    },
    chatScroll: {
        flex: 1,
    },
    chatScrollContent: {
        padding: 16,
        paddingBottom: 24,
    },
    typingIndicatorContainer: {
        alignSelf: 'flex-start',
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 16,
        borderBottomLeftRadius: 4,
        marginTop: 8,
        marginLeft: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    inputWrapper: {
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    emptyState: {
        paddingVertical: 32,
        alignItems: 'center',
    },
    emptyStateText: {
        fontFamily: 'Inter',
        color: '#9CA3AF',
        fontSize: 14,
    },
    aiBubbleRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        marginBottom: 6,
        paddingHorizontal: 8,
    },
    aiAvatarSmall: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: AI_COLOR,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 2,
    },
    aiBubble: {
        flex: 1,
        backgroundColor: AI_COLOR + '12',
        borderRadius: 14,
        borderTopLeftRadius: 2,
        paddingHorizontal: 12,
        paddingVertical: 10,
        maxWidth: '82%',
        borderWidth: 1,
        borderColor: AI_COLOR + '25',
    },
    aiSenderLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: AI_COLOR,
        marginBottom: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.3,
    },
    aiBubbleText: {
        fontSize: 14,
        color: theme.colors.text.primary,
        lineHeight: 20,
    },
    aiBubbleTimestamp: {
        fontSize: 10,
        color: theme.colors.text.disabled,
        marginTop: 4,
        alignSelf: 'flex-end',
    },
    typingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 8,
        marginBottom: 6,
    },
    typingBubble: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: AI_COLOR + '12',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 14,
        borderTopLeftRadius: 2,
        borderWidth: 1,
        borderColor: AI_COLOR + '25',
    },
    typingLabel: {
        fontSize: 11,
        color: AI_COLOR,
        fontWeight: '600',
        opacity: 0.8,
    }
});
