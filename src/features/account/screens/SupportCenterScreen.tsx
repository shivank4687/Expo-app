import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Order, ordersApi } from '@/services/api/orders.api';
import { TopHeader } from '@/shared/components/TopHeader';
import { theme } from '@/theme';
import { formatters } from '@/shared/utils/formatters';

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_ORDERS = 5;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getStatusConfig = (status: string): { label: string; color: string; bg: string } => {
    switch (status.toLowerCase()) {
        case 'pending':
        case 'pending_payment':
            return { label: 'Pending', color: '#92400E', bg: '#FEF3C7' };
        case 'processing':
            return { label: 'Processing', color: '#1E40AF', bg: '#DBEAFE' };
        case 'shipped':
        case 'in_transit':
            return { label: 'Shipped', color: '#065F46', bg: '#D1FAE5' };
        case 'completed':
            return { label: 'Delivered', color: '#065F46', bg: '#D1FAE5' };
        case 'canceled':
        case 'cancelled':
            return { label: 'Cancelled', color: '#991B1B', bg: '#FEE2E2' };
        case 'closed':
            return { label: 'Closed', color: '#374151', bg: '#F3F4F6' };
        default:
            return { label: status, color: '#374151', bg: '#F3F4F6' };
    }
};

// ─── Sub-components ───────────────────────────────────────────────────────────

interface SupportOrderCardProps {
    order: Order;
    onIssuePress: (order: Order) => void;
}

const SupportOrderCard: React.FC<SupportOrderCardProps> = ({ order, onIssuePress }) => {
    const statusCfg = getStatusConfig(order.status);
    const formattedDate = formatters.formatDate(order.created_at, 'long');
    const itemCount = order.total_qty_ordered || order.total_item_count || 0;

    return (
        <View style={styles.card}>
            {/* Top row — order number + status */}
            <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                    <View style={styles.orderNumberRow}>
                        <Ionicons name="receipt-outline" size={14} color={theme.colors.primary[500]} />
                        <Text style={styles.orderNumber}>#{order.increment_id}</Text>
                    </View>
                </View>
                <View style={[styles.statusChip, { backgroundColor: statusCfg.bg }]}>
                    <Text style={[styles.statusChipText, { color: statusCfg.color }]}>
                        {statusCfg.label}
                    </Text>
                </View>
            </View>

            {/* Meta row — date · items · total */}
            <View style={styles.cardMeta}>
                <View style={styles.metaItem}>
                    <Ionicons name="calendar-outline" size={12} color={theme.colors.text.secondary} />
                    <Text style={styles.metaText}>{formattedDate}</Text>
                </View>
                <View style={styles.metaDot} />
                <View style={styles.metaItem}>
                    <Ionicons name="cube-outline" size={12} color={theme.colors.text.secondary} />
                    <Text style={styles.metaText}>
                        {itemCount} {itemCount === 1 ? 'item' : 'items'}
                    </Text>
                </View>
                <View style={styles.metaDot} />
                <Text style={styles.metaTotal}>{order.formatted_grand_total}</Text>
            </View>

            {/* Issue button */}
            <TouchableOpacity
                style={styles.issueButton}
                onPress={() => onIssuePress(order)}
                activeOpacity={0.7}
            >
                <View style={styles.issueButtonLeft}>
                    <View style={styles.issueIconWrap}>
                        <Ionicons name="chatbubble-ellipses-outline" size={14} color={theme.colors.primary[500]} />
                    </View>
                    <Text style={styles.issueButtonText}>I have an issue with this order</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={theme.colors.primary[500]} />
            </TouchableOpacity>
        </View>
    );
};

// ─── Empty State ──────────────────────────────────────────────────────────────

