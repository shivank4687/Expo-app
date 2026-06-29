import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    ScrollView,
    StyleSheet,
    ActivityIndicator,
    Text,
    Platform,
    TouchableOpacity,
    Animated,
} from 'react-native';
import { ordersApi, ItemSupportMessage } from '@/services/api/orders.api';
import { ChatMessageBubble, ChatMessageInput } from '@/shared/components/chatbox';
import { AnimatedTypingDots } from '@/shared/components/AnimatedTypingDots';
import socketService from '@/services/socket.service';
import { useAppSelector } from '@/store/hooks';
import { theme } from '@/theme';
import { Ionicons } from '@expo/vector-icons';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ItemSupportChatViewProps {
    orderId: number;
    itemId: number;
    productName: string;
}

interface QuickAction {
    label: string;
    icon: React.ComponentProps<typeof Ionicons>['name'];
    message: string;
    color: string;
}

// ─── Quick Actions config ──────────────────────────────────────────────────────

const QUICK_ACTIONS: QuickAction[] = [
    {
        label: "Where's my item?",
        icon: 'location-outline',
        message: "Where is my item? Can you provide tracking details?",
        color: '#0891B2', // cyan
    },
    {
        label: 'Delivery estimate',
        icon: 'time-outline',
        message: "When will my item arrive? What is the estimated delivery date?",
        color: '#7C3AED', // violet
    },
    {
        label: 'Return / Refund',
        icon: 'return-up-back-outline',
        message: "I would like to return this item and get a refund.",
        color: '#D97706', // amber
    },
    {
        label: 'Cancel my order',
        icon: 'close-circle-outline',
        message: "I want to cancel this order item.",
        color: '#DC2626', // red
    },
    {
        label: 'Item is damaged / wrong',
        icon: 'alert-circle-outline',
        message: "My item arrived damaged / defective / wrong. I need help.",
        color: '#EA580C', // orange
    },
    {
        label: 'I need my invoice',
        icon: 'receipt-outline',
        message: "Can I get the invoice / receipt for this order?",
        color: '#059669', // emerald
    },
    {
        label: 'Contact Supplier',
        icon: 'storefront-outline',
        message: "I want to contact the supplier / seller for this item.",
        color: theme.colors.primary[500],
    },
];

// ─── Status Banner config ──────────────────────────────────────────────────────

function getStatusConfig(status: string | null): { label: string; color: string; bg: string; icon: React.ComponentProps<typeof Ionicons>['name'] } {
    switch (status) {
        case 'processing':
            return { label: 'Order is being prepared', color: '#92400E', bg: '#FEF3C7', icon: 'hourglass-outline' };
        case 'shipped':
        case 'in_transit':
            return { label: 'Your item is on its way', color: '#065F46', bg: '#D1FAE5', icon: 'bicycle-outline' };
        case 'delivered':
            return { label: 'Your item was delivered', color: '#1E3A5F', bg: '#DBEAFE', icon: 'checkmark-circle-outline' };
        case 'canceled':
        case 'cancelled':
            return { label: 'This order was cancelled', color: '#7F1D1D', bg: '#FEE2E2', icon: 'close-circle-outline' };
        case 'completed':
            return { label: 'Order completed', color: '#065F46', bg: '#D1FAE5', icon: 'checkmark-done-outline' };
        default:
            return { label: 'Checking order status…', color: '#374151', bg: '#F3F4F6', icon: 'information-circle-outline' };
    }
}

// ─── Component ────────────────────────────────────────────────────────────────

