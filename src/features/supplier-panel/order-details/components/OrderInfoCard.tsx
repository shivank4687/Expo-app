import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { COLORS } from '../../styles/colors';
import { OrderDetailsResponse } from '../../orders/api/orders.api';

// Placeholder image for the product
const DEFAULT_IMAGE = 'https://via.placeholder.com/100';

interface OrderInfoCardProps {
    order: OrderDetailsResponse['data'];
}

export const OrderInfoCard = ({ order }: OrderInfoCardProps) => {
    const {
        increment_id,
        created_at,
        status_label,
        items,
        customer_first_name,
        customer_last_name,
        shipping_address,
        formatted_grand_total,
        sub_total,
        tax_amount,
        shipping_amount,
        discount_amount,
        total_paid,
        total_refunded,
        total_due
    } = order;

    // Helper to format currency
    const formatCurrency = (amount: number) => {
        return `$${Number(amount).toFixed(2)}`;
    };

    // Construct display strings
    const fullName = `${customer_first_name || ''} ${customer_last_name || 'Guest'}`.trim();
    const location = shipping_address
        ? `${shipping_address.city}, ${shipping_address.state}`
        : 'N/A';

    const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'pending': return '#BB5625'; // Orange
            case 'processing': return '#BB5625';
            case 'completed': return '#00615E'; // Green
            case 'canceled': return '#EF4444'; // Red
            default: return '#BB5625'; // Default Orange
        }
    };

    return (
        <View style={styles.container}>
            {/* Order Header Section */}
            <View style={styles.headerSection}>
                <View style={styles.orderNumberRow}>
                    <Text style={styles.orderNumber}>#{increment_id}</Text>
                    <Text style={styles.dot}>•</Text>
                    <Text style={styles.companyName}>{new Date(created_at).toLocaleDateString()}</Text>
                </View>

                <View style={[styles.paidBadge, { backgroundColor: getStatusColor(status_label) }]}>
                    <View style={styles.paidDot} />
                    <Text style={styles.paidText}>{status_label}</Text>
                </View>
            </View>

            {/* Items List */}
            {/* <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Order Items ({items?.length || 0})</Text>
            </View> */}

            <View style={styles.itemsContainer}>
                {items && items.map((item, index) => (
                    <View key={item.id || index} style={styles.itemRow}>
                        <View style={styles.imageContainer}>
                            <Image
                                source={{ uri: item.product_image || DEFAULT_IMAGE }}
                                style={styles.productImage}
                            />
                        </View>
                        <View style={styles.itemDetails}>
                            <Text style={styles.productName}>{item.product_name}</Text>
                            <Text style={styles.itemSku}>SKU - {item.product_sku}</Text>

                            <View style={styles.priceRow}>
                                <Text style={styles.itemPriceInfo}>
                                    {formatCurrency(item.price)} Per Unit x {item.qty_ordered} Quantity
                                </Text>
                            </View>

                            <View style={styles.itemBreakdown}>
                                <View style={styles.breakdownRow}>
                                    <Text style={styles.breakdownLabel}>Ordered ({item.qty_ordered})</Text>
                                    <Text style={styles.breakdownValue}>{formatCurrency(item.total)}</Text>
                                </View>
                                {/* <View style={styles.breakdownRow}>
                                    <Text style={styles.breakdownLabel}>Price</Text>
                                    <Text style={styles.breakdownValue}>{formatCurrency(item.price)}</Text>
                                </View> */}
                                <View style={styles.breakdownRow}>
                                    <Text style={styles.breakdownLabel}>{Number(item.tax_percent).toFixed(4)}% Tax</Text>
                                    <Text style={styles.breakdownValue}>{formatCurrency(item.tax_amount)}</Text>
                                </View>
                                <View style={styles.breakdownRow}>
                                    <Text style={styles.breakdownLabel}>Sub Total</Text>
                                    <Text style={styles.breakdownValue}>{formatCurrency(item.total + item.tax_amount)}</Text>
                                </View>
                            </View>
                        </View>
                    </View>
                ))}
            </View>

            {/* Order Summary */}
            <View style={styles.summaryContainer}>
                <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Sub Total</Text>
                    <Text style={styles.summaryValue}>{formatCurrency(sub_total)}</Text>
                </View>
                <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Tax</Text>
                    <Text style={styles.summaryValue}>{formatCurrency(tax_amount)}</Text>
                </View>
                <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Shipping and Handling</Text>
                    <Text style={styles.summaryValue}>{formatCurrency(shipping_amount)}</Text>
                </View>

                {/* Calculate total supplier amount if needed, otherwise it's subtotal + tax + shipping roughly */}
                <View style={[styles.summaryRow, styles.totalRow]}>
                    <Text style={styles.summaryLabel}>Grand Total</Text>
                    <Text style={styles.summaryValue}>{formatted_grand_total}</Text>
                </View>

                {/* Additional summary fields */}
                <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Total Paid</Text>
                    <Text style={styles.summaryValue}>{formatCurrency(total_paid)}</Text>
                </View>
                <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Total Refund</Text>
                    <Text style={styles.summaryValue}>{formatCurrency(total_refunded)}</Text>
                </View>
                <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Total Due</Text>
                    <Text style={styles.summaryValue}>{formatCurrency(total_due)}</Text>
                </View>

            </View>

            {/* User Info Section */}
            {/* <View style={styles.userInfoContainer}>
                <View style={styles.infoRow}>
                    <Feather name="user" size={16} color="#0A292D" />
                    <Text style={styles.infoText}>{fullName}</Text>
                </View>

                <View style={styles.infoRow}>
                    <Ionicons name="location-outline" size={16} color="#0A292D" />
                    <Text style={styles.infoText}>{location}</Text>
                </View>
            </View> */}

            {/* Action Buttons */}
            {/* <View style={styles.actionsContainer}>
                <TouchableOpacity style={styles.modifyButton}>
                    <Feather name="edit-2" size={14} color="#AC790A" />
                    <Text style={styles.modifyText}>Modify</Text>
                </TouchableOpacity>
            </View> */}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: '#E9E3D3',
        borderRadius: 8,
        padding: 12,
        gap: 16,
    },
    headerSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    sectionHeader: {
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        paddingBottom: 8,
    },
    sectionTitle: {
        fontFamily: 'Inter',
        fontWeight: '600',
        fontSize: 14,
        color: '#111827',
    },
    itemsContainer: {
        flexDirection: 'column',
        gap: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    itemRow: {
        flexDirection: 'row',
        gap: 12,
        alignItems: 'flex-start',
    },
    imageContainer: {
        width: 80,
        height: 80,
        backgroundColor: '#F3F4F6',
        borderRadius: 6,
        overflow: 'hidden',
    },
    productImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    itemDetails: {
        flex: 1,
        gap: 4,
    },
    productName: {
        fontFamily: 'Inter',
        fontWeight: '600',
        fontSize: 14,
        color: '#00615E', // Using the green color for product name
    },
    itemSku: {
        fontFamily: 'Inter',
        fontSize: 12,
        color: '#6B7280',
    },
    priceRow: {
        marginTop: 4,
    },
    itemPriceInfo: {
        fontFamily: 'Inter',
        fontWeight: '500',
        fontSize: 12,
        color: '#374151',
    },
    itemBreakdown: {
        marginTop: 8,
        gap: 4,
    },
    breakdownRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    breakdownLabel: {
        fontFamily: 'Inter',
        fontSize: 12,
        color: '#6B7280',
    },
    breakdownValue: {
        fontFamily: 'Inter',
        fontWeight: '500',
        fontSize: 12,
        color: '#111827',
    },
    summaryContainer: {
        gap: 8,
        backgroundColor: '#F9FAFB',
        padding: 12,
        borderRadius: 8,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    summaryLabel: {
        fontFamily: 'Inter',
        fontSize: 14,
        color: '#4B5563',
    },
    summaryValue: {
        fontFamily: 'Inter',
        fontWeight: '500',
        fontSize: 14,
        color: '#111827',
    },
    totalRow: {
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        paddingTop: 8,
        marginTop: 4,
    },
    orderNumberRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    orderNumber: {
        fontFamily: 'Inter',
        fontWeight: '500',
        fontSize: 12,
        color: '#000000',
    },
    dot: {
        fontFamily: 'Inter',
        fontWeight: '500',
        fontSize: 12,
        color: '#000000',
    },
    companyName: {
        fontFamily: 'Inter',
        fontWeight: '500',
        fontSize: 12,
        color: '#6B7280',
    },
    paidBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 80,
        gap: 4,
    },
    paidDot: {
        width: 6,
        height: 6,
        backgroundColor: '#FFFFFF',
        borderRadius: 3,
    },
    paidText: {
        fontFamily: 'Inter',
        fontWeight: '500',
        fontSize: 12,
        color: '#FFFFFF',
    },
    userInfoContainer: {
        flexDirection: 'column',
        gap: 8,
        paddingTop: 4,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    infoText: {
        fontFamily: 'Inter',
        fontWeight: '500',
        fontSize: 14,
        color: '#0A292D',
        flex: 1,
    },
    actionsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    modifyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        gap: 4,
        backgroundColor: '#FFF5EA',
        borderWidth: 1,
        borderColor: '#FFE8CF',
        borderRadius: 80,
    },
    modifyText: {
        fontFamily: 'Inter',
        fontWeight: '500',
        fontSize: 12,
        color: '#AC790A',
    },
});
