import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { formatters } from '@/shared/utils/formatters';
import { theme } from '@/theme';

interface MinimumOrderProgressCardProps {
    currentAmount: number;
    minimumAmount: number;
    freeShippingEnable?: boolean;
    freeShippingThreshold?: number;
    currencySymbol?: string;
}

export const MinimumOrderProgressCard: React.FC<MinimumOrderProgressCardProps> = ({
    currentAmount,
    minimumAmount,
    freeShippingEnable = false,
    freeShippingThreshold = 0,
    currencySymbol = 'MX$',
}) => {
    // Calculate progress percentage (capped at 100%)
    const progressPercent = Math.min(
        (currentAmount / (minimumAmount || 1)) * 100,
        100
    );

    const remainingAmount = Math.max(0, minimumAmount - currentAmount);

    const freeShippingRemaining = Math.max(freeShippingThreshold - currentAmount, 0);
    const hasMetFreeShipping = currentAmount >= freeShippingThreshold;

    return (
        <View style={styles.container}>
            {/* Supplier Minimum Order & Free Shipping */}
            <View style={styles.supplierRow}>
                <Text style={styles.supplierLabel}>Supplier minimum order</Text>
                {freeShippingEnable && freeShippingThreshold > 0 && (
                    <View style={styles.freeShippingBadge}>
                        <Text style={styles.freeShippingText}>
                            {hasMetFreeShipping
                                ? 'Free Shipping Met 🎉'
                                : `Add ${formatters.formatPrice(freeShippingRemaining, currencySymbol)} for Free Shipping`}
                        </Text>
                    </View>
                )}
            </View>

            {/* Progress Box */}
            <View style={styles.progressBox}>
                <View style={styles.progressHeader}>
                    <Text style={styles.progressTitle}>Progress to minimum</Text>
                    <Text style={styles.progressAmount}>
                        {formatters.formatPrice(currentAmount, currencySymbol)} / {formatters.formatPrice(minimumAmount, currencySymbol)}
                    </Text>
                </View>

                {remainingAmount > 0 ? (
                    <Text style={styles.progressDesc}>
                        You have {formatters.formatPrice(currentAmount, currencySymbol)} in cart from this supplier. Add {formatters.formatPrice(remainingAmount, currencySymbol)} more to reach the minimum.
                    </Text>
                ) : (
                    <Text style={styles.progressDesc}>
                        Congratulations! You have reached the minimum order amount for this supplier.
                    </Text>
                )}

                <View style={styles.progressBarTrack}>
                    <View
                        style={[
                            styles.progressBarFill,
                            { width: `${progressPercent}%` }
                        ]}
                    />
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E9E3D3',
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: theme.spacing.sm,
        gap: 12,
        alignSelf: 'stretch',
        marginBottom: 16,
    },
    supplierRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        //paddingVertical: theme.spacing.xs,
        //paddingHorizontal: 8,
        marginTop: 0,
    },
    supplierLabel: {
        fontSize: 11,
        color: '#000000',
    },
    freeShippingBadge: {
        backgroundColor: 'rgba(0, 97, 94, 0.1)',
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 50,
    },
    freeShippingText: {
        fontWeight: '500',
        fontSize: 11,
        color: '#00615E',
    },
    progressBox: {
        borderWidth: 1,
        borderColor: '#E9E3D3',
        borderRadius: 8,
        padding: 8,
        gap: 8,
    },
    progressHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    progressTitle: {
        fontWeight: '500',
        fontSize: 14,
        color: '#000000',
    },
    progressAmount: {
        fontWeight: '500',
        fontSize: 12,
        color: '#000000',
    },
    progressDesc: {
        fontSize: 12,
        lineHeight: 19,
        color: '#0A292D',
    },
    progressBarTrack: {
        height: 12,
        backgroundColor: '#F0F0F0',
        borderRadius: 254,
        width: '100%',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#00615E',
        borderRadius: 254,
    },
});
