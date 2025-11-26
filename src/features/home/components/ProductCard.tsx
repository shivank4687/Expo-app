import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Product } from '@/features/product/types/product.types';
import { Card } from '@/shared/components/Card';
import { formatters } from '@/shared/utils/formatters';
import { theme } from '@/theme';

interface ProductCardProps {
    product: Product;
    onPress: () => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onPress }) => {
    const imageUrl = product.thumbnail || product.images[0]?.url || 'https://via.placeholder.com/200';
    const hasDiscount = product.special_price && product.special_price < product.price;

    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
            <Card variant="elevated" style={styles.card}>
                {/* Product Image */}
                <View style={styles.imageContainer}>
                    <Image
                        source={{ uri: imageUrl }}
                        style={styles.image}
                        resizeMode="cover"
                    />
                    {hasDiscount && (
                        <View style={styles.discountBadge}>
                            <Text style={styles.discountText}>
                                {Math.round(((product.price - product.special_price!) / product.price) * 100)}% OFF
                            </Text>
                        </View>
                    )}
                    {!product.in_stock && (
                        <View style={styles.outOfStockBadge}>
                            <Text style={styles.outOfStockText}>Out of Stock</Text>
                        </View>
                    )}
                </View>

                {/* Product Info */}
                <View style={styles.info}>
                    <Text style={styles.name} numberOfLines={2}>
                        {product.name}
                    </Text>

                    {/* Rating */}
                    {product.rating && (
                        <View style={styles.ratingContainer}>
                            <Ionicons name="star" size={14} color={theme.colors.warning.main} />
                            <Text style={styles.rating}>{product.rating.toFixed(1)}</Text>
                            {product.reviews_count && (
                                <Text style={styles.reviewCount}>({product.reviews_count})</Text>
                            )}
                        </View>
                    )}

                    {/* Price */}
                    <View style={styles.priceContainer}>
                        {hasDiscount ? (
                            <>
                                <Text style={styles.specialPrice}>
                                    {formatters.formatPrice(product.special_price!)}
                                </Text>
                                <Text style={styles.originalPrice}>
                                    {formatters.formatPrice(product.price)}
                                </Text>
                            </>
                        ) : (
                            <Text style={styles.price}>
                                {formatters.formatPrice(product.price)}
                            </Text>
                        )}
                    </View>
                </View>
            </Card>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        padding: 0,
        overflow: 'hidden',
    },
    imageContainer: {
        width: '100%',
        height: 150,
        position: 'relative',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    discountBadge: {
        position: 'absolute',
        top: theme.spacing.sm,
        right: theme.spacing.sm,
        backgroundColor: theme.colors.error.main,
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: theme.spacing.xs,
        borderRadius: theme.borderRadius.sm,
    },
    discountText: {
        color: theme.colors.white,
        fontSize: theme.typography.fontSize.xs,
        fontWeight: theme.typography.fontWeight.bold,
    },
    outOfStockBadge: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        padding: theme.spacing.xs,
        alignItems: 'center',
    },
    outOfStockText: {
        color: theme.colors.white,
        fontSize: theme.typography.fontSize.xs,
        fontWeight: theme.typography.fontWeight.semiBold,
    },
    info: {
        padding: theme.spacing.md,
    },
    name: {
        fontSize: theme.typography.fontSize.sm,
        fontWeight: theme.typography.fontWeight.medium,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.xs,
        height: 36, // Fixed height for 2 lines
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.spacing.xs,
    },
    rating: {
        fontSize: theme.typography.fontSize.xs,
        color: theme.colors.text.primary,
        marginLeft: theme.spacing.xs,
        fontWeight: theme.typography.fontWeight.medium,
    },
    reviewCount: {
        fontSize: theme.typography.fontSize.xs,
        color: theme.colors.text.secondary,
        marginLeft: theme.spacing.xs,
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    price: {
        fontSize: theme.typography.fontSize.lg,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.primary[500],
    },
    specialPrice: {
        fontSize: theme.typography.fontSize.lg,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.error.main,
        marginRight: theme.spacing.sm,
    },
    originalPrice: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.text.secondary,
        textDecorationLine: 'line-through',
    },
});

export default ProductCard;
