/**
 * OrderSummaryCard Component
 * Displays order summary with all totals
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { theme } from '@/theme';
import { Order } from '@/services/api/orders.api';

interface OrderSummaryCardProps {
    order: Order;
}

export const OrderSummaryCard: React.FC<OrderSummaryCardProps> = ({ order }) => {
    const { t } = useTranslation();

    const renderSummaryRow = (
        label: string,
        value: string | number | undefined,
        isBold: boolean = false,
        isTotal: boolean = false
    ) => {
        if (value === undefined || value === null || value === 0) {
            return null;
        }

        const displayValue = typeof value === 'string' 
            ? value 
            : order.order_currency_code 
                ? `${order.order_currency_code} ${value.toFixed(2)}`
                : `$${value.toFixed(2)}`;

        return (
            <View style={[styles.summaryRow, isTotal && styles.totalRow]}>
                <Text style={[styles.summaryLabel, isBold && styles.boldLabel]}>
                    {label}
                </Text>
                <Text style={[styles.summaryValue, isBold && styles.boldValue, isTotal && styles.totalValue]}>
                    {displayValue}
                </Text>
            </View>
        );
    };

    return (
        <View style={styles.card}>
            <Text style={styles.title}>
                {t('orders.orderSummary', 'Order Summary')}
            </Text>

            <View style={styles.summary}>
                {/* Subtotal */}
                {renderSummaryRow(
                    t('orders.subtotal', 'Subtotal'),
                    order.formatted_sub_total_incl_tax || order.formatted_sub_total || order.sub_total_incl_tax || order.sub_total
                )}

                {/* Shipping */}
                {order.shipping_amount !== undefined && order.shipping_amount !== null && (
                    renderSummaryRow(
                        t('orders.shippingHandling', 'Shipping & Handling'),
                        order.formatted_shipping_amount_incl_tax || order.formatted_shipping_amount || order.shipping_amount_incl_tax || order.shipping_amount
                    )
                )}

                {/* Tax */}
                {renderSummaryRow(
                    t('orders.tax', 'Tax'),
                    order.formatted_tax_amount || order.tax_amount
                )}

                {/* Discount */}
                {order.discount_amount !== undefined && order.discount_amount !== null && order.discount_amount > 0 && (
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>
                            {t('orders.discount', 'Discount')}
                            {order.coupon_code && ` (${order.coupon_code})`}
                        </Text>
                        <Text style={[styles.summaryValue, styles.discountValue]}>
                            -{order.formatted_discount_amount || (order.order_currency_code 
                                ? `${order.order_currency_code} ${Math.abs(order.discount_amount).toFixed(2)}`
                                : `$${Math.abs(order.discount_amount).toFixed(2)}`)}
                        </Text>
                    </View>
                )}

                {/* Grand Total */}
                {renderSummaryRow(
                    t('orders.grandTotal', 'Grand Total'),
                    order.formatted_grand_total || order.grand_total,
                    true,
                    true
                )}

                {/* Divider */}
                {(order.grand_total_invoiced || order.grand_total_refunded || order.total_due) && (
                    <View style={styles.divider} />
                )}

                {/* Total Paid */}
                {renderSummaryRow(
                    t('orders.totalPaid', 'Total Paid'),
                    order.formatted_grand_total_invoiced || order.grand_total_invoiced
                )}

                {/* Total Refunded */}
                {renderSummaryRow(
                    t('orders.totalRefunded', 'Total Refunded'),
                    order.formatted_grand_total_refunded || order.grand_total_refunded
                )}

                {/* Total Due */}
                {order.status !== 'canceled' && renderSummaryRow(
                    t('orders.totalDue', 'Total Due'),
                    order.formatted_total_due || order.total_due
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: theme.colors.white,
        borderRadius: theme.borderRadius.md,
        marginHorizontal: theme.spacing.md,
        marginVertical: theme.spacing.sm,
        padding: theme.spacing.lg,
        borderWidth: 1,
        borderColor: theme.colors.gray[200],
    },
    title: {
        fontSize: theme.typography.fontSize.lg,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.md,
    },
    summary: {
        gap: theme.spacing.sm,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: theme.spacing.xs,
    },
    totalRow: {
        marginTop: theme.spacing.xs,
        paddingTop: theme.spacing.md,
        borderTopWidth: 1,
        borderTopColor: theme.colors.gray[300],
    },
    summaryLabel: {
        fontSize: theme.typography.fontSize.base,
        color: theme.colors.text.secondary,
    },
    boldLabel: {
        fontWeight: theme.typography.fontWeight.semiBold,
        color: theme.colors.text.primary,
    },
    summaryValue: {
        fontSize: theme.typography.fontSize.base,
        color: theme.colors.text.primary,
        fontWeight: theme.typography.fontWeight.medium,
    },
    boldValue: {
        fontWeight: theme.typography.fontWeight.semiBold,
    },
    totalValue: {
        fontSize: theme.typography.fontSize.lg,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.primary[500],
    },
    discountValue: {
        color: theme.colors.success.main,
    },
    divider: {
        height: 1,
        backgroundColor: theme.colors.gray[200],
        marginVertical: theme.spacing.sm,
    },
});

