import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/theme';
import { CartItem } from '@/features/cart/types/cart.types';
import { CartItemCard } from './CartItemCard';

interface SupplierWiseCartItemsProps {
    items: CartItem[];
}

export const SupplierWiseCartItems: React.FC<SupplierWiseCartItemsProps> = ({ items }) => {
    const groupedItems = items.reduce((acc, item) => {
        const storeName = item.product?.supplier?.company_name || 'Other';
        if (!acc[storeName]) acc[storeName] = [];
        acc[storeName].push(item);
        return acc;
    }, {} as Record<string, CartItem[]>);

    return (
        <View>
            {Object.entries(groupedItems).map(([storeName, storeItems]) => (
                <View key={storeName} style={styles.storeGroup}>
                    <View style={styles.storeHeader}>
                        <Ionicons name="storefront-outline" size={18} color={theme.colors.text.secondary} />
                        <Text style={styles.storeTitle}>
                            {storeName} <Text style={styles.storeCount}>x{storeItems.length}</Text>
                        </Text>
                    </View>
                    {storeItems.map((item) => (
                        <CartItemCard key={item.id} item={item} />
                    ))}
                </View>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    storeGroup: {
        marginBottom: theme.spacing.md,
    },
    storeHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
        paddingHorizontal: theme.spacing.xs,
        paddingBottom: theme.spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.gray[200],
        marginBottom: theme.spacing.md,
    },
    storeTitle: {
        fontSize: theme.typography.fontSize.md,
        fontWeight: theme.typography.fontWeight.semiBold,
        color: theme.colors.text.primary,
        textTransform: 'uppercase',
    },
    storeCount: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.text.secondary,
        fontWeight: theme.typography.fontWeight.regular,
        textTransform: 'none',
    },
});
