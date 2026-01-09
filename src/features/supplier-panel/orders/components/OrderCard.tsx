import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { COLORS } from '../../styles/colors';
import { Order } from '../api/orders.api';

interface OrderCardProps {
    order: Order;
    onPress?: (order: Order) => void;
}

/**
 * Order Card Component
 * Displays a summary of an order
 */
const OrderCard: React.FC<OrderCardProps> = ({ order, onPress }) => {
    const customerName = order.customer_first_name && order.customer_last_name
        ? `${order.customer_first_name} ${order.customer_last_name}`
        : order.customer_email || 'Unknown Customer';

    const handlePress = () => {
        if (onPress) {
            onPress(order);
        }
    };

    return (
        <TouchableOpacity
            style={styles.container}
            onPress={handlePress}
            activeOpacity={0.7}
        >
            <View style={styles.content}>
                {/* Product Image */}
                {order.first_product_image && (
                    <Image
                        source={{ uri: order.first_product_image }}
                        style={styles.productImage}
                        resizeMode="cover"
                    />
                )}

                {/* Order Details */}
                <View style={styles.details}>
                    <View style={styles.header}>
                        <Text style={styles.orderId}>
                            Order #{order.increment_id || order.order_id}
                        </Text>
                        <View style={[styles.statusBadge, getStatusBadgeStyle(order.status)]}>
                            <Text style={styles.statusText}>{order.status_label}</Text>
                        </View>
                    </View>

                    <Text style={styles.customerName}>{customerName}</Text>

                    <View style={styles.footer}>
                        <Text style={styles.itemsCount}>
                            {order.total_items} {order.total_items === 1 ? 'item' : 'items'}
                        </Text>
                        <Text style={styles.total}>${order.grand_total.toFixed(2)}</Text>
                    </View>

                    {order.shipments_count > 0 && (
                        <Text style={styles.shipmentsInfo}>
                            {order.shipments_count} {order.shipments_count === 1 ? 'shipment' : 'shipments'}
                        </Text>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );
};

/**
 * Get status badge style based on order status
 */
const getStatusBadgeStyle = (status: string) => {
    switch (status) {
        case 'pending':
        case 'pending_payment':
            return { backgroundColor: '#FFF4E5', borderColor: '#E5A75F' };
        case 'processing':
            return { backgroundColor: '#E0F2FE', borderColor: '#0ea5e9' };
        case 'completed':
            return { backgroundColor: '#E0FFE0', borderColor: '#00AA00' };
        case 'canceled':
        case 'closed':
        case 'fraud':
            return { backgroundColor: '#FFE0E0', borderColor: '#CC0000' };
        default:
            return { backgroundColor: '#F5F5F5', borderColor: '#CCCCCC' };
    }
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: COLORS.white,
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    content: {
        flexDirection: 'row',
        gap: 12,
    },
    productImage: {
        width: 80,
        height: 80,
        borderRadius: 6,
        backgroundColor: COLORS.border,
    },
    details: {
        flex: 1,
        gap: 6,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    orderId: {
        fontFamily: 'Inter',
        fontWeight: '600',
        fontSize: 16,
        color: COLORS.textPrimary,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        borderWidth: 1,
    },
    statusText: {
        fontFamily: 'Inter',
        fontWeight: '500',
        fontSize: 12,
        color: COLORS.textPrimary,
    },
    customerName: {
        fontFamily: 'Inter',
        fontWeight: '400',
        fontSize: 14,
        color: COLORS.textSecondary,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 4,
    },
    itemsCount: {
        fontFamily: 'Inter',
        fontWeight: '400',
        fontSize: 13,
        color: COLORS.textSecondary,
    },
    total: {
        fontFamily: 'Inter',
        fontWeight: '700',
        fontSize: 16,
        color: COLORS.primary,
    },
    shipmentsInfo: {
        fontFamily: 'Inter',
        fontWeight: '400',
        fontSize: 12,
        color: COLORS.primary,
        marginTop: 2,
    },
});

export default OrderCard;
