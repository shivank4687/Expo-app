import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { COLORS } from '../../styles/colors';
import { TopHeader } from '@/shared/components';
import { useToast } from '@/shared/components/Toast';
import { getOrderDetails, OrderDetailsResponse } from '../../orders/api/orders.api';
import { calculateRefundTotals, createRefund, RefundTotalsRequest } from '../api/refunds.api';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const DEFAULT_IMAGE = 'https://via.placeholder.com/100';

export function CreateRefundScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { showToast } = useToast();
    const insets = useSafeAreaInsets();

    const supplierOrderId = params.supplierOrderId ? parseInt(params.supplierOrderId as string) : 0;
    const orderId = params.orderId ? parseInt(params.orderId as string) : 0;

    const [order, setOrder] = useState<OrderDetailsResponse['data'] | null>(null);
    const [loading, setLoading] = useState(true);

    const [refundItems, setRefundItems] = useState<Record<number, string>>({});
    const [refundShipping, setRefundShipping] = useState<string>('0');
    const [adjustmentRefund, setAdjustmentRefund] = useState<string>('0');
    const [adjustmentFee, setAdjustmentFee] = useState<string>('0');

    const [totals, setTotals] = useState<any>(null);
    const [isCalculating, setIsCalculating] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (orderId) {
            fetchOrderDetails();
        }
    }, [orderId]);

    const fetchOrderDetails = async () => {
        try {
            setLoading(true);
            const response = await getOrderDetails(orderId);
            setOrder(response.data);

            // Initialize quantities
            const initialItems: Record<number, string> = {};
            response.data.items.forEach(item => {
                if (item.qty_to_refund && item.qty_to_refund > 0) {
                    initialItems[item.order_item_id] = item.qty_to_refund.toString();
                }
            });
            setRefundItems(initialItems);

            // Initialize shipping
            const shippingInvoiced = response.data.base_shipping_invoiced || 0;
            const shippingRefunded = response.data.base_shipping_refunded || 0;
            setRefundShipping((shippingInvoiced - shippingRefunded).toString());

        } catch (error) {
            console.error('Failed to fetch order details:', error);
            showToast({ message: 'Failed to load order details', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateTotals = async () => {
        if (!supplierOrderId) return;

        try {
            setIsCalculating(true);

            const payload: RefundTotalsRequest = {
                refund: {
                    items: Object.fromEntries(
                        Object.entries(refundItems).map(([k, v]) => [k, parseFloat(v) || 0])
                    ),
                    shipping: parseFloat(refundShipping) || 0,
                    adjustment_refund: parseFloat(adjustmentRefund) || 0,
                    adjustment_fee: parseFloat(adjustmentFee) || 0,
                }
            };

            const response = await calculateRefundTotals(supplierOrderId, payload);

            if (response.success && response.data) {
                setTotals(response.data);
                // showToast({ message: 'Totals updated', type: 'success' });
            } else {
                // showToast({ message: response.message || 'Failed to calculate totals', type: 'error' });
            }
        } catch (error: any) {
            console.error('Failed to calculate totals:', error);
            showToast({ message: error?.message || 'An error occurred while calculating totals', type: 'error' });
        } finally {
            setIsCalculating(false);
        }
    };

    // Auto-calculate totals on initial load once data is ready
    useEffect(() => {
        if (order && Object.keys(refundItems).length > 0 && !totals) {
            handleUpdateTotals();
        }
    }, [order, refundItems, totals]);

    const handleSubmitRefund = async () => {
        if (!supplierOrderId) return;

        try {
            setIsSubmitting(true);

            const payload: RefundTotalsRequest = {
                refund: {
                    items: Object.fromEntries(
                        Object.entries(refundItems).map(([k, v]) => [k, parseFloat(v) || 0])
                    ),
                    shipping: parseFloat(refundShipping) || 0,
                    adjustment_refund: parseFloat(adjustmentRefund) || 0,
                    adjustment_fee: parseFloat(adjustmentFee) || 0,
                }
            };

            const response = await createRefund(supplierOrderId, payload);

            if (response.success) {
                showToast({ message: response.message || 'Refund created successfully', type: 'success' });
                router.back();
            } else {
                showToast({ message: response.message || 'Failed to create refund', type: 'error' });
            }
        } catch (error: any) {
            console.error('Failed to create refund:', error);
            showToast({ message: error?.message || 'An error occurred while creating refund', type: 'error' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return `$${Number(amount).toFixed(2)}`;
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <TopHeader title="Create Refund" onBack={() => router.back()} />
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            </View>
        );
    }

    if (!order) {
        return (
            <View style={styles.container}>
                <TopHeader title="Create Refund" onBack={() => router.back()} />
                <View style={styles.centerContainer}>
                    <Text style={styles.emptyText}>Order not found</Text>
                </View>
            </View>
        );
    }

    const itemsToRefund = order.items.filter(item => (item.qty_to_refund || 0) > 0);

    return (
        <View style={styles.container}>
            <TopHeader title="Create Refund" onBack={() => router.back()} />

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={0}
            >
                <ScrollView
                    style={{ flex: 1 }}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >

                    {/* Items List */}
                    <View style={styles.card}>
                        <Text style={styles.sectionTitle}>Refund Items ({itemsToRefund.length})</Text>

                        <View style={styles.itemsContainer}>
                            {itemsToRefund.map((item, index) => (
                                <View key={item.id} style={[styles.itemRow, index > 0 && styles.itemBorder]}>
                                    <View style={styles.itemHeader}>
                                        <View style={styles.imageContainer}>
                                            <Image
                                                source={{ uri: item.product_image || DEFAULT_IMAGE }}
                                                style={styles.productImage}
                                            />
                                        </View>

                                        <View style={styles.itemDetails}>
                                            <Text style={styles.productName}>{item.product_name}</Text>
                                            <Text style={styles.itemPriceInfo}>
                                                Amount per unit: {formatCurrency(item.base_price)} x {item.qty_ordered}
                                            </Text>

                                            {/* Additional Attributes if available */}
                                            {item.additional?.attributes && item.additional.attributes.map((attr: any, i: number) => (
                                                <Text key={i} style={styles.itemAttrInfo}>
                                                    {attr.attribute_name} : {attr.option_label}
                                                </Text>
                                            ))}

                                            <Text style={styles.itemSkuInfo}>SKU: {item.product_sku}</Text>

                                            {/* Status Text */}
                                            <Text style={styles.itemStatusInfo}>
                                                {[
                                                    item.qty_ordered ? `Ordered (${item.qty_ordered})` : null,
                                                    item.qty_invoiced ? `Invoiced (${item.qty_invoiced})` : null,
                                                    item.qty_shipped ? `Shipped (${item.qty_shipped})` : null,
                                                    item.qty_refunded ? `Refunded (${item.qty_refunded})` : null,
                                                    item.qty_canceled ? `Canceled (${item.qty_canceled})` : null,
                                                ].filter(Boolean).join(', ')}
                                            </Text>
                                        </View>
                                    </View>

                                    <View style={styles.qtyRow}>
                                        <View style={styles.inputGroup}>
                                            <Text style={styles.inputLabel}>Qty to Refund *</Text>
                                            <TextInput
                                                style={styles.input}
                                                keyboardType="numeric"
                                                value={refundItems[item.order_item_id] || ''}
                                                onChangeText={(val) => setRefundItems(prev => ({ ...prev, [item.order_item_id]: val }))}
                                            />
                                        </View>

                                        <View style={styles.itemBreakdown}>
                                            <View style={styles.breakdownRow}>
                                                <Text style={styles.breakdownLabel}>Price</Text>
                                                <Text style={styles.breakdownValue}>{formatCurrency(item.base_price)}</Text>
                                            </View>
                                            <View style={styles.breakdownRow}>
                                                <Text style={styles.breakdownLabel}>Sub Total</Text>
                                                <Text style={styles.breakdownValue}>{formatCurrency(item.base_total)}</Text>
                                            </View>
                                            <View style={styles.breakdownRow}>
                                                <Text style={styles.breakdownLabel}>Tax</Text>
                                                <Text style={styles.breakdownValue}>{formatCurrency(item.base_tax_amount || 0)}</Text>
                                            </View>
                                            {((item.base_discount_amount || 0) > 0) && (
                                                <View style={styles.breakdownRow}>
                                                    <Text style={styles.breakdownLabel}>Discount</Text>
                                                    <Text style={styles.breakdownValue}>{formatCurrency(item.base_discount_amount || 0)}</Text>
                                                </View>
                                            )}
                                            <View style={[styles.breakdownRow, styles.totalRow]}>
                                                <Text style={[styles.breakdownLabel, styles.boldLabel]}>Grand Total</Text>
                                                <Text style={styles.breakdownValue}>
                                                    {formatCurrency(item.base_total + (item.base_tax_amount || 0) - (item.base_discount_amount || 0))}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* Adjustments */}
                    <View style={styles.card}>
                        <Text style={styles.sectionTitle}>Adjustments</Text>

                        <View style={styles.adjustmentsContainer}>
                            <View style={styles.inputGroupFull}>
                                <Text style={styles.inputLabel}>Refund Shipping</Text>
                                <TextInput
                                    style={styles.input}
                                    keyboardType="numeric"
                                    value={refundShipping}
                                    onChangeText={setRefundShipping}
                                />
                            </View>

                            <View style={styles.inputGroupFull}>
                                <Text style={styles.inputLabel}>Adjustment Refund</Text>
                                <TextInput
                                    style={styles.input}
                                    keyboardType="numeric"
                                    value={adjustmentRefund}
                                    onChangeText={setAdjustmentRefund}
                                />
                            </View>

                            <View style={styles.inputGroupFull}>
                                <Text style={styles.inputLabel}>Adjustment Fee</Text>
                                <TextInput
                                    style={styles.input}
                                    keyboardType="numeric"
                                    value={adjustmentFee}
                                    onChangeText={setAdjustmentFee}
                                />
                            </View>
                        </View>
                    </View>

                    {/* Order Summary */}
                    {totals && (
                        <View style={styles.card}>
                            <Text style={styles.sectionTitle}>Order Summary</Text>

                            <View style={styles.summaryContainer}>
                                <View style={styles.summaryRow}>
                                    <Text style={styles.summaryLabel}>Subtotal</Text>
                                    <Text style={styles.summaryValue}>{totals.subtotal.formatted_price}</Text>
                                </View>

                                <View style={styles.summaryRow}>
                                    <Text style={styles.summaryLabel}>Discount</Text>
                                    <Text style={styles.summaryValue}>{totals.discount.formatted_price}</Text>
                                </View>

                                <View style={styles.summaryRow}>
                                    <Text style={styles.summaryLabel}>Tax</Text>
                                    <Text style={styles.summaryValue}>{totals.tax.formatted_price}</Text>
                                </View>

                                <View style={styles.summaryRow}>
                                    <Text style={styles.summaryLabel}>Shipping</Text>
                                    <Text style={styles.summaryValue}>{totals.shipping.formatted_price}</Text>
                                </View>

                                <View style={[styles.summaryRow, styles.totalRow]}>
                                    <Text style={[styles.summaryLabel, styles.boldLabel]}>Grand Total</Text>
                                    <Text style={[styles.summaryValue, styles.boldValue]}>{totals.grand_total.formatted_price}</Text>
                                </View>
                            </View>
                        </View>
                    )}

                </ScrollView>

                {/* Actions */}
                <View style={[styles.footerContainer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
                    <View style={styles.footerActions}>
                        <TouchableOpacity
                            style={styles.updateButton}
                            onPress={handleUpdateTotals}
                            disabled={isCalculating || isSubmitting}
                        >
                            {isCalculating ? (
                                <ActivityIndicator size="small" color="#00615E" />
                            ) : (
                                <Text style={styles.updateButtonText}>Update Totals</Text>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.submitButton}
                            onPress={handleSubmitRefund}
                            disabled={isCalculating || isSubmitting}
                        >
                            {isSubmitting ? (
                                <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                                <Text style={styles.submitButtonText}>Submit Refund</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        padding: 16,
        gap: 16,
    },
    emptyText: {
        fontFamily: 'Inter',
        color: '#6B7280',
        fontSize: 16,
    },
    card: {
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: '#E9E3D3',
        borderRadius: 8,
        padding: 16,
    },
    sectionTitle: {
        fontFamily: 'Inter',
        fontWeight: '600',
        fontSize: 16,
        color: '#111827',
        marginBottom: 16,
    },
    itemsContainer: {
        gap: 16,
    },
    itemRow: {
        gap: 16,
    },
    itemBorder: {
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        paddingTop: 16,
    },
    itemHeader: {
        flexDirection: 'row',
        gap: 12,
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
        color: '#00615E',
    },
    itemPriceInfo: {
        fontFamily: 'Inter',
        fontSize: 12,
        color: '#374151',
    },
    itemAttrInfo: {
        fontFamily: 'Inter',
        fontSize: 12,
        color: '#6B7280',
    },
    itemSkuInfo: {
        fontFamily: 'Inter',
        fontSize: 12,
        color: '#6B7280',
    },
    itemStatusInfo: {
        fontFamily: 'Inter',
        fontSize: 12,
        color: '#4B5563',
        marginTop: 4,
    },
    qtyRow: {
        flexDirection: 'column',
        gap: 12,
    },
    inputGroup: {
        width: '100%',
    },
    inputGroupFull: {
        width: '100%',
        marginBottom: 12,
    },
    inputLabel: {
        fontFamily: 'Inter',
        fontWeight: '500',
        fontSize: 12,
        color: '#374151',
        marginBottom: 4,
    },
    input: {
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        fontFamily: 'Inter',
        fontSize: 14,
        color: '#111827',
    },
    itemBreakdown: {
        backgroundColor: '#F9FAFB',
        padding: 12,
        borderRadius: 6,
        gap: 8,
    },
    breakdownRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
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
    adjustmentsContainer: {
        flexDirection: 'column',
    },
    summaryContainer: {
        gap: 12,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
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
        paddingTop: 12,
        marginTop: 4,
    },
    boldLabel: {
        fontWeight: '600',
        color: '#111827',
    },
    boldValue: {
        fontWeight: '700',
    },
    footerContainer: {
        backgroundColor: COLORS.white,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: '#E9E3D3',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: -2 },
                shadowOpacity: 0.05,
                shadowRadius: 3,
            },
            android: {
                elevation: 4,
            },
        }),
    },
    footerActions: {
        flexDirection: 'row',
        gap: 12,
    },
    updateButton: {
        flex: 1,
        backgroundColor: '#E6EFEF',
        borderWidth: 1,
        borderColor: '#B3D0CF',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    updateButtonText: {
        fontFamily: 'Inter',
        fontWeight: '600',
        fontSize: 14,
        color: '#00615E',
    },
    submitButton: {
        flex: 1,
        backgroundColor: COLORS.primary,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    submitButtonText: {
        fontFamily: 'Inter',
        fontWeight: '600',
        fontSize: 14,
        color: '#FFFFFF',
    },
});
