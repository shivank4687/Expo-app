import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../styles/colors';
import { Order } from '../api/orders.api';

interface NewOrderCardProps {
    order: Order;
    onPress?: (order: Order) => void;
    onAccept?: (order: Order) => void;
    onEdit?: (order: Order) => void;
}

/**
 * New Order Card Component
 * Enhanced card design for new orders with larger image and action buttons
 */
const NewOrderCard: React.FC<NewOrderCardProps> = ({ order, onPress, onAccept, onEdit }) => {
    const customerName = order.customer_first_name && order.customer_last_name
        ? `${order.customer_first_name} ${order.customer_last_name}`
        : order.customer_email || 'Unknown Customer';

    const handlePress = () => {
        if (onPress) {
            onPress(order);
        }
    };

    const handleAccept = (e: any) => {
        e.stopPropagation();
        if (onAccept) {
            onAccept(order);
        }
    };

    const handleEdit = (e: any) => {
        e.stopPropagation();
        if (onEdit) {
            onEdit(order);
        }
    };

    // Get status badge info
    const getStatusBadge = () => {
        if (order.status === 'pending') {
            return {
                label: 'Time for validate',
                backgroundColor: 'rgba(187, 86, 37, 0.1)',
                textColor: '#BB5625',
            };
        }
        return {
            label: order.status_label,
            backgroundColor: 'rgba(14, 165, 233, 0.1)',
            textColor: '#0ea5e9',
        };
    };

    const statusBadge = getStatusBadge();

    return (
        <TouchableOpacity
            style={styles.container}
            onPress={handlePress}
            activeOpacity={0.7}
        >
            {/* Product Image */}
            <View style={styles.imageContainer}>
                {order.first_product_image ? (
                    <Image
                        source={{ uri: order.first_product_image }}
                        style={styles.productImage}
                        resizeMode="cover"
                    />
                ) : (
                    <View style={styles.placeholderImage}>
                        <Text style={styles.placeholderText}>📦</Text>
                    </View>
                )}
            </View>

            {/* Order Details */}
            <View style={styles.content}>
                {/* Top Section */}
                <View style={styles.topSection}>
                    {/* Order ID and Status Badge */}
                    <View style={styles.headerRow}>
                        <Text style={styles.orderId}>
                            #{order.increment_id || order.order_id} ({order.total_items || 0} {order.total_items === 1 ? 'product' : 'products'})
                        </Text>
                        <View style={[styles.statusBadge, { backgroundColor: statusBadge.backgroundColor }]}>
                            <Text style={[styles.statusBadgeText, { color: statusBadge.textColor }]}>
                                {statusBadge.label}
                            </Text>
                        </View>
                    </View>

                    {/* Order Items */}
                    {order.items && order.items.length > 0 && (
                        <View style={styles.itemsContainer}>
                            {order.items.map((item, index) => {
                                // Type guard: check if item has simple structure
                                const itemName = 'name' in item ? item.name : '';
                                const itemQty = 'qty' in item ? item.qty : 0;

                                // Truncate name to fit with quantity - max 25 chars for name
                                const maxNameLength = 25;
                                const truncatedName = itemName.length > maxNameLength
                                    ? itemName.substring(0, maxNameLength) + '...'
                                    : itemName;

                                return (
                                    <Text key={index} style={styles.itemText} numberOfLines={1}>
                                        {truncatedName} ({itemQty})
                                    </Text>
                                );
                            })}
                        </View>
                    )}

                    {/* Customer Name */}
                    <Text style={styles.customerName} numberOfLines={1}>
                        {customerName}
                    </Text>

                    {/* Order Date */}
                    <Text style={styles.orderDate} numberOfLines={1}>
                        {new Date(order.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                        }) + ', ' + new Date(order.created_at).toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true
                        })}
                    </Text>

                    {/* Status and Price Row */}
                    <View style={styles.statusPriceRow}>
                        <View style={styles.statusIndicator}>
                            <View style={styles.statusDot} />
                            <Text style={styles.statusText}>Awaiting tracking</Text>
                        </View>
                        <Text style={styles.price}>${order.grand_total.toFixed(2)}</Text>
                    </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.actionsRow}>
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={handleAccept}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="eye-outline" size={18} color="#0A292D" />
                        <Text style={styles.actionButtonText}>Details</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={handleEdit}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="create-outline" size={18} color="#0A292D" />
                        <Text style={styles.actionButtonText}>Modify</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        backgroundColor: COLORS.white,
        borderRadius: 8,
        padding: 8,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E9E3D3',
        gap: 16,
    },
    imageContainer: {
        width: 100,
        height: 100,
        borderRadius: 8,
        backgroundColor: COLORS.background,
        overflow: 'hidden',
    },
    productImage: {
        width: '100%',
        height: '100%',
    },
    placeholderImage: {
        width: '100%',
        height: '100%',
        backgroundColor: '#F5F5F5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderText: {
        fontSize: 40,
    },
    content: {
        flex: 1,
        gap: 16,
    },
    topSection: {
        gap: 8,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    orderId: {
        fontFamily: 'Inter',
        fontWeight: '500',
        fontSize: 12,
        lineHeight: 14,
        color: '#000000',
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 50,
    },
    statusBadgeText: {
        fontFamily: 'Inter',
        fontWeight: '500',
        fontSize: 10,
        lineHeight: 12,
    },
    itemsContainer: {
        gap: 4,
    },
    itemText: {
        fontFamily: 'Inter',
        fontWeight: '600',
        fontSize: 14,
        lineHeight: 16,
        color: '#000000',
    },
    customerName: {
        fontFamily: 'Inter',
        fontWeight: '500',
        fontSize: 14,
        lineHeight: 17,
        color: '#000000',
    },
    orderDate: {
        fontFamily: 'Inter',
        fontWeight: '400',
        fontSize: 12,
        lineHeight: 14,
        color: '#6B7280',
    },
    statusPriceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    statusIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        gap: 4,
        backgroundColor: '#006C5B',
        borderWidth: 1,
        borderColor: '#00615E',
        borderRadius: 80,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#FFFFFF',
    },
    statusText: {
        fontFamily: 'Inter',
        fontWeight: '500',
        fontSize: 11,
        lineHeight: 13,
        color: '#FFFFFF',
    },
    price: {
        fontFamily: 'Inter',
        fontWeight: '500',
        fontSize: 14,
        lineHeight: 17,
        color: '#000000',
        flex: 1,
    },
    actionsRow: {
        flexDirection: 'row',
        gap: 4,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 12,
        backgroundColor: '#EAECE1',
        borderRadius: 8,
        gap: 6,
    },
    actionButtonText: {
        fontFamily: 'Inter',
        fontWeight: '500',
        fontSize: 16,
        lineHeight: 18,
        color: '#0A292D',
    },
});

export default NewOrderCard;