export const ItemSupportChatView = ({ orderId, itemId, productName }: ItemSupportChatViewProps) => {
    const [messages, setMessages] = useState<ItemSupportMessage[]>([]);
    const [conversationId, setConversationId] = useState<number | null>(null);
    const [orderStatus, setOrderStatus] = useState<string | null>(null);
    const [supplierName, setSupplierName] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const scrollViewRef = useRef<ScrollView>(null);
    const activeTempMessagesRef = useRef<Set<number>>(new Set());

    // Banner fade-in
    const bannerOpacity = useRef(new Animated.Value(0)).current;

    // Read customer identity from Redux for socket authentication
    const { user: customerData } = useAppSelector((state) => state.auth);
    const customerId = customerData?.id;

    // ─── Lifecycle ───────────────────────────────────────────────────────────

    useEffect(() => {
        fetchConversation();
    }, [orderId, itemId]);

    // Fade in the status banner once loaded
    useEffect(() => {
        if (!loading && orderStatus) {
            Animated.timing(bannerOpacity, {
                toValue: 1,
                duration: 400,
                useNativeDriver: true,
            }).start();
        }
    }, [loading, orderStatus]);

    // Socket.IO real-time integration
    useEffect(() => {
        if (!customerId || !itemId) return;

        const socketToken = `customer_${customerId}`;
        socketService.connect(socketToken, 'customer');

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
                    if (newMessage.sender_type === 'customer') {
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
    }, [itemId, customerId]);

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
            const response = await ordersApi.getItemSupportConversation(orderId, itemId);
            const convoData = response.data;

            setConversationId(convoData.conversation_id);
            setMessages(convoData.messages || []);
            setOrderStatus(convoData.b2b_order_status ?? convoData.status ?? null);
            setSupplierName(convoData.supplier_name ?? null);

            if (convoData.conversation_id) {
                ordersApi.markItemSupportRead(orderId, itemId, convoData.conversation_id).catch(() => { });
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
            sender_type: 'customer',
            sender_name: 'You',
            is_read: false,
            created_at: new Date().toISOString(),
        };

        setMessages(prev => [...prev, tempMessage]);

        try {
            setSending(true);
            const response = await ordersApi.sendItemSupportMessage(orderId, itemId, text);

            const data = response.data;
            const newMsgs: ItemSupportMessage[] = [];

            if (data.customer_message) {
                newMsgs.push({
                    id: data.customer_message.id,
                    message: data.customer_message.message,
                    sender_type: 'customer',
                    sender_name: 'You',
                    is_read: false,
                    created_at: data.customer_message.created_at,
                });
            }

            if (data.ai_reply) {
                newMsgs.push({
                    id: data.ai_reply.id,
                    message: data.ai_reply.message,
                    sender_type: 'ai',
                    sender_name: 'AI Assistant',
                    is_read: false,
                    created_at: data.ai_reply.created_at,
                });
            }

            setMessages(prev => {
                const filtered = prev.filter(msg => msg.id !== tempId);
                const combined = [...filtered, ...newMsgs];
                return combined.filter((msg, idx, self) =>
                    self.findIndex(m => m.id === msg.id) === idx
                );
            });

        } catch (err: any) {
            console.error('Failed to send support message:', err);
            setError('Failed to send message');
            setMessages(prev => prev.filter(msg => msg.id !== tempId));
            activeTempMessagesRef.current.delete(tempId);
        } finally {
            setSending(false);
            activeTempMessagesRef.current.delete(tempId);
        }
    };

    const handleQuickAction = (message: string) => {
        handleSendMessage(message);
    };

    // ─── Error state ─────────────────────────────────────────────────────────

    if (error && messages.length === 0) {
        return (
            <View style={styles.centerContainer}>
                <View style={styles.errorIconWrap}>
                    <Ionicons name="alert-circle-outline" size={40} color={theme.colors.error.main} />
                </View>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={fetchConversation} activeOpacity={0.8}>
                    <Ionicons name="refresh-outline" size={16} color={theme.colors.white} />
                    <Text style={styles.retryButtonText}>Try again</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // ─── Render ───────────────────────────────────────────────────────────────

    const hasMessages = messages.length > 0;
    const statusConfig = getStatusConfig(orderStatus);

    return (
        <View style={styles.container}>

            {/* ── Item header ──────────────────────────────────────────────── */}
            <View style={styles.itemHeader}>
                <View style={styles.itemHeaderLeft}>
                    <View style={styles.itemIconWrap}>
                        <Ionicons name="cube-outline" size={14} color={theme.colors.primary[500]} />
                    </View>
                    <Text style={styles.itemName} numberOfLines={1}>
                        {productName}
                    </Text>
                </View>
                {supplierName && (
                    <View style={styles.supplierBadge}>
                        <Ionicons name="storefront-outline" size={11} color={theme.colors.text.secondary} />
                        <Text style={styles.supplierBadgeText} numberOfLines={1}>{supplierName}</Text>
                    </View>
                )}
            </View>

            {/* ── Status banner ─────────────────────────────────────────────── */}
            {!loading && orderStatus && (
                <Animated.View style={[styles.statusBanner, { backgroundColor: statusConfig.bg, opacity: bannerOpacity }]}>
                    <Ionicons name={statusConfig.icon} size={14} color={statusConfig.color} />
                    <Text style={[styles.statusBannerText, { color: statusConfig.color }]}>
                        {statusConfig.label}
                    </Text>
                </Animated.View>
            )}

            {/* ── Messages list ─────────────────────────────────────────────── */}
            <ScrollView
                ref={scrollViewRef}
                style={styles.messagesContainer}
                contentContainerStyle={[
                    styles.messagesContent,
                    !hasMessages && styles.messagesContentCenter,
                ]}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {loading ? (
                    <View style={styles.centerContainer}>
                        <ActivityIndicator size="large" color={theme.colors.primary[500]} />
                        <Text style={styles.loadingText}>Loading your conversation…</Text>
                    </View>
                ) : !hasMessages ? (
                    // ── Welcome / Empty state ──────────────────────────────────
                    <View style={styles.welcomeContainer}>
                        {/* Bot welcome card */}
                        <View style={styles.botWelcomeCard}>
                            <View style={styles.botAvatar}>
                                <Ionicons name="sparkles" size={18} color="#FFFFFF" />
                            </View>
                            <View style={styles.botMessageBubble}>
                                <View style={styles.botWelcomeHeader}>
                                    <Text style={styles.botWelcomeTitle}>AI Support Assistant</Text>
                                    <View style={styles.aiBadge}>
                                        <Text style={styles.aiBadgeText}>Powered by AI</Text>
                                    </View>
                                </View>
                                <Text style={styles.botWelcomeText}>
                                    Hi there! 👋 I'm here to help with your order item. Pick a topic below or type your question directly.
                                </Text>
                            </View>
                        </View>

                        {/* Quick actions grid */}
                        <Text style={styles.quickActionsLabel}>How can I help you?</Text>
                        <View style={styles.quickActionsGrid}>
                            {QUICK_ACTIONS.map((action) => (
                                <TouchableOpacity
                                    key={action.label}
                                    style={styles.quickActionCard}
                                    onPress={() => handleQuickAction(action.message)}
                                    activeOpacity={0.75}
                                >
                                    <View style={[styles.quickActionIconWrap, { backgroundColor: action.color + '18' }]}>
                                        <Ionicons name={action.icon} size={18} color={action.color} />
                                    </View>
                                    <Text style={styles.quickActionCardText}>{action.label}</Text>
                                    <Ionicons name="chevron-forward" size={13} color={theme.colors.gray[400]} />
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                ) : (
                    // ── Message bubbles ──────────────────────────────────────
                    <>
                        {messages.map((msg) => {
                            if (msg.sender_type === 'ai') {
                                // Custom AI bubble — distinct from supplier & customer
                                return (
                                    <View key={`item-msg-${msg.id}`} style={styles.aiBubbleRow}>
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
                                    key={`item-msg-${msg.id}`}
                                    message={msg.message}
                                    senderType={msg.sender_type === 'supplier' ? 'supplier' : 'customer'}
                                    senderName={msg.sender_name}
                                    timestamp={msg.created_at}
                                    currentUserType="customer"
                                />
                            );
                        })}

                        {/* AI typing indicator */}
                        {sending && (
                            <View style={styles.typingRow}>
                                <View style={styles.aiAvatarSmall}>
                                    <Ionicons name="sparkles" size={10} color="#FFFFFF" />
                                </View>
                                <View style={styles.typingBubble}>
                                    <AnimatedTypingDots color="#7C3AED" size={7} />
                                    <Text style={styles.typingLabel}>AI is typing</Text>
                                </View>
                            </View>
                        )}
                    </>
                )}
            </ScrollView>

            {/* ── Persistent quick-action chips (shown during active chat) ──── */}
            {hasMessages && !loading && (
                <View style={styles.chipsWrapper}>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.chipsScroll}
                    >
                        {QUICK_ACTIONS.map((action) => (
                            <TouchableOpacity
                                key={`chip-${action.label}`}
                                style={[styles.chip, { borderColor: action.color + '55' }]}
                                onPress={() => handleQuickAction(action.message)}
                                activeOpacity={0.75}
                                disabled={sending}
                            >
                                <Ionicons name={action.icon} size={13} color={action.color} />
                                <Text style={[styles.chipText, { color: action.color }]}>{action.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            )}

            {/* ── Message input ─────────────────────────────────────────────── */}
            <View style={styles.inputContainer}>
                <ChatMessageInput
                    onSend={handleSendMessage}
                    disabled={sending || loading}
                    placeholder="Ask anything about your item…"
                    hideAttachment
                />
            </View>
        </View>
    );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const AI_COLOR = '#7C3AED';

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background.default,
    },

    // ── Center / Error
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
        gap: 12,
    },
    errorIconWrap: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#FEE2E2',
        alignItems: 'center',
        justifyContent: 'center',
    },
    errorText: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.error.main,
        textAlign: 'center',
    },
    retryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        backgroundColor: theme.colors.primary[500],
        borderRadius: theme.borderRadius.full ?? 24,
    },
    retryButtonText: {
        color: theme.colors.white,
        fontWeight: theme.typography.fontWeight.semiBold,
        fontSize: theme.typography.fontSize.sm,
    },

    // ── Item header
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
        width: 24,
        height: 24,
        borderRadius: 6,
        backgroundColor: theme.colors.primary[50],
        alignItems: 'center',
        justifyContent: 'center',
    },
    itemName: {
        fontSize: theme.typography.fontSize.sm,
        fontWeight: theme.typography.fontWeight.semiBold,
        color: theme.colors.text.primary,
        flex: 1,
    },
    supplierBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: theme.colors.gray[100],
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 12,
    },
    supplierBadgeText: {
        fontSize: 10,
        color: theme.colors.text.secondary,
        fontWeight: '500',
        maxWidth: 100,
    },

    // ── Status banner
    statusBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: 7,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    statusBannerText: {
        fontSize: 12,
        fontWeight: '600',
        letterSpacing: 0.1,
    },

    // ── Messages area
    messagesContainer: {
        flex: 1,
    },
    messagesContent: {
        padding: theme.spacing.md,
        paddingBottom: theme.spacing.sm,
        gap: 4,
    },
    messagesContentCenter: {
        flexGrow: 1,
    },
    loadingText: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.text.secondary,
        marginTop: 8,
    },

    // ── Welcome / empty state
    welcomeContainer: {
        flex: 1,
        paddingTop: theme.spacing.sm,
    },
    botWelcomeCard: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: theme.spacing.xl,
        alignItems: 'flex-start',
    },
    botAvatar: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: AI_COLOR,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: AI_COLOR,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 4,
    },
    botMessageBubble: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.md,
        borderTopLeftRadius: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 2,
    },
    botWelcomeHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 6,
    },
    botWelcomeTitle: {
        fontSize: theme.typography.fontSize.sm,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.text.primary,
    },
    aiBadge: {
        backgroundColor: AI_COLOR + '18',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
    },
    aiBadgeText: {
        fontSize: 9,
        fontWeight: '700',
        color: AI_COLOR,
        textTransform: 'uppercase',
        letterSpacing: 0.4,
    },
    botWelcomeText: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.text.secondary,
        lineHeight: 20,
    },

    // ── Quick actions grid (empty state)
    quickActionsLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: theme.colors.text.secondary,
        textTransform: 'uppercase',
        letterSpacing: 0.6,
        marginBottom: 12,
    },
    quickActionsGrid: {
        gap: 8,
    },
    quickActionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: 14,
        borderRadius: theme.borderRadius.md,
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 1,
    },
    quickActionIconWrap: {
        width: 36,
        height: 36,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    quickActionCardText: {
        flex: 1,
        fontSize: theme.typography.fontSize.sm,
        fontWeight: theme.typography.fontWeight.medium,
        color: theme.colors.text.primary,
    },

    // ── AI bubble (distinct from ChatMessageBubble)
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

    // ── Typing indicator
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
    },

    // ── Persistent chips row (active chat)
    chipsWrapper: {
        borderTopWidth: 1,
        borderTopColor: theme.colors.border.card_light,
        paddingTop: 8,
        paddingBottom: 4,
        backgroundColor: theme.colors.background.default,
    },
    chipsScroll: {
        paddingHorizontal: theme.spacing.md,
        gap: 8,
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1.5,
        backgroundColor: '#FFFFFF',
    },
    chipText: {
        fontSize: 12,
        fontWeight: '600',
    },

    // ── Input bar
    inputContainer: {
        padding: theme.spacing.sm,
        paddingBottom: Platform.OS === 'ios' ? 24 : 16,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border.card_light,
        backgroundColor: theme.colors.background.default,
    },
});
