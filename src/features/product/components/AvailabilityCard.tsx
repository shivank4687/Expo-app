import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { theme } from '@/theme';

interface AvailabilityCardProps {
    immediateShipping?: boolean;
    madeToOrder?: boolean;
    madeToOrderDays?: number | null;
    madeToOrderQty?: number | null;
}

/**
 * AvailabilityCard Component
 * Displays product availability status (Immediate Shipping or Made to Order)
 * matching the web implementation.
 */
export const AvailabilityCard: React.FC<AvailabilityCardProps> = ({
    immediateShipping,
    madeToOrder,
    madeToOrderDays,
    madeToOrderQty,
}) => {
    const { t } = useTranslation();

    // Prioritize Made to Order
    if (madeToOrder) {
        return (
            <View style={[styles.card, styles.madeToOrderCard]}>
                <View style={styles.iconContainer}>
                    <View style={[styles.iconCircle, styles.madeToOrderIconCircle]}>
                        <Ionicons name="time-outline" size={20} color="#c2410c" />
                    </View>
                </View>
                <View style={styles.content}>
                    <Text style={[styles.title, styles.madeToOrderTitle]}>
                        {t('product.madeToOrder')}
                    </Text>
                    <View style={styles.detailsRow}>
                        {madeToOrderDays ? (
                            <Text style={styles.detailText}>
                                {t('product.productionTime', { days: madeToOrderDays })}
                            </Text>
                        ) : null}

                        {madeToOrderDays && madeToOrderQty ? (
                            <Text style={styles.separator}> · </Text>
                        ) : null}

                        {madeToOrderQty ? (
                            <Text style={styles.detailText}>
                                {t('product.madeToOrderQty', { qty: madeToOrderQty })}
                            </Text>
                        ) : null}
                    </View>
                </View>
            </View>
        );
    }

    if (immediateShipping) {
        return (
            <View style={[styles.card, styles.immediateShippingCard]}>
                <View style={styles.iconContainer}>
                    <View style={[styles.iconCircle, styles.immediateShippingIconCircle]}>
                        <Ionicons name="checkmark" size={22} color="#15803d" />
                    </View>
                </View>
                <View style={styles.content}>
                    <Text style={[styles.title, styles.immediateShippingTitle]}>
                        {t('product.immediateShipping')}
                    </Text>
                    <Text style={styles.description}>
                        {t('product.immediateShippingDesc')}
                    </Text>
                </View>
            </View>
        );
    }

    return null;
};

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        padding: theme.spacing.xs,
        borderRadius: theme.borderRadius.xl,
        marginBottom: theme.spacing.xs,
        borderWidth: 1,
    },
    madeToOrderCard: {
        backgroundColor: '#fff7ed', // orange-50
        borderColor: '#ffedd5', // orange-100
    },
    immediateShippingCard: {
        backgroundColor: '#f0fdf4', // green-50
        borderColor: '#dcfce7', // green-100
    },
    iconContainer: {
        marginRight: theme.spacing.md,
        justifyContent: 'center',
    },
    iconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    madeToOrderIconCircle: {
        backgroundColor: '#ffedd5', // orange-100
    },
    immediateShippingIconCircle: {
        backgroundColor: '#dcfce7', // green-100
    },
    content: {
        flex: 1,
        justifyContent: 'center',
    },
    title: {
        fontSize: theme.typography.fontSize.base,
        fontWeight: theme.typography.fontWeight.bold,
        marginBottom: 2,
    },
    madeToOrderTitle: {
        color: '#9a3412', // orange-800
    },
    immediateShippingTitle: {
        color: '#166534', // green-800
    },
    description: {
        fontSize: theme.typography.fontSize.sm,
        color: '#15803d', // green-700
        lineHeight: 18,
    },
    detailsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
    },
    detailText: {
        fontSize: theme.typography.fontSize.sm,
        color: '#c2410c', // orange-700
    },
    separator: {
        fontSize: theme.typography.fontSize.sm,
        color: '#fdba74', // orange-300
        fontWeight: 'bold',
    },
});
