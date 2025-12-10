/**
 * OrderDetailScreen Component
 * Displays detailed information about a single order
 */

import React, { useEffect, useState, useCallback } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    ScrollView, 
    ActivityIndicator, 
    RefreshControl,
    TouchableOpacity,
    Alert
} from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from 'expo-router';
import { theme } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { ordersApi, Order } from '@/services/api/orders.api';
import { formatters } from '@/shared/utils/formatters';
import { useToast } from '@/shared/components/Toast';
import { OrderItemCard } from '../components/OrderItemCard';
import { OrderSummaryCard } from '../components/OrderSummaryCard';
import { OrderAddressCard } from '../components/OrderAddressCard';

/**
 * Get status color based on order status
 */
const getStatusColor = (status: string): string => {
    const statusLower = status.toLowerCase();
    
    switch (statusLower) {
        case 'pending':
        case 'pending_payment':
            return '#FFCC00'; // Yellow
        case 'processing':
        case 'completed':
            return '#59A600'; // Green
        case 'canceled':
        case 'fraud':
            return '#FF4848'; // Red
        case 'closed':
            return '#000000'; // Black
        default:
            return theme.colors.gray[500]; // Gray
    }
};

export const OrderDetailScreen: React.FC = () => {
    const { t } = useTranslation();
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const { showToast } = useToast();

    const [order, setOrder] = useState<Order | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isCanceling, setIsCanceling] = useState(false);
    const [isReordering, setIsReordering] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadOrder = useCallback(async (showLoader = true) => {
        if (!id) {
            setError('Order ID is required');
            setIsLoading(false);
            return;
        }

        try {
            if (showLoader) {
                setIsLoading(true);
            }
            setError(null);
            const response = await ordersApi.getOrder(parseInt(id));
            setOrder(response.data);
        } catch (err: any) {
            console.error('[OrderDetailScreen] Error loading order:', err);
            setError(err.message || 'Failed to load order details');
            showToast({
                message: err.message || 'Failed to load order details',
                type: 'error',
            });
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [id, showToast]);

    useEffect(() => {
        loadOrder();
    }, [loadOrder]);

    useFocusEffect(
        useCallback(() => {
            // Reload order when screen comes into focus
            loadOrder(false);
        }, [loadOrder])
    );

    const handleRefresh = useCallback(() => {
        setIsRefreshing(true);
        loadOrder(false);
    }, [loadOrder]);

    const handleCancelOrder = useCallback(() => {
        if (!order) return;

        Alert.alert(
            t('orders.cancelOrder', 'Cancel Order'),
            t('orders.cancelConfirm', 'Are you sure you want to cancel this order?'),
            [
                {
                    text: t('common.cancel', 'Cancel'),
                    style: 'cancel',
                },
                {
                    text: t('orders.confirmCancel', 'Yes, Cancel'),
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setIsCanceling(true);
                            await ordersApi.cancelOrder(order.id);
                            showToast({
                                message: t('messages.orderCancelled', 'Order cancelled'),
                                type: 'success',
                            });
                            // Reload order to get updated status
                            loadOrder(false);
                        } catch (err: any) {
                            console.error('[OrderDetailScreen] Error canceling order:', err);
                            showToast({
                                message: err.message || 'Failed to cancel order',
                                type: 'error',
                            });
                        } finally {
                            setIsCanceling(false);
                        }
                    },
                },
            ]
        );
    }, [order, t, showToast, loadOrder]);

    const handleReorder = useCallback(async () => {
        if (!order) return;

        try {
            setIsReordering(true);
            await ordersApi.reorder(order.id);
            showToast({
                message: t('orders.reorderSuccess', 'Items added to cart'),
                type: 'success',
            });
            // Navigate to cart
            router.push('/cart');
        } catch (err: any) {
            console.error('[OrderDetailScreen] Error reordering:', err);
            showToast({
                message: err.message || 'Failed to reorder items',
                type: 'error',
            });
        } finally {
            setIsReordering(false);
        }
    }, [order, t, showToast, router]);

    if (isLoading) {
        return (
            <>
                <Stack.Screen 
                    options={{ 
                        title: t('orders.orderDetails', 'Order Details'),
                        headerBackTitle: t('common.back', 'Back'),
                    }} 
                />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.colors.primary[500]} />
                    <Text style={styles.loadingText}>
                        {t('orders.loading', 'Loading order details...')}
                    </Text>
                </View>
            </>
        );
    }

    if (error || !order) {
        return (
            <>
                <Stack.Screen 
                    options={{ 
                        title: t('orders.orderDetails', 'Order Details'),
                        headerBackTitle: t('common.back', 'Back'),
                    }} 
                />
                <View style={styles.errorContainer}>
                    <Ionicons 
                        name="alert-circle-outline" 
                        size={64} 
                        color={theme.colors.error.main} 
                    />
                    <Text style={styles.errorText}>
                        {error || t('orders.loadError', 'Failed to load order details')}
                    </Text>
                    <TouchableOpacity 
                        style={styles.retryButton}
                        onPress={() => loadOrder()}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.retryButtonText}>
                            {t('orders.retry', 'Tap to retry')}
                        </Text>
                    </TouchableOpacity>
                </View>
            </>
        );
    }

    const statusColor = getStatusColor(order.status);
    const formattedDate = formatters.formatDate(order.created_at, 'long');
    // Only show cancel button for pending orders
    const orderStatusLower = order.status.toLowerCase();
    const canCancel = (orderStatusLower === 'pending' || orderStatusLower === 'pending_payment') && 
                      order.can_cancel !== false;
    const canReorder = order.can_reorder !== false;

    return (
        <>
            <Stack.Screen 
                options={{ 
                    title: `#${order.increment_id}`,
                    headerBackTitle: t('common.back', 'Back'),
                }} 
            />
            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.content}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={handleRefresh}
                        colors={[theme.colors.primary[500]]}
                        tintColor={theme.colors.primary[500]}
                    />
                }
            >
                {/* Order Header Card */}
                <View style={styles.headerCard}>
                    <View style={styles.headerRow}>
                        <View style={styles.headerLeft}>
                            <Text style={styles.orderNumber}>
                                {t('orders.orderNumber', 'Order #')}{order.increment_id}
                            </Text>
                            <Text style={styles.orderDate}>
                                {t('orders.placedOn', 'Placed on')} {formattedDate}
                            </Text>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
                            <Text style={styles.statusText}>
                                {order.status_label || order.status}
                            </Text>
                        </View>
                    </View>

                    {/* Action Buttons */}
                    {(canCancel || canReorder) && (
                        <View style={styles.actionButtons}>
                            {canReorder && (
                                <TouchableOpacity
                                    style={[styles.actionButton, styles.reorderButton]}
                                    onPress={handleReorder}
                                    disabled={isReordering}
                                    activeOpacity={0.7}
                                >
                                    {isReordering ? (
                                        <ActivityIndicator size="small" color={theme.colors.white} />
                                    ) : (
                                        <>
                                            <Ionicons 
                                                name="repeat-outline" 
                                                size={18} 
                                                color={theme.colors.white} 
                                            />
                                            <Text style={styles.actionButtonText}>
                                                {t('orders.reorder', 'Reorder')}
                                            </Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            )}
                            {canCancel && (
                                <TouchableOpacity
                                    style={[styles.actionButton, styles.cancelButton]}
                                    onPress={handleCancelOrder}
                                    disabled={isCanceling}
                                    activeOpacity={0.7}
                                >
                                    {isCanceling ? (
                                        <ActivityIndicator size="small" color={theme.colors.error.main} />
                                    ) : (
                                        <>
                                            <Ionicons 
                                                name="close-circle-outline" 
                                                size={18} 
                                                color={theme.colors.error.main} 
                                            />
                                            <Text style={[styles.actionButtonText, styles.cancelButtonText]}>
                                                {t('orders.cancel', 'Cancel Order')}
                                            </Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            )}
                        </View>
                    )}
                </View>

                {/* Order Items */}
                {order.items && order.items.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>
                            {t('orders.itemsOrdered', 'Items Ordered')} ({order.items.length})
                        </Text>
                        {order.items.map((item) => (
                            <OrderItemCard key={item.id} item={item} />
                        ))}
                    </View>
                )}

                {/* Order Summary */}
                <OrderSummaryCard order={order} />

                {/* Shipping Address */}
                {order.shipping_address && (
                    <OrderAddressCard 
                        address={order.shipping_address} 
                        type="shipping" 
                    />
                )}

                {/* Billing Address */}
                {order.billing_address && (
                    <OrderAddressCard 
                        address={order.billing_address} 
                        type="billing" 
                    />
                )}

                {/* Payment & Shipping Methods */}
                {(order.payment_title || order.shipping_title) && (
                    <View style={styles.methodsCard}>
                        <Text style={styles.sectionTitle}>
                            {t('orders.paymentShipping', 'Payment & Shipping')}
                        </Text>
                        {order.payment_title && (
                            <View style={styles.methodRow}>
                                <Ionicons 
                                    name="card-outline" 
                                    size={20} 
                                    color={theme.colors.text.secondary} 
                                />
                                <View style={styles.methodInfo}>
                                    <Text style={styles.methodLabel}>
                                        {t('orders.paymentMethod', 'Payment Method')}
                                    </Text>
                                    <Text style={styles.methodValue}>{order.payment_title}</Text>
                                </View>
                            </View>
                        )}
                        {order.shipping_title && (
                            <View style={styles.methodRow}>
                                <Ionicons 
                                    name="car-outline" 
                                    size={20} 
                                    color={theme.colors.text.secondary} 
                                />
                                <View style={styles.methodInfo}>
                                    <Text style={styles.methodLabel}>
                                        {t('orders.shippingMethod', 'Shipping Method')}
                                    </Text>
                                    <Text style={styles.methodValue}>{order.shipping_title}</Text>
                                </View>
                            </View>
                        )}
                    </View>
                )}

                {/* Bottom Spacing */}
                <View style={styles.bottomSpacing} />
            </ScrollView>
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background.default,
    },
    content: {
        paddingVertical: theme.spacing.md,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.background.default,
        gap: theme.spacing.md,
    },
    loadingText: {
        fontSize: theme.typography.fontSize.base,
        color: theme.colors.text.secondary,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.background.default,
        padding: theme.spacing.xl,
        gap: theme.spacing.md,
    },
    errorText: {
        fontSize: theme.typography.fontSize.base,
        color: theme.colors.text.secondary,
        textAlign: 'center',
    },
    retryButton: {
        marginTop: theme.spacing.md,
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
        backgroundColor: theme.colors.primary[500],
        borderRadius: theme.borderRadius.md,
    },
    retryButtonText: {
        fontSize: theme.typography.fontSize.base,
        fontWeight: theme.typography.fontWeight.semiBold,
        color: theme.colors.white,
    },
    headerCard: {
        backgroundColor: theme.colors.white,
        borderRadius: theme.borderRadius.md,
        marginHorizontal: theme.spacing.md,
        marginBottom: theme.spacing.md,
        padding: theme.spacing.lg,
        borderWidth: 1,
        borderColor: theme.colors.gray[200],
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: theme.spacing.md,
    },
    headerLeft: {
        flex: 1,
    },
    orderNumber: {
        fontSize: theme.typography.fontSize.xl,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.xs,
    },
    orderDate: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.text.secondary,
    },
    statusBadge: {
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.xs,
        borderRadius: theme.borderRadius.full,
        marginLeft: theme.spacing.sm,
    },
    statusText: {
        fontSize: theme.typography.fontSize.xs,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.white,
        textTransform: 'uppercase',
    },
    actionButtons: {
        flexDirection: 'row',
        gap: theme.spacing.sm,
        marginTop: theme.spacing.md,
        paddingTop: theme.spacing.md,
        borderTopWidth: 1,
        borderTopColor: theme.colors.gray[200],
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.spacing.xs,
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.md,
        borderRadius: theme.borderRadius.md,
    },
    reorderButton: {
        backgroundColor: theme.colors.primary[500],
    },
    cancelButton: {
        backgroundColor: theme.colors.white,
        borderWidth: 1,
        borderColor: theme.colors.error.main,
    },
    actionButtonText: {
        fontSize: theme.typography.fontSize.base,
        fontWeight: theme.typography.fontWeight.semiBold,
        color: theme.colors.white,
    },
    cancelButtonText: {
        color: theme.colors.error.main,
    },
    section: {
        marginBottom: theme.spacing.md,
    },
    sectionTitle: {
        fontSize: theme.typography.fontSize.lg,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.text.primary,
        marginHorizontal: theme.spacing.md,
        marginBottom: theme.spacing.sm,
    },
    methodsCard: {
        backgroundColor: theme.colors.white,
        borderRadius: theme.borderRadius.md,
        marginHorizontal: theme.spacing.md,
        marginVertical: theme.spacing.sm,
        padding: theme.spacing.lg,
        borderWidth: 1,
        borderColor: theme.colors.gray[200],
    },
    methodRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: theme.spacing.md,
        marginTop: theme.spacing.md,
    },
    methodInfo: {
        flex: 1,
    },
    methodLabel: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.text.secondary,
        marginBottom: theme.spacing.xs,
    },
    methodValue: {
        fontSize: theme.typography.fontSize.base,
        fontWeight: theme.typography.fontWeight.medium,
        color: theme.colors.text.primary,
    },
    bottomSpacing: {
        height: theme.spacing.xl,
    },
});

