import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Product } from '@/features/product/types/product.types';
import { ProductImage } from '@/shared/components/LazyImage';
import { formatters } from '@/shared/utils/formatters';
import { theme } from '@/theme';
import { useAppSelector } from '@/store/hooks';

interface MiniProductCardProps {
    product: Product;
    onPress: () => void;
    showPrice?: boolean;
}

export const MiniProductCard: React.FC<MiniProductCardProps> = ({ product, onPress, showPrice = true }) => {
    const { selectedCurrency } = useAppSelector((state) => state.core);
    const currencySymbol = selectedCurrency?.symbol || selectedCurrency?.code || '$';

    const imageUrl = product.thumbnail || (product.images && product.images[0]?.url);

    return (
        <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.8}>
            <View style={styles.imageContainer}>
                <ProductImage
                    imageUrl={imageUrl}
                    style={styles.image}
                    priority="low"
                />
            </View>
            <View style={styles.info}>
                <Text style={styles.name} numberOfLines={1}>
                    {product.name}
                </Text>
                {showPrice && (
                    <Text style={styles.price}>
                        {formatters.formatPrice(product.price, currencySymbol)}
                    </Text>
                )}
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        width: 140,
        backgroundColor: theme.colors.white,
        borderRadius: theme.borderRadius.lg,
        borderWidth: 1,
        borderColor: theme.colors.border.card_light,
        overflow: 'hidden',
    },
    imageContainer: {
        width: '100%',
        height: 100,
        backgroundColor: theme.colors.background.default,
    },
    image: {
        width: '100%',
        height: '100%',
    },
    info: {
        padding: theme.spacing.sm,
    },
    name: {
        fontSize: theme.typography.fontSize.xs,
        fontWeight: theme.typography.fontWeight.medium,
        color: theme.colors.text.primary,
        marginBottom: 2,
    },
    price: {
        fontSize: theme.typography.fontSize.sm,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.primary[500],
    },
});
