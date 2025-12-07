/**
 * OrderCard Component
 * Displays order information in a card format
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { theme } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { Order } from '@/services/api/orders.api';
import { formatters } from '@/shared/utils/formatters';

interface OrderCardProps {
    order: Order;
}

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

export const OrderCard: React.FC<OrderCardProps> = ({ order }) => {
    const { t } = useTranslation();
    const router = useRouter();

    const statusColor = getStatusColor(order.status);
    const formattedDate = formatters.formatDate(order.created_at, 'long');

    const handleViewDetails = () => {
        router.push(`/orders/${order.id}`);
    };

    return (
        <View style={styles.card}>
            {/* Header Section */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Text style={styles.orderNumber}>#{order.increment_id}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
                    <Text style={styles.statusText}>
                        {order.status_label || order.status}
                    </Text>
                </View>
            </View>

            {/* Order Details */}
            <View style={styles.details}>
                <View style={styles.detailRow}>
                    <Ionicons name="calendar-outline" size={16} color={theme.colors.text.secondary} />
                    <Text style={styles.detailText}>{formattedDate}</Text>
                </View>

                <View style={styles.detailRow}>
                    <Ionicons name="cube-outline" size={16} color={theme.colors.text.secondary} />
                    <Text style={styles.detailText}>
                        {order.total_qty_ordered || order.total_item_count} {t('orders.items', 'items')}
                    </Text>
                </View>

                <View style={styles.detailRow}>
                    <Ionicons name="cash-outline" size={16} color={theme.colors.text.secondary} />
                    <Text style={styles.priceText}>{order.formatted_grand_total}</Text>
                </View>
            </View>

            {/* View Details Button */}
            <TouchableOpacity 
                style={styles.viewButton}
                onPress={handleViewDetails}
                activeOpacity={0.7}
            >
                <Text style={styles.viewButtonText}>
                    {t('orders.viewDetails', 'View Details')}
                </Text>
                <Ionicons name="chevron-forward" size={20} color={theme.colors.primary[500]} />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: theme.colors.white,
        borderRadius: theme.spacing.md,
        marginHorizontal: theme.spacing.md,
        marginVertical: theme.spacing.sm,
        padding: theme.spacing.lg,
        shadowColor: theme.colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: theme.spacing.md,
    },
    headerLeft: {
        flex: 1,
    },
    orderNumber: {
        fontSize: 18,
        fontWeight: '600',
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.xs,
    },
    statusBadge: {
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: 4,
        borderRadius: 4,
        marginLeft: theme.spacing.sm,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
        color: theme.colors.white,
        textTransform: 'uppercase',
    },
    details: {
        marginBottom: theme.spacing.md,
        gap: theme.spacing.xs,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.xs,
    },
    detailText: {
        fontSize: 14,
        color: theme.colors.text.secondary,
    },
    priceText: {
        fontSize: 16,
        fontWeight: '700',
        color: theme.colors.text.primary,
    },
    viewButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: theme.spacing.sm,
        paddingHorizontal: theme.spacing.md,
        borderTopWidth: 1,
        borderTopColor: theme.colors.gray[200],
        marginTop: theme.spacing.sm,
        paddingTop: theme.spacing.md,
    },
    viewButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.primary[500],
        marginRight: theme.spacing.xs,
    },
});

