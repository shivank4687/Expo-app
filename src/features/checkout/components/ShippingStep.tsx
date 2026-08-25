/**
 * ShippingStep Component
 * Checkout shipping method selection step
 */

import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Card } from '@/shared/components/Card';

import { theme } from '@/theme';
import { formatters } from '@/shared/utils/formatters';
import { ShippingMethod } from '../types/checkout.types';
import { Cart } from '@/features/cart/types/cart.types';

interface ShippingStepProps {
    cart: Cart | null;
    shippingMethods: Record<string, ShippingMethod> | null;
    selectedMethod: string | null;
    onMethodSelect: (method: string) => void;
}

export const ShippingStep: React.FC<ShippingStepProps> = ({
    cart,
    shippingMethods,
    selectedMethod,
    onMethodSelect,
}) => {
    const { t } = useTranslation();

    const getAdditionalDaysForSupplier = (storeName: string): number => {
        if (!cart || !cart.items || !storeName) return 0;

        // Filter items belonging to this supplier
        const supplierItems = cart.items.filter(item => {
            const itemSupplierName = item.product?.supplier?.company_name;
            if (!itemSupplierName) {
                return storeName.toLowerCase() === 'admin' || storeName.toLowerCase() === 'supplier';
            }
            return itemSupplierName.trim().toLowerCase() === storeName.trim().toLowerCase();
        });

        if (supplierItems.length === 0) return 0;

        // Calculate additional days for each item
        const itemsProductionDays = supplierItems.map(item => {
            const product = item.child?.product || item.product;
            if (!product || !product.made_to_order) return 0;

            const orderQty = item.quantity;
            const availableQty = product.quantity ?? 0;

            if (orderQty > availableQty) {
                const qtyToProduce = orderQty - Math.max(0, availableQty);
                const productionTimePerItem = product.made_to_order_days ?? 0;
                return qtyToProduce * productionTimePerItem;
            }

            return 0;
        });

        // Use the Consolidated (Maximum) Strategy approved by the user
        return Math.max(0, ...itemsProductionDays);
    };
    const allRates = useMemo(() => {
        return Object.entries(shippingMethods).flatMap(([carrierCode, carrier]) => {
            return (carrier.rates || []).map(rate => ({
                ...rate,
                carrierCode,
                carrierTitle: carrier.carrier_title,
            }));
        });
    }, [shippingMethods]);

    const carrierTitle = Object.values(shippingMethods)[0]?.carrier_title || t('checkout.shippingMethod', 'Shipping Method');

    const [isExpanded, setIsExpanded] = useState(true);

    return (
        <View style={styles.container}>
            {/* Scrollable Content */}
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Single early return fallback if shippingMethods is empty (placed here to keep react hooks ordered) */}
                {(!shippingMethods || Object.keys(shippingMethods).length === 0) && (
                    <Card style={styles.messageCard}>
                        <Text style={styles.messageText}>
                            {t('checkout.noShippingMethods', 'No shipping methods available')}
                        </Text>
                    </Card>
                )}
                {/* Shipping Method Carriers */}
                {allRates.length > 0 && (
                    <Card style={styles.carrierCard}>
                        {/* Carrier Header */}
                        <TouchableOpacity
                            style={styles.carrierHeader}
                            onPress={() => setIsExpanded(!isExpanded)}
                            activeOpacity={0.7}
                        >
                            <View style={styles.carrierTitleContainer}>
                                <Ionicons
                                    name="cube-outline"
                                    size={20}
                                    color={theme.colors.primary[500]}
                                />
                                <Text style={styles.carrierTitle}>
                                    {t('checkout.selectShippingMethod', 'Select Shipping Method')}
                                </Text>
                            </View>
                            <Ionicons
                                name={isExpanded ? 'chevron-up' : 'chevron-down'}
                                size={24}
                                color={theme.colors.text.secondary}
                            />
                        </TouchableOpacity>

                        {/* Carrier Rates */}
                        {isExpanded && (
                            <View style={styles.ratesContainer}>
                                {allRates.map((rate) => {
                                    const methodKey = `${rate.carrierCode}_${rate.method}`;
                                    const isSelected = selectedMethod === methodKey;
                                    const isUnavailable = rate.supplier_breakdown?.some(
                                        (b) => b.unavailable === true
                                    ) ?? false;

                                    return (
                                        <TouchableOpacity
                                            key={rate.method}
                                            style={[
                                                styles.rateItem,
                                                isSelected && styles.rateItemSelected,
                                                isUnavailable && styles.rateItemDisabled,
                                            ]}
                                            onPress={() => !isUnavailable && onMethodSelect(methodKey)}
                                            activeOpacity={isUnavailable ? 1 : 0.7}
                                            disabled={isUnavailable}
                                        >
                                            {/* Radio Button */}
                                            <View
                                                style={[
                                                    styles.radio,
                                                    isSelected && styles.radioSelected,
                                                    isUnavailable && styles.radioDisabled,
                                                ]}
                                            >
                                                {isSelected && (
                                                    <View style={styles.radioInner} />
                                                )}
                                            </View>

                                            {/* Method Details */}
                                            <View style={styles.rateDetails}>
                                                {/* Title and Price Row */}
                                                <View style={styles.rateTitleRow}>
                                                    <Text style={[
                                                        styles.rateTitle,
                                                        isUnavailable && styles.rateTitleDisabled,
                                                    ]}>
                                                        {rate.method_title}
                                                    </Text>
                                                    <Text style={[
                                                        styles.ratePrice,
                                                        isUnavailable && styles.ratePriceDisabled,
                                                    ]}>
                                                        {rate.formatted_price || rate.base_formatted_price}
                                                    </Text>
                                                </View>

                                                {/* Description */}
                                                {rate.method_description && (
                                                    <Text style={styles.rateDescription}>
                                                        {rate.method_description}
                                                    </Text>
                                                )}

                                                {/* Unavailability Warning Badge */}
                                                {isUnavailable && (
                                                    <View style={styles.unavailableBadge}>
                                                        <Ionicons name="warning-outline" size={12} color="#DC2626" />
                                                        <Text style={styles.unavailableText}>
                                                            Shipping unavailable for some suppliers
                                                        </Text>
                                                    </View>
                                                )}

                                                {/* Store-wise Shipping Breakdown */}
                                                {rate.supplier_breakdown && rate.supplier_breakdown.length > 0 && (
                                                    <View style={styles.breakdownContainer}>
                                                        <Text style={styles.breakdownTitle}>
                                                            {t('checkout.storewiseShipping', 'Storewise Shipping:')}
                                                        </Text>
                                                        {rate.supplier_breakdown.map((breakdown, idx) => (
                                                            breakdown.unavailable ? (
                                                                <View key={idx} style={styles.breakdownItemUnavailable}>
                                                                    <Ionicons name="warning-outline" size={11} color="#DC2626" />
                                                                    <Text style={styles.breakdownUnavailableText}>
                                                                        Shipping not available from {breakdown.store_name}
                                                                    </Text>
                                                                </View>
                                                            ) : (
                                                                <View key={idx} style={styles.breakdownItem}>
                                                                    <View style={styles.breakdownInfo}>
                                                                        <Text style={styles.breakdownStoreName}>
                                                                            {breakdown.store_name}
                                                                        </Text>
                                                                        {breakdown.days && (
                                                                            <Text style={styles.breakdownDays}>
                                                                                {t('checkout.estDelivery', 'Est. Delivery')}: {
                                                                                    (() => {
                                                                                        const additionalDays = getAdditionalDaysForSupplier(breakdown.store_name);
                                                                                        const baseDays = typeof breakdown.days === 'string'
                                                                                            ? parseInt(breakdown.days, 10)
                                                                                            : breakdown.days;
                                                                                        const totalDays = isNaN(baseDays) ? additionalDays : baseDays + additionalDays;
                                                                                        return formatters.getEstimatedDeliveryDate(totalDays);
                                                                                    })()
                                                                                }
                                                                            </Text>
                                                                        )}
                                                                    </View>
                                                                    <Text style={styles.breakdownPrice}>
                                                                        {breakdown.formatted_price}
                                                                    </Text>
                                                                </View>
                                                            )
                                                        ))}
                                                    </View>
                                                )}
                                            </View>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        )}
                    </Card>
                )}
            </ScrollView>

        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: theme.spacing.xs,
    },
    sectionTitle: {
        fontSize: theme.typography.fontSize.lg,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.md,
    },
    carrierCard: {
        marginBottom: theme.spacing.md,
        padding: 0,
        overflow: 'hidden',
    },
    carrierHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: theme.spacing.md,
        backgroundColor: theme.colors.white,
    },
    carrierTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
    },
    carrierTitle: {
        fontSize: theme.typography.fontSize.md,
        fontWeight: theme.typography.fontWeight.semiBold,
        color: theme.colors.text.primary,
    },
    ratesContainer: {
        backgroundColor: theme.colors.gray[50],
    },
    rateItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: theme.spacing.md,
        borderTopWidth: 1,
        borderTopColor: theme.colors.gray[200],
    },
    rateItemSelected: {
        backgroundColor: theme.colors.primary[50],
    },
    radio: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: theme.colors.gray[400],
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: theme.spacing.md,
    },
    radioSelected: {
        borderColor: theme.colors.primary[500],
    },
    radioInner: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: theme.colors.primary[500],
    },
    rateDetails: {
        flex: 1,
    },
    rateTitleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: theme.spacing.xs,
    },
    rateTitle: {
        fontSize: theme.typography.fontSize.md,
        fontWeight: theme.typography.fontWeight.medium,
        color: theme.colors.text.primary,
        flex: 1,
        marginRight: theme.spacing.sm,
    },
    rateDescription: {
        fontSize: theme.typography.fontSize.xs,
        color: theme.colors.text.secondary,
        marginBottom: theme.spacing.xs,
    },
    ratePrice: {
        fontSize: theme.typography.fontSize.md,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.primary[500],
    },
    addressCard: {
        marginBottom: theme.spacing.md,
        padding: 0,
        overflow: 'hidden',
    },
    addressHeader: {
        padding: theme.spacing.md,
        backgroundColor: theme.colors.gray[50],
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.gray[200],
    },
    addressTitle: {
        fontSize: theme.typography.fontSize.md,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.text.primary,
    },
    addressContent: {
        padding: theme.spacing.md,
    },
    addressName: {
        fontSize: theme.typography.fontSize.md,
        fontWeight: theme.typography.fontWeight.semiBold,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.xs,
    },
    addressText: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.text.secondary,
        marginBottom: 2,
    },
    addressActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        padding: theme.spacing.md,
        paddingTop: theme.spacing.sm,
        borderTopWidth: 1,
        borderTopColor: theme.colors.gray[200],
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.xs,
    },
    actionButtonText: {
        fontSize: theme.typography.fontSize.sm,
        fontWeight: theme.typography.fontWeight.semiBold,
        color: theme.colors.primary[500],
    },
    addAddressButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.spacing.sm,
        padding: theme.spacing.xl,
        borderWidth: 2,
        borderStyle: 'dashed',
        borderColor: theme.colors.gray[300],
        borderRadius: theme.borderRadius.md,
        margin: theme.spacing.md,
    },
    addAddressText: {
        fontSize: theme.typography.fontSize.md,
        fontWeight: theme.typography.fontWeight.semiBold,
        color: theme.colors.primary[500],
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: theme.spacing.md,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 4,
        borderWidth: 2,
        borderColor: theme.colors.gray[400],
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: theme.spacing.sm,
    },
    checkboxChecked: {
        backgroundColor: theme.colors.primary[500],
        borderColor: theme.colors.primary[500],
    },
    checkboxLabel: {
        fontSize: theme.typography.fontSize.md,
        color: theme.colors.text.primary,
    },
    divider: {
        height: 1,
        backgroundColor: theme.colors.gray[200],
        marginVertical: theme.spacing.md,
    },
    messageCard: {
        padding: theme.spacing.lg,
        alignItems: 'center',
    },
    messageText: {
        fontSize: theme.typography.fontSize.md,
        color: theme.colors.text.secondary,
        textAlign: 'center',
    },
    breakdownContainer: {
        marginTop: theme.spacing.sm,
        paddingTop: theme.spacing.sm,
        borderTopWidth: 1,
        borderTopColor: theme.colors.gray[200],
    },
    breakdownTitle: {
        fontSize: theme.typography.fontSize.xs,
        fontWeight: theme.typography.fontWeight.semiBold,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.xs,
    },
    breakdownItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: theme.spacing.xs,
    },
    breakdownStoreName: {
        fontSize: theme.typography.fontSize.xs,
        color: theme.colors.text.secondary,
        flex: 1,
    },
    breakdownPrice: {
        fontSize: theme.typography.fontSize.xs,
        fontWeight: theme.typography.fontWeight.medium,
        color: theme.colors.primary[500],
        marginLeft: theme.spacing.sm,
    },
    breakdownInfo: {
        flex: 1,
    },
    breakdownDays: {
        fontSize: 10,
        color: theme.colors.text.secondary,
        fontStyle: 'italic',
        marginTop: 2,
    },
    rateItemDisabled: {
        backgroundColor: theme.colors.gray[50],
        opacity: 0.65,
    },
    radioDisabled: {
        borderColor: theme.colors.gray[300],
    },
    rateTitleDisabled: {
        color: theme.colors.text.secondary,
    },
    ratePriceDisabled: {
        color: theme.colors.gray[400],
    },
    unavailableBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: theme.spacing.xs,
        marginBottom: theme.spacing.xs,
    },
    unavailableText: {
        fontSize: theme.typography.fontSize.xs,
        color: '#DC2626',
        fontWeight: theme.typography.fontWeight.medium,
    },
    breakdownItemUnavailable: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: theme.spacing.xs,
    },
    breakdownUnavailableText: {
        fontSize: theme.typography.fontSize.xs,
        color: '#DC2626',
        fontWeight: theme.typography.fontWeight.medium,
        flex: 1,
    },
});
