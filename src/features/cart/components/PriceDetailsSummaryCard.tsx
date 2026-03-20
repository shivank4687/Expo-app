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
    const rows = [
        { label: 'Subtotal', value: subtotal },
        ...(discount
            ? [
                  {
                      label: `Discount${couponCode ? ` (${couponCode})` : ''}`,
                      value: `-${discount}`
                  }
              ]
            : []),
        ...(shipping ? [{ label: 'Shipping', value: shipping }] : []),
        { label: 'Tax', value: tax }
    ];

    const isButtonDisabled = disabled || loading;

    const { t } = useTranslation();

    return (
        <View style={styles.card}>
            <View style={styles.content}>
                {rows.map((row) => (
                    <View key={row.label} style={styles.row}>
                        <Text style={styles.label}>{row.label}</Text>
                        <Text style={styles.value}>{row.value}</Text>
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
    }
});
