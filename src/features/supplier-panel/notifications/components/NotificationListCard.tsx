import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NotificationItem } from '../types/notifications.types';

interface NotificationListCardProps {
    notification: NotificationItem;
    onPress: (notification: NotificationItem) => void;
}

export function NotificationListCard({ notification, onPress }: NotificationListCardProps) {
    // Utility to format the date similar to the web version
    const formatDate = (dateString: string) => {
        if (notification.formatted_created_at) return notification.formatted_created_at;

        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

        return date.toLocaleDateString();
    };

    const isRead = Boolean(notification.supplier_read);

    // Determine icon based on notification type/status
    const renderIcon = () => {
        // Order notifications
        if (notification.order) {
            const status = notification.order.status;
            switch (status) {
                case 'processing':
                    return <Ionicons name="swap-vertical" size={20} color="#16A34A" />;
                case 'completed':
                    return <Ionicons name="checkmark-circle" size={20} color="#2563EB" />;
                case 'canceled':
                case 'closed':
                    return <Ionicons name="close-circle" size={20} color="#DC2626" />;
                case 'pending':
                default:
                    return <Ionicons name="information-circle" size={20} color="#D97706" />;
            }
        }

        // RFQ / Identity verification 
        const subtype = notification.subtype;
        if (notification.type === 'message') {
            return <Ionicons name="chatbubble-ellipses" size={20} color="#2563EB" />;
        }
        if (subtype === 'approved' || subtype === 'quote_approved') {
            return <Ionicons name="checkmark-circle" size={20} color="#16A34A" />;
        }
        if (subtype === 'rejected' || subtype === 'quote_rejected_by_customer') {
            return <Ionicons name="close-circle" size={20} color="#DC2626" />;
        }
        if (subtype === 'new_rfq_request') {
            return <Ionicons name="information-circle" size={20} color="#2563EB" />;
        }

        return <Ionicons name="notifications" size={20} color="#2563EB" />;
    };

    const renderIconBackground = () => {
        if (notification.order) {
            const status = notification.order.status;
            switch (status) {
                case 'processing': return '#DCFCE7'; // green-100
                case 'completed': return '#DBEAFE'; // blue-100
                case 'canceled':
                case 'closed': return '#FEE2E2'; // red-100
                case 'pending':
                default: return '#FEF3C7'; // amber-100
            }
        }

        const subtype = notification.subtype;
        if (notification.type === 'message') return '#DBEAFE';
        if (subtype === 'approved' || subtype === 'quote_approved') return '#DCFCE7';
        if (subtype === 'rejected' || subtype === 'quote_rejected_by_customer') return '#FEE2E2';

        return '#DBEAFE'; // Default blue-100
    };

    const getOrderTitle = () => {
        if (!notification.order) return notification.title;
        let statusMessage = 'Pending';
        switch (notification.order.status) {
            case 'pending': statusMessage = 'Pending'; break;
            case 'processing': statusMessage = 'Processing'; break;
            case 'canceled': statusMessage = 'Canceled'; break;
            case 'completed': statusMessage = 'Completed'; break;
            case 'closed': statusMessage = 'Closed'; break;
            case 'pending_payment': statusMessage = 'Pending Payment'; break;
        }
        return `#${notification.order.id} ${statusMessage}`;
    };

    return (
        <TouchableOpacity
            style={[styles.container, isRead && styles.containerRead]}
            onPress={() => onPress(notification)}
            activeOpacity={0.7}
        >
            <View style={[styles.iconWrapper, { backgroundColor: renderIconBackground() }]}>
                {renderIcon()}
            </View>

            <View style={styles.content}>
                <Text style={[styles.title, !isRead && styles.titleUnread]} numberOfLines={2}>
                    {notification.order ? getOrderTitle() : notification.title}
                </Text>

                {!!notification.message && !notification.order && (
                    <Text style={styles.message} numberOfLines={2}>
                        {notification.message}
                    </Text>
                )}

                {!!notification.order && (
                    <Text style={styles.message} numberOfLines={1}>
                        {notification.order.datetime}
                    </Text>
                )}

                {!notification.order && (
                    <Text style={styles.date}>
                        {formatDate(notification.created_at)}
                    </Text>
                )}
            </View>

            {!isRead && <View style={styles.unreadDot} />}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        padding: 16,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        alignItems: 'flex-start',
    },
    containerRead: {
        backgroundColor: '#F9FAFB',
    },
    iconWrapper: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
    },
    title: {
        fontFamily: 'Inter',
        fontSize: 14,
        color: '#374151', // gray-700
        fontWeight: '400',
        marginBottom: 4,
    },
    titleUnread: {
        color: '#111827', // gray-900
        fontWeight: '600',
    },
    message: {
        fontFamily: 'Inter',
        fontSize: 12,
        color: '#4B5563', // gray-600
        marginBottom: 4,
    },
    date: {
        fontFamily: 'Inter',
        fontSize: 12,
        color: '#6B7280', // gray-500
    },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#2563EB', // blue-600
        marginTop: 6,
        marginLeft: 8,
    },
});
