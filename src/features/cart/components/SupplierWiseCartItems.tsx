import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/theme';
import { CartItem } from '@/features/cart/types/cart.types';
import { CartItemCard } from './CartItemCard';
import { MinimumOrderProgressCard } from './MinimumOrderProgressCard';
import { useAppSelector } from '@/store/hooks';

interface SupplierWiseCartItemsProps {
    items: CartItem[];
    /** Called whenever the minimum-order status changes. `true` = all suppliers met. */
    onMinimumOrderStatus?: (allMet: boolean) => void;
    selectedItemIds: number[];
    onToggleSelection: (id: number) => void;
}

export const SupplierWiseCartItems: React.FC<SupplierWiseCartItemsProps> = ({
    items,
    onMinimumOrderStatus,
    selectedItemIds,
    onToggleSelection
}) => {
    const { selectedCurrency } = useAppSelector((state) => state.core);
    const { user } = useAppSelector((state) => state.auth);
    const currencySymbol = selectedCurrency?.symbol || selectedCurrency?.code || '$';
    const isWholesale =
        user?.group?.code?.toLowerCase() === 'wholesale' ||
        user?.group?.name?.toLowerCase() === 'wholesale' ||
        user?.group?.id === 3 ||
        user?.customer_group_id === 3;

    // console.log('🛒 [SupplierWiseCartItems] User:', JSON.stringify(user));
    // console.log('🛒 [SupplierWiseCartItems] isWholesale:', isWholesale);

    const groupedItems = items.reduce((acc, item) => {
        const storeName = item.product?.supplier?.company_name || 'Other';
        if (!acc[storeName]) acc[storeName] = [];
        acc[storeName].push(item);
        return acc;
    }, {} as Record<string, CartItem[]>);

    const isSupplierOnHoliday = (supplier: any) => {
        if (!supplier?.holiday_start_date || !supplier?.holiday_end_date) return false;
        const now = new Date();
        const start = new Date(supplier.holiday_start_date);
        const end = new Date(supplier.holiday_end_date);
        return now >= start && now <= end;
    };

    // Derive whether every supplier's minimum order amount has been reached
    const allMinimumsMet = isWholesale
        ? Object.values(groupedItems).every((storeItems) => {
            const minimumAmount = Number(storeItems[0]?.product?.supplier?.minimum_order_amount) || 0;
            if (minimumAmount <= 0) return true;
            const storeTotal = storeItems.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
            return storeTotal >= minimumAmount;
        })
        : true;

    useEffect(() => {
        onMinimumOrderStatus?.(allMinimumsMet);
    }, [allMinimumsMet]);

    return (
        <View>
            {Object.entries(groupedItems).map(([storeName, storeItems]) => {
                const supplierObj = storeItems[0]?.product?.supplier;
                const minimumAmount = Number(supplierObj?.minimum_order_amount) || 0;
                const freeShippingEnable = Boolean(supplierObj?.free_shipping_enable);
                const freeShippingThreshold = Number(supplierObj?.free_shipping_threshold) || 0;
                const storeTotal = storeItems.reduce((sum, item) => sum + (Number(item.total) || 0), 0);

                // console.log(`🛒 [SupplierWiseCartItems] Store "${storeName}":`, {
                //     supplierObj,
                //     minimumAmount,
                //     freeShippingEnable,
                //     freeShippingThreshold,
                //     storeTotal,
                //     shouldRenderCard: (minimumAmount > 0 && isWholesale) || (freeShippingEnable && freeShippingThreshold > 0)
                // });

                return (
                    <View key={storeName} style={styles.storeGroup}>
                        <View style={styles.storeHeader}>
                            <View style={styles.storeTitleContainer}>
                                <Text style={styles.storeTitle}>
                                    {storeName} x{storeItems.length}
                                </Text>
                                {isSupplierOnHoliday(storeItems[0]?.product?.supplier) && (
                                    <View style={styles.holidayBadge}>
                                        <View style={styles.pulseIndicator} />
                                        <Text style={styles.holidayText}>ON HOLIDAY</Text>
                                    </View>
                                )}
                            </View>
                            <Text style={styles.storeTotal}>
                                Total {currencySymbol}{storeTotal.toFixed(2)}
                            </Text>
                        </View>
                        {storeItems.map((item) => (
                            <CartItemCard
                                key={item.id}
                                item={item}
                                isSelected={selectedItemIds.includes(item.id)}
                                onToggleSelection={onToggleSelection}
                            />
                        ))}

                        {((minimumAmount > 0 && isWholesale) || (freeShippingEnable && freeShippingThreshold > 0)) && (
                            <MinimumOrderProgressCard
                                currentAmount={storeTotal}
                                minimumAmount={isWholesale ? minimumAmount : 0}
                                freeShippingEnable={freeShippingEnable}
                                freeShippingThreshold={freeShippingThreshold}
                                currencySymbol={currencySymbol}
                            />
                        )}
                    </View>
                );
            })}
        </View>
    );
};

const styles = StyleSheet.create({
    storeGroup: {
        marginBottom: theme.spacing.xs,
        backgroundColor: theme.colors.background.default,
        borderRadius: theme.borderRadius.lg,
        paddingHorizontal: theme.spacing.xs,
        paddingVertical: theme.spacing.sm,
        // Shadow for iOS
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        // Elevation for Android
        elevation: 2,
        // Border as fallback or combined styling
        borderWidth: 1,
        borderColor: theme.colors.gray[200],
    },
    storeHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: theme.spacing.xxs,
        // borderBottomWidth: 1,
        // borderBottomColor: theme.colors.gray[200],
        marginBottom: theme.spacing.sm,
        gap: 10,
    },
    storeTitle: {
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '700',
        fontSize: 16,
        color: '#000000',
    },
    storeTotal: {
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '600',
        fontSize: 14,
        textAlign: 'right',
        color: '#00615E',
    },
    storeTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    holidayBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEF3C7', // amber-100
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        gap: 4,
    },
    holidayText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#B45309', // amber-700
    },
    pulseIndicator: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#F59E0B', // amber-500
    },
});
