import { supplierTheme } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useToast } from '@/shared/components/Toast';
import { notificationsApi } from '../api/notifications.api';
import { NotificationItem } from '../types/notifications.types';
import { NotificationListCard } from '../components/NotificationListCard';

export function NotificationsScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { showToast } = useToast();

    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [identityNotifications, setIdentityNotifications] = useState<NotificationItem[]>([]);
    const [rfqNotifications, setRfqNotifications] = useState<NotificationItem[]>([]);

    const fetchNotifications = async () => {
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

    useEffect(() => {
        fetchNotifications();
    }, []);

    const onRefresh = useCallback(() => {
        setIsRefreshing(true);
        fetchNotifications();
    }, []);

    const handleMarkAllRead = async () => {
        try {
            await notificationsApi.markAllAsRead();
            showToast({ message: 'All notifications marked as read', type: 'success' });
            fetchNotifications(); // Refresh visually
        } catch (error) {
            showToast({ message: 'Failed to update notifications', type: 'error' });
        }
    };

    const handleNotificationPress = async (notification: NotificationItem) => {
        // Mark as read based on notification type
        if (!notification.supplier_read) {
            try {
                if (notification.order_id && !notification.type?.includes('identity') && !['message', 'quote_status', 'rfq'].includes(notification.type)) {
                    // Order notification — uses the notifications table
                    await notificationsApi.markOrderAsRead(notification.id);
                } else {
                    // RFQ / identity / message — all use the supplier_notifications table
                    await notificationsApi.markRfqAsRead(notification.id);
                }
                // Refresh list so the now-read notification disappears
                // fetchNotifications();
            } catch (error) {
                console.error('Failed to mark notification as read:', error);
            }
        }

        // Navigate based on notification type
        if (notification.order_id) {
            router.push(`/(supplier-drawer)/(supplier-tabs)/orders/${notification.order_id}` as any);
        } else if (notification.action_url) {
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
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={20} color="#0A292D" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Notifications</Text>
                <TouchableOpacity onPress={handleMarkAllRead}>
                    <Text style={styles.markAllReadText}>Mark all read</Text>
                </TouchableOpacity>
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
        backgroundColor: supplierTheme.colors.background.default,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E9E3D3',
        backgroundColor: '#FFFFFF',
    },
    backButton: {
        width: 36,
        height: 36,
        borderRadius: 8,
        backgroundColor: '#F5F5F5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        flex: 1,
        textAlign: 'center',
        fontFamily: 'Inter',
        fontWeight: '600',
        fontSize: 18,
        color: '#0A292D',
    },
    headerSpacer: {
        width: 36,
    },
    markAllReadText: {
        fontFamily: 'Inter',
        fontWeight: '500',
        fontSize: 12,
        color: '#2563EB', // blue-600
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
