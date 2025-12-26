import React, { useEffect, useCallback, useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    RefreshControl,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { theme } from '@/theme';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import {
    fetchNotificationsThunk,
    markAsReadThunk,
    markAllAsReadThunk,
} from '@/store/slices/notificationSlice';
import { Notification } from '@/features/notifications/types/notification.types';
import { useRequireAuth } from '@/shared/hooks/useRequireAuth';
import { LoadingSpinner } from '@/shared/components/LoadingSpinner';
import socketService from '@/services/socket.service';

export const NotificationsScreen: React.FC = () => {
    const { t } = useTranslation();
    const router = useRouter();
    const dispatch = useAppDispatch();
    const { user, isAuthenticated, isLoading: isAuthLoading } = useRequireAuth();

    const {
        orderNotifications,
        customerNotifications,
        totalUnread,
        isLoading,
    } = useAppSelector((state) => state.notifications);

    const [activeTab, setActiveTab] = useState<'messages' | 'orders'>('messages');
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMoreOrders, setHasMoreOrders] = useState(true);
    const [hasMoreMessages, setHasMoreMessages] = useState(true);
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    // Use refs to prevent duplicate loading
    const isLoadingMoreRef = useRef(false);
    const isInitialLoadRef = useRef(true);
    const momentumScrollBegin = useRef(false);

    // Reset momentum on tab change
    useEffect(() => {
        momentumScrollBegin.current = false;
    }, [activeTab]);

    // Fetch notifications on mount
    useEffect(() => {
        if (isAuthenticated && isInitialLoadRef.current) {
            isInitialLoadRef.current = false;
            setCurrentPage(1);
            dispatch(fetchNotificationsThunk({ page: 1, append: false }))
                .unwrap()
                .then((response: any) => {
                    // Check if we've reached the last page for orders
                    if (response.order_pagination && response.order_pagination.current_page >= response.order_pagination.last_page) {
                        setHasMoreOrders(false);
                    } else {
                        setHasMoreOrders(true);
                    }

                    // Check if we've reached the last page for messages
                    if (response.customer_pagination && response.customer_pagination.current_page >= response.customer_pagination.last_page) {
                        setHasMoreMessages(false);
                    } else {
                        setHasMoreMessages(true);
                    }
                })
                .finally(() => setIsInitialLoad(false));
        }
    }, [isAuthenticated, dispatch]);

    // Socket.IO real-time notifications
    useEffect(() => {
        if (isAuthenticated && user?.id) {
            const token = `customer_${user.id}`;
            socketService.connect(token, 'customer');
            socketService.subscribeToNotifications();

            // Listen for new notifications
            socketService.onNewNotification((data) => {
                console.log('Real-time notification received:', data);
                // Refresh notifications list
                dispatch(fetchNotificationsThunk({ page: 1, append: false }));
            });

            return () => {
                socketService.offNewNotification();
                socketService.unsubscribeFromNotifications();
            };
        }
    }, [isAuthenticated, user, dispatch]);

    const onRefresh = useCallback(() => {
        setIsRefreshing(true);
        setCurrentPage(1);
        dispatch(fetchNotificationsThunk({ page: 1, append: false }))
            .unwrap()
            .then((response: any) => {
                if (response.order_pagination && response.order_pagination.current_page >= response.order_pagination.last_page) {
                    setHasMoreOrders(false);
                } else {
                    setHasMoreOrders(true);
                }

                if (response.customer_pagination && response.customer_pagination.current_page >= response.customer_pagination.last_page) {
                    setHasMoreMessages(false);
                } else {
                    setHasMoreMessages(true);
                }
            })
            .finally(() => setIsRefreshing(false));
    }, [dispatch]);

    const loadMore = useCallback(() => {
        const hasMorePages = activeTab === 'messages' ? hasMoreMessages : hasMoreOrders;

        // Prevent duplicate requests using ref
        if (isLoadingMoreRef.current || !hasMorePages || isLoading || isRefreshing) {
            return;
        }

        console.log('[NotificationsScreen] Triggering load more for page:', currentPage + 1, 'tab:', activeTab);
        isLoadingMoreRef.current = true;
        setIsLoadingMore(true);
        const nextPage = currentPage + 1;

        dispatch(fetchNotificationsThunk({ page: nextPage, append: true }))
            .unwrap()
            .then((response: any) => {
                setCurrentPage(nextPage);

                // Check if we've reached the last page for orders
                if (response.order_pagination && response.order_pagination.current_page >= response.order_pagination.last_page) {
                    setHasMoreOrders(false);
                } else {
                    setHasMoreOrders(true);
                }

                // Check if we've reached the last page for messages
                if (response.customer_pagination && response.customer_pagination.current_page >= response.customer_pagination.last_page) {
                    setHasMoreMessages(false);
                } else {
                    setHasMoreMessages(true);
                }
            })
            .catch((error: any) => {
                console.error('Error loading more notifications:', error);
            })
            .finally(() => {
                setIsLoadingMore(false);
                isLoadingMoreRef.current = false;
            });
    }, [currentPage, hasMoreOrders, hasMoreMessages, activeTab, isLoading, isRefreshing, dispatch]);

    const handleEndReached = () => {
        // Only load more if we are not on the initial load and have data
        if (isInitialLoad || (notifications.length === 0 && !isLoading)) {
            return;
        }
        loadMore();
    };

    const handleNotificationPress = async (notification: Notification) => {
        // Mark as read
        if (!notification.read_at) {
            await dispatch(markAsReadThunk(notification.id));
        }

        // Navigate based on action_url
        if (notification.action_url) {
            // Extract path from action_url
            // Example: http://localhost:8000/customer/quote/response/new/view/38/id/5/product/13#tab=messages
            const url = new URL(notification.action_url);
            const path = url.pathname + url.hash;

            // Navigate to RFQ response screen if it's a message notification
            if (path.includes('/customer/quote/response')) {
                // Extract IDs from path
                const matches = path.match(/view\/(\d+)\/id\/(\d+)\/product\/(\d+)/);
                if (matches) {
                    const [, quoteId, customerQuoteItemId, productId] = matches;
                    router.push(`/quotes/response/${quoteId}/${customerQuoteItemId}` as any);
                }
            }
        }
    };

    const handleMarkAllAsRead = () => {
        dispatch(markAllAsReadThunk());
    };

    const renderNotification = ({ item }: { item: Notification }) => {
        const isUnread = !item.read_at;

        return (
            <TouchableOpacity
                style={[styles.notificationItem, isUnread && styles.unreadNotification]}
                onPress={() => handleNotificationPress(item)}
            >
                <View style={styles.notificationIcon}>
                    <Ionicons
                        name={item.type === 'order' ? 'cube-outline' : 'chatbubble-outline'}
                        size={24}
                        color={theme.colors.primary[500]}
                    />
                </View>
                <View style={styles.notificationContent}>
                    <Text style={styles.notificationTitle}>{item.title}</Text>
                    <Text style={styles.notificationMessage} numberOfLines={2}>
                        {item.message}
                    </Text>
                    <Text style={styles.notificationTime}>
                        {new Date(item.created_at).toLocaleDateString()} {new Date(item.created_at).toLocaleTimeString()}
                    </Text>
                </View>
                {isUnread && <View style={styles.unreadDot} />}
            </TouchableOpacity>
        );
    };

    const renderEmptyState = () => (
        <View style={styles.emptyState}>
            <Ionicons name="notifications-off-outline" size={64} color={theme.colors.gray[400]} />
            <Text style={styles.emptyStateText}>
                {activeTab === 'messages'
                    ? t('notifications.noMessages', 'No message notifications')
                    : t('notifications.noOrders', 'No order notifications')}
            </Text>
        </View>
    );

    const notifications = activeTab === 'messages' ? customerNotifications : orderNotifications;
    const hasData = orderNotifications.length > 0 || customerNotifications.length > 0;

    if (isAuthLoading || (isInitialLoad && !hasData)) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{t('notifications.title', 'Notifications')}</Text>
                    <View style={styles.headerRight} />
                </View>
                <LoadingSpinner />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('notifications.title', 'Notifications')}</Text>
                {totalUnread > 0 && (
                    <TouchableOpacity onPress={handleMarkAllAsRead} style={styles.markAllButton}>
                        <Text style={styles.markAllText}>{t('notifications.markAllRead', 'Mark all')}</Text>
                    </TouchableOpacity>
                )}
                {totalUnread === 0 && <View style={styles.headerRight} />}
            </View>

            {/* Tabs */}
            <View style={styles.tabsContainer}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'messages' && styles.activeTab]}
                    onPress={() => setActiveTab('messages')}
                >
                    <Text style={[styles.tabText, activeTab === 'messages' && styles.activeTabText]}>
                        {t('notifications.messages', 'Messages')}
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'orders' && styles.activeTab]}
                    onPress={() => setActiveTab('orders')}
                >
                    <Text style={[styles.tabText, activeTab === 'orders' && styles.activeTabText]}>
                        {t('notifications.orders', 'Orders')}
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Notifications List */}
            <FlatList
                data={notifications}
                renderItem={renderNotification}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={onRefresh}
                        colors={[theme.colors.primary[500]]}
                    />
                }
                ListEmptyComponent={renderEmptyState}
                onEndReached={handleEndReached}
                onEndReachedThreshold={0.5}
                ListFooterComponent={() =>
                    isLoadingMore ? (
                        <View style={styles.loadingMore}>
                            <ActivityIndicator size="small" color={theme.colors.primary[500]} />
                        </View>
                    ) : null
                }
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background.default,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.gray[200],
        backgroundColor: theme.colors.white,
    },
    backButton: {
        padding: theme.spacing.xs,
    },
    headerTitle: {
        flex: 1,
        fontSize: theme.typography.fontSize.xl,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.text.primary,
        textAlign: 'center',
        marginHorizontal: theme.spacing.sm,
    },
    headerRight: {
        minWidth: 60,
    },
    markAllButton: {
        padding: theme.spacing.xs,
    },
    markAllText: {
        color: theme.colors.primary[500],
        fontSize: theme.typography.fontSize.sm,
        fontWeight: theme.typography.fontWeight.medium,
    },
    tabsContainer: {
        flexDirection: 'row',
        backgroundColor: theme.colors.white,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.gray[200],
    },
    tab: {
        flex: 1,
        paddingVertical: theme.spacing.md,
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    activeTab: {
        borderBottomColor: theme.colors.primary[500],
    },
    tabText: {
        fontSize: theme.typography.fontSize.base,
        fontWeight: theme.typography.fontWeight.medium,
        color: theme.colors.text.secondary,
    },
    activeTabText: {
        color: theme.colors.primary[500],
        fontWeight: theme.typography.fontWeight.bold,
    },
    listContent: {
        flexGrow: 1,
    },
    notificationItem: {
        flexDirection: 'row',
        padding: theme.spacing.md,
        backgroundColor: theme.colors.white,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.gray[100],
    },
    unreadNotification: {
        backgroundColor: theme.colors.primary[50],
    },
    notificationIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: theme.colors.primary[100],
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: theme.spacing.md,
    },
    notificationContent: {
        flex: 1,
    },
    notificationTitle: {
        fontSize: theme.typography.fontSize.base,
        fontWeight: theme.typography.fontWeight.semiBold,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.xs,
    },
    notificationMessage: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.text.secondary,
        marginBottom: theme.spacing.xs,
    },
    notificationTime: {
        fontSize: theme.typography.fontSize.xs,
        color: theme.colors.text.disabled,
    },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: theme.colors.primary[500],
        marginLeft: theme.spacing.sm,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: theme.spacing.xl * 2,
    },
    emptyStateText: {
        marginTop: theme.spacing.md,
        fontSize: theme.typography.fontSize.base,
        color: theme.colors.text.secondary,
    },
    loadingMore: {
        paddingVertical: theme.spacing.lg,
        alignItems: 'center',
    },
});

export default NotificationsScreen;
