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
}

export const SupplierWiseCartItems: React.FC<SupplierWiseCartItemsProps> = ({ items, onMinimumOrderStatus }) => {
    const { selectedCurrency } = useAppSelector((state) => state.core);
    const currencySymbol = selectedCurrency?.symbol || selectedCurrency?.code || '$';

    const groupedItems = items.reduce((acc, item) => {
        const storeName = item.product?.supplier?.company_name || 'Other';
        if (!acc[storeName]) acc[storeName] = [];
        acc[storeName].push(item);
        return acc;
    }, {} as Record<string, CartItem[]>);

    // Derive whether every supplier's minimum order amount has been reached
    const allMinimumsMet = Object.values(groupedItems).every((storeItems) => {
        const minimumAmount = storeItems[0]?.product?.supplier?.minimum_order_amount;
        if (!minimumAmount || minimumAmount <= 0) return true;
        const storeTotal = storeItems.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
        return storeTotal >= minimumAmount;
    });

    useEffect(() => {
        onMinimumOrderStatus?.(allMinimumsMet);
    }, [allMinimumsMet]);

    return (
        <View>
            {Object.entries(groupedItems).map(([storeName, storeItems]) => {
                const minimumAmount = storeItems[0]?.product?.supplier?.minimum_order_amount;
                const storeTotal = storeItems.reduce((sum, item) => sum + (Number(item.total) || 0), 0);

                return (
                    <View key={storeName} style={styles.storeGroup}>
                        <View style={styles.storeHeader}>
                            <Text style={styles.storeTitle}>
                                {storeName} x{storeItems.length}
                            </Text>
                            <Text style={styles.storeTotal}>
                                Total {currencySymbol}{storeTotal.toFixed(2)}
                            </Text>
                        </View>
                        {storeItems.map((item) => (
                            <CartItemCard key={item.id} item={item} />
                        ))}

                        {!!minimumAmount && minimumAmount > 0 && (
                            <MinimumOrderProgressCard 
                                currentAmount={storeTotal}
                                minimumAmount={minimumAmount}
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
        marginBottom: theme.spacing.lg,
        backgroundColor: theme.colors.background.default,
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.md,
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
        paddingBottom: theme.spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.gray[200],
        marginBottom: theme.spacing.md,
        gap: 10,
        height: 17 + theme.spacing.sm, // To accommodate figma strictly plus bottom padding
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
});
