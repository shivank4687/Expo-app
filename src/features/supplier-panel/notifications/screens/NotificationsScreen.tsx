import { COLORS } from '@/features/supplier-panel/styles';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useState, useCallback } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { useToast } from '@/shared/components/Toast';
import { notificationsApi } from '../api/notifications.api';
import { NotificationItem } from '../types/notifications.types';
import { NotificationListCard } from '../components/NotificationListCard';

export function NotificationsScreen() {
    const router = useRouter();
    const { showToast } = useToast();

    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [identityNotifications, setIdentityNotifications] = useState<NotificationItem[]>([]);
    const [rfqNotifications, setRfqNotifications] = useState<NotificationItem[]>([]);

    const fetchNotifications = async (silent = false) => {
        if (!silent) setIsLoading(true);
        try {
            const data = await notificationsApi.getNotifications(10);

            // Format order notifications 
            setNotifications(data.order_notifications?.data || []);
            setIdentityNotifications(data.identity_notifications || []);
            setRfqNotifications(data.rfq_notifications || []);
        } catch (error) {
            console.error('Error fetching notifications:', error);
            showToast({ message: 'Failed to load notifications', type: 'error' });
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    // Re-fetch every time the screen is focused (not just on first mount)
    useFocusEffect(
        useCallback(() => {
            fetchNotifications();
        }, [])
    );

    const onRefresh = useCallback(() => {
        setIsRefreshing(true);
        fetchNotifications(true); // silent — RefreshControl spinner is already visible
    }, []);

    const handleMarkAllRead = async () => {
        try {
            await notificationsApi.markAllAsRead();
            showToast({ message: 'All notifications marked as read', type: 'success' });
            fetchNotifications(true); // silent — no full-screen spinner needed
        } catch (error) {
            showToast({ message: 'Failed to update notifications', type: 'error' });
        }
    };

    const handleNotificationPress = async (notification: NotificationItem) => {
        // Mark as read
        if (!notification.supplier_read) {
            try {
                if (notification.order_id && !notification.type?.includes('identity') && !['message', 'quote_status', 'rfq'].includes(notification.type)) {
                    await notificationsApi.markOrderAsRead(notification.id);
                } else {
                    await notificationsApi.markRfqAsRead(notification.id);
                }
            } catch (error) {
                console.error('Failed to mark notification as read:', error);
            }
        }

        // ── Identity notifications ────────────────────────────────────────────
        const isIdentity = notification.type?.includes('identity') ||
            notification.title?.toLowerCase().includes('identity') ||
            notification.title?.toLowerCase().includes('verification');

        if (isIdentity) {
            router.push({
                pathname: '/(supplier-drawer)/(supplier-tabs)/profile',
                params: { expandLegal: '1' },
            } as any);
            return;
        }

        // ── Order notifications ───────────────────────────────────────────────
        // notification.order_id = global Bagisto orders.id
        // notification.marketplace_order_id = b2b_marketplace_orders.id  ← what OrderController queries
        if (notification.order_id) {
            const navOrderId = (notification as any).marketplace_order_id ?? notification.order_id;
            router.push(`/(supplier-drawer)/order-details?orderId=${navOrderId}&from=notifications` as any);
            return;
        }

        // ── RFQ notifications ─────────────────────────────────────────────────
        // Helper: extract quoteId + productId from the web action_url.
        //
        // The backend generates path-based URLs via the route pattern:
        //   {status?}/view/{id}/item/{product_id}
        // e.g. https://artemayor.com/.../answered/view/6/item/8#tab=messages
        //
        // Fallback: also handles query-param style ?id=6&product_id=8
        const parseRFQIds = (url: string | null): { quoteId: number; productId: number } | null => {
            if (!url) return null;
            try {
                // Strip hash fragment before parsing
                const cleanUrl = url.split('#')[0];

                // 1️⃣  Path-based: .../view/{quoteId}/item/{productId}
                const pathMatch = cleanUrl.match(/\/view\/(\d+)\/item\/(\d+)/);
                if (pathMatch) {
                    const quoteId = Number(pathMatch[1]);
                    const productId = Number(pathMatch[2]);
                    if (quoteId && productId) return { quoteId, productId };
                }

                // 2️⃣  Query-param-based: ?id={quoteId}&product_id={productId}
                const queryStart = cleanUrl.indexOf('?');
                if (queryStart !== -1) {
                    const params = new URLSearchParams(cleanUrl.slice(queryStart + 1));
                    const quoteId = Number(params.get('id'));
                    const productId = Number(params.get('product_id'));
                    if (quoteId && productId) return { quoteId, productId };
                }

                return null;
            } catch {
                return null;
            }
        };

        // Helper: check if the action_url targets the messages tab via hash fragment
        const urlTargetsMessages = (url: string | null): boolean => {
            if (!url) return false;
            return url.includes('#tab=messages') || url.includes('tab=messages');
        };

        const notifType = notification.type;
        const subtype = notification.subtype;

        if (notifType === 'rfq') {
            // New RFQ request for supplier → go to RFQ list filtered to 'new'
            router.push('/(supplier-drawer)/(supplier-tabs)/rfq' as any);
            return;
        }

        if (notifType === 'quote_status') {
            // Customer approved or rejected supplier's quote → RFQ Details → Quotes tab
            const ids = parseRFQIds(notification.action_url);
            if (ids) {
                router.push({
                    pathname: '/(supplier-drawer)/rfq-details',
                    params: {
                        quoteId: String(ids.quoteId),
                        productId: String(ids.productId),
                        initialTab: 'quotes',
                        from: 'notifications',
                    },
                } as any);
            } else {
                // Fallback: open RFQ list
                router.push('/(supplier-drawer)/(supplier-tabs)/rfq' as any);
            }
            return;
        }

        if (notifType === 'message' && (subtype === 'rfq_new_message' || urlTargetsMessages(notification.action_url))) {
            // New RFQ/TFQ message → RFQ Details → Messages tab
            const ids = parseRFQIds(notification.action_url);
            if (ids) {
                router.push({
                    pathname: '/(supplier-drawer)/rfq-details',
                    params: {
                        quoteId: String(ids.quoteId),
                        productId: String(ids.productId),
                        initialTab: 'messages',
                        from: 'notifications',
                    },
                } as any);
            } else {
                router.push('/(supplier-drawer)/(supplier-tabs)/rfq' as any);
            }
            return;
        }

        // Fallback for unknown types with an action_url
        if (notification.action_url) {
            console.log('Navigate to:', notification.action_url);
        }
    };

    const renderEmptyState = () => (
        <View style={styles.emptyContent}>
            <View style={styles.iconWrapper}>
                <Ionicons name="notifications-off-outline" size={64} color="#00615E" />
            </View>
            <Text style={styles.title}>No Notifications</Text>
            <Text style={styles.subtitle}>
                You're all caught up! Check back later for new updates.
            </Text>
        </View>
    );

    // Flatten all notifications into sections for FlatList
    const getSectionedData = () => {
        const sections: any[] = [];

        if (rfqNotifications.length > 0) {
            sections.push({ type: 'header', title: 'RFQ Status & Messages' });
            sections.push(...rfqNotifications);
        }

        if (identityNotifications.length > 0) {
            sections.push({ type: 'header', title: 'Identity Verification' });
            sections.push(...identityNotifications);
        }

        if (notifications.length > 0) {
            sections.push({ type: 'header', title: 'Orders' });
            sections.push(...notifications);
        }

        return sections;
    };

    const listData = getSectionedData();

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerContent}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => router.back()}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="arrow-back" size={16} color="#000000" />
                    </TouchableOpacity>

                    <View style={styles.titleContainer}>
                        <Text style={styles.headerTitle}>Notifications</Text>
                        {listData.length > 0 && (
                            <Text style={styles.itemCount}>
                                {listData.filter(i => !i.type || i.type !== 'header').length}{' '}
                                {listData.filter(i => !i.type || i.type !== 'header').length === 1 ? 'notification' : 'notifications'}
                            </Text>
                        )}
                    </View>

                    {listData.length > 0 && (
                        <TouchableOpacity onPress={handleMarkAllRead}>
                            <Text style={styles.markAllReadText}>Mark all read</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Content */}
            {isLoading ? (
                <View style={styles.loaderContainer}>
                    <ActivityIndicator size="large" color="#00615E" />
                </View>
            ) : (
                <FlatList
                    data={listData}
                    keyExtractor={(item, index) => item.id ? item.id.toString() : `header-${index}`}
                    renderItem={({ item }) => {
                        if (item.type === 'header') {
                            return (
                                <View style={styles.sectionHeader}>
                                    <Text style={styles.sectionHeaderText}>{item.title}</Text>
                                </View>
                            );
                        }

                        return (
                            <NotificationListCard
                                notification={item}
                                onPress={handleNotificationPress}
                            />
                        );
                    }}
                    ListEmptyComponent={renderEmptyState}
                    contentContainerStyle={listData.length === 0 ? styles.emptyContainer : styles.listContainer}
                    refreshControl={
                        <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#00615E" />
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        backgroundColor: COLORS.background,
        paddingTop: 60,
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        minHeight: 32,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        width: 32,
        height: 32,
        backgroundColor: COLORS.white,
        borderRadius: 8,
        padding: 8,
    },
    titleContainer: {
        flex: 1,
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 2,
    },
    headerTitle: {
        fontFamily: 'Inter',
        fontWeight: '400',
        fontSize: 16,
        color: '#000000',
    },
    itemCount: {
        fontSize: 12,
        color: COLORS.textSecondary,
        fontWeight: '400',
    },
    headerSpacer: {
        width: 36,
    },
    markAllReadText: {
        fontFamily: 'Inter',
        fontWeight: '500',
        fontSize: 12,
        color: '#2563EB',
    },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContainer: {
        paddingBottom: 24,
    },
    emptyContainer: {
        flexGrow: 1,
    },
    emptyContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
        gap: 16,
    },
    sectionHeader: {
        backgroundColor: '#F9FAFB', // gray-50
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    sectionHeaderText: {
        fontFamily: 'Inter',
        fontWeight: '600',
        fontSize: 12,
        color: '#6B7280', // gray-500
        textTransform: 'uppercase',
    },
    iconWrapper: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#E0FFFE',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    title: {
        fontFamily: 'Inter',
        fontWeight: '700',
        fontSize: 24,
        color: '#111827',
    },
    subtitle: {
        fontFamily: 'Inter',
        fontWeight: '400',
        fontSize: 14,
        lineHeight: 22,
        color: '#6B7280',
        textAlign: 'center',
    },
});
