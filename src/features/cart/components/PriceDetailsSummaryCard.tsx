import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { theme } from '@/theme';
import { useTranslation } from 'react-i18next';

type PriceDetailsSummaryCardProps = {
    subtotal: string;
    tax: string;
    discount?: string;
    couponCode?: string;
    onCheckoutPress: () => void;
    buttonText?: string;
    loading?: boolean;
    disabled?: boolean;
    shipping?: string;
    grandTotal?: string;
};

export const PriceDetailsSummaryCard: React.FC<PriceDetailsSummaryCardProps> = ({
    subtotal,
    tax,
    discount,
    couponCode,
    onCheckoutPress,
    buttonText = 'Checkout',
    loading,
    disabled,
    shipping,
    grandTotal,
}) => {
    const { t } = useTranslation();

    const rows = [
        { label: t('cart.subtotal', 'Subtotal'), value: subtotal },
        ...(discount && parseFloat(discount.replace(/[^0-9.-]+/g, "")) !== 0
            ? [
                  {
                      label: t('cart.discount', 'Discount') + (couponCode ? ` (${couponCode})` : ''),
                      value: discount.startsWith('-') ? discount : `-${discount}`,
                      isDiscount: true,
                  }
              ]
            : []),
        ...(shipping ? [{ label: t('cart.shipping', 'Shipping'), value: shipping }] : []),
        { label: t('cart.tax', 'Tax'), value: tax }
    ];

    const isButtonDisabled = disabled || loading;

    return (
        <View style={styles.card}>
            <View style={styles.content}>
                {rows.map((row) => (
                    <View key={row.label} style={styles.row}>
                        <Text style={[styles.label, row.isDiscount && styles.discountText]}>
                            {row.label}
                        </Text>
                        <Text style={[styles.value, row.isDiscount && styles.discountText]}>
                            {row.value}
                        </Text>
                    </View>
                ))}
            </View>
            {grandTotal && (
                <>
                    <View style={styles.divider} />
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>{t('cart.grandTotal', 'Grand Total')}</Text>
                        <Text style={styles.totalValue}>{grandTotal}</Text>
                    </View>
                </>
            )}
            {disabled && !loading && (
                <Text style={styles.minimumOrderHint}>
                    {t('cart.minimumOrderNotMet', 'Meet the minimum order for all stores to proceed')}
                </Text>
            )}
            <TouchableOpacity
                style={[
                    styles.button,
                    isButtonDisabled && styles.buttonDisabled,
                ]}
                activeOpacity={0.75}
                onPress={onCheckoutPress}
                disabled={isButtonDisabled}
            >
                {loading ? (
                    <ActivityIndicator color={theme.colors.white} />
                ) : (
                    <Text style={styles.buttonText}>{buttonText}</Text>
                )}
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        width: '100%',
        padding: theme.spacing.sm,
        backgroundColor: theme.colors.white,
        borderRadius: theme.borderRadius.md,
        borderWidth: 1,
        borderColor: theme.colors.border.card_light,
        alignItems: 'stretch',
        justifyContent: 'space-between'
    },
    content: {
        gap: theme.spacing.sm
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    label: {
        fontSize: theme.typography.fontSize.sm,
        fontWeight: theme.typography.fontWeight.medium,
        color: '#0A292D'
    },
    value: {
        fontSize: 14,
        fontWeight: '700',
        color: theme.colors.primary[500]
    },
    discountText: {
        color: theme.colors.success.main,
    },
    divider: {
        height: 1,
        backgroundColor: theme.colors.gray[200],
        marginVertical: theme.spacing.sm,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    totalLabel: {
        fontSize: theme.typography.fontSize.md,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.text.primary,
    },
    totalValue: {
        fontSize: theme.typography.fontSize.md,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.primary[500],
    },
    button: {
        marginTop: theme.spacing.sm,
        backgroundColor: theme.colors.primary[500],
        borderRadius: theme.borderRadius.md,
        paddingVertical: theme.spacing.sm,
        alignItems: 'center'
    },
    buttonDisabled: {
        opacity: 0.65,
    },
    buttonText: {
        color: '#F5F5F5',
        fontSize: 16,
        fontWeight: '500'
    },
    minimumOrderHint: {
        marginTop: theme.spacing.sm,
        fontSize: theme.typography.fontSize.xs,
        color: theme.colors.error.main,
        textAlign: 'center',
    }
});