const EmptyState: React.FC<{ onBrowse: () => void }> = ({ onBrowse }) => (
    <View style={styles.emptyContainer}>
        <View style={styles.emptyIconWrap}>
            <Ionicons name="headset-outline" size={40} color={theme.colors.primary[500]} />
        </View>
        <Text style={styles.emptyTitle}>No orders yet</Text>
        <Text style={styles.emptySubtitle}>
            Support is available once you've placed your first order. Browse our catalogue to get started.
        </Text>
        <TouchableOpacity style={styles.browseButton} onPress={onBrowse} activeOpacity={0.8}>
            <Text style={styles.browseButtonText}>Browse Products</Text>
        </TouchableOpacity>
    </View>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────

export const SupportCenterScreen: React.FC = () => {
    const router = useRouter();

    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchOrders = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await ordersApi.getOrders({
                limit: MAX_ORDERS,
                sort: 'id',
                order: 'desc',
            });
            setOrders(response.data ?? []);
        } catch (err: any) {
            console.error('[SupportCenterScreen] Failed to fetch orders:', err);
            setError(err.message || 'Failed to load orders');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    const handleIssuePress = useCallback((order: Order) => {
        router.push(`/orders/${order.id}`);
    }, [router]);

    // ── Render ────────────────────────────────────────────────────────────────

    const renderContent = () => {
        if (loading) {
            return (
                <View style={styles.centeredContainer}>
                    <ActivityIndicator size="large" color={theme.colors.primary[500]} />
                    <Text style={styles.loadingText}>Loading your orders…</Text>
                </View>
            );
        }

        if (error) {
            return (
                <View style={styles.centeredContainer}>
                    <View style={styles.errorIconWrap}>
                        <Ionicons name="alert-circle-outline" size={36} color={theme.colors.error.main} />
                    </View>
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={fetchOrders} activeOpacity={0.8}>
                        <Ionicons name="refresh-outline" size={15} color="#FFFFFF" />
                        <Text style={styles.retryButtonText}>Try again</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        if (orders.length === 0) {
            return <EmptyState onBrowse={() => router.push('/')} />;
        }

        return (
            <>
                {/* ── Section header ── */}
                <View style={styles.sectionHeader}>
                    <View style={styles.sectionHeaderLeft}>
                        <Text style={styles.sectionTitle}>Need help with an order?</Text>
                        <Text style={styles.sectionSubtitle}>
                            Select the order you'd like support for.
                        </Text>
                    </View>
                    <TouchableOpacity
                        style={styles.viewAllChip}
                        onPress={() => router.push('/orders-list')}
                        activeOpacity={0.75}
                    >
                        <Text style={styles.viewAllChipText}>View all</Text>
                        <Ionicons name="arrow-forward" size={11} color="#FFFFFF" />
                    </TouchableOpacity>
                </View>

                {/* ── Order cards ── */}
                {orders.map((order) => (
                    <SupportOrderCard
                        key={order.id}
                        order={order}
                        onIssuePress={handleIssuePress}
                    />
                ))}

                {/* ── Footer note ── */}
                <View style={styles.footerNote}>
                    <Ionicons name="information-circle-outline" size={13} color={theme.colors.text.secondary} />
                    <Text style={styles.footerNoteText}>
                        Showing your {orders.length} most recent order{orders.length !== 1 ? 's' : ''}. Once inside an order, tap any item to open a support chat.
                    </Text>
                </View>
            </>
        );
    };

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <TopHeader
                title="Support Center"
                onBack={() => router.back()}
                backgroundColor={theme.colors.background.default}
            />
            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.contentContainer}
                showsVerticalScrollIndicator={false}
            >
                {renderContent()}
            </ScrollView>
        </>
    );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background.default,
    },
    contentContainer: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 32,
        flexGrow: 1,
    },

    // ── Loading / centered
    centeredContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 80,
        gap: 12,
    },
    loadingText: {
        fontFamily: Platform.OS === 'ios' ? 'Inter' : 'sans-serif',
        fontSize: 14,
        color: theme.colors.text.secondary,
    },

    // ── Error state
    errorIconWrap: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#FEE2E2',
        alignItems: 'center',
        justifyContent: 'center',
    },
    errorText: {
        fontFamily: Platform.OS === 'ios' ? 'Inter' : 'sans-serif',
        fontSize: 14,
        color: theme.colors.error.main,
        textAlign: 'center',
        paddingHorizontal: 24,
    },
    retryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: theme.colors.primary[500],
        borderRadius: 20,
        marginTop: 4,
    },
    retryButtonText: {
        fontFamily: Platform.OS === 'ios' ? 'Inter' : 'sans-serif',
        fontWeight: '600',
        fontSize: 13,
        color: '#FFFFFF',
    },

    // ── Empty state
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 64,
        paddingHorizontal: 32,
        gap: 12,
    },
    emptyIconWrap: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(0, 97, 94, 0.08)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 4,
    },
    emptyTitle: {
        fontFamily: Platform.OS === 'ios' ? 'Inter' : 'sans-serif',
        fontWeight: '700',
        fontSize: 18,
        color: '#000000',
        textAlign: 'center',
    },
    emptySubtitle: {
        fontFamily: Platform.OS === 'ios' ? 'Inter' : 'sans-serif',
        fontWeight: '400',
        fontSize: 14,
        color: theme.colors.text.secondary,
        textAlign: 'center',
        lineHeight: 20,
    },
    browseButton: {
        marginTop: 8,
        paddingHorizontal: 24,
        paddingVertical: 12,
        backgroundColor: theme.colors.primary[500],
        borderRadius: 8,
    },
    browseButtonText: {
        fontFamily: Platform.OS === 'ios' ? 'Inter' : 'sans-serif',
        fontWeight: '600',
        fontSize: 14,
        color: '#FFFFFF',
    },

    // ── Section header
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: 14,
        gap: 12,
    },
    sectionHeaderLeft: {
        flex: 1,
        gap: 3,
    },
    sectionTitle: {
        fontFamily: Platform.OS === 'ios' ? 'Inter' : 'sans-serif',
        fontWeight: '700',
        fontSize: 16,
        color: '#000000',
        lineHeight: 20,
    },
    sectionSubtitle: {
        fontFamily: Platform.OS === 'ios' ? 'Inter' : 'sans-serif',
        fontWeight: '400',
        fontSize: 13,
        color: theme.colors.text.secondary,
        lineHeight: 18,
    },
    viewAllChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#BB5625',
        borderRadius: 50,
        paddingVertical: 5,
        paddingHorizontal: 10,
        height: 26,
    },
    viewAllChipText: {
        fontFamily: Platform.OS === 'ios' ? 'Inter' : 'sans-serif',
        fontWeight: '600',
        fontSize: 11,
        color: '#FFFFFF',
    },

    // ── Order card
    card: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E9E3D3',
        borderRadius: 8,
        marginBottom: 10,
        overflow: 'hidden',
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 12,
        paddingTop: 12,
        paddingBottom: 6,
    },
    cardHeaderLeft: {
        flex: 1,
        marginRight: 8,
    },
    orderNumberRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    orderNumber: {
        fontFamily: Platform.OS === 'ios' ? 'Inter' : 'sans-serif',
        fontWeight: '700',
        fontSize: 15,
        color: '#000000',
    },
    statusChip: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 20,
    },
    statusChipText: {
        fontFamily: Platform.OS === 'ios' ? 'Inter' : 'sans-serif',
        fontWeight: '600',
        fontSize: 11,
    },

    // ── Card meta
    cardMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        paddingHorizontal: 12,
        paddingBottom: 10,
        gap: 4,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
    },
    metaText: {
        fontFamily: Platform.OS === 'ios' ? 'Inter' : 'sans-serif',
        fontWeight: '400',
        fontSize: 12,
        color: theme.colors.text.secondary,
    },
    metaDot: {
        width: 3,
        height: 3,
        borderRadius: 1.5,
        backgroundColor: theme.colors.gray[400] ?? '#9CA3AF',
    },
    metaTotal: {
        fontFamily: Platform.OS === 'ios' ? 'Inter' : 'sans-serif',
        fontWeight: '600',
        fontSize: 12,
        color: '#000000',
    },

    // ── Issue button
    issueButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderTopWidth: 1,
        borderTopColor: '#E9E3D3',
        backgroundColor: 'rgba(0, 97, 94, 0.04)',
    },
    issueButtonLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flex: 1,
    },
    issueIconWrap: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: 'rgba(0, 97, 94, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    issueButtonText: {
        fontFamily: Platform.OS === 'ios' ? 'Inter' : 'sans-serif',
        fontWeight: '600',
        fontSize: 13,
        color: theme.colors.primary[500],
        flex: 1,
    },

    // ── Footer note
    footerNote: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 6,
        marginTop: 6,
        paddingHorizontal: 4,
    },
    footerNoteText: {
        fontFamily: Platform.OS === 'ios' ? 'Inter' : 'sans-serif',
        fontWeight: '400',
        fontSize: 12,
        color: theme.colors.text.secondary,
        lineHeight: 17,
        flex: 1,
    },
});
