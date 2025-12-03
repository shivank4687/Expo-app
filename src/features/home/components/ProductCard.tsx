import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Product } from '@/features/product/types/product.types';
import { Card } from '@/shared/components/Card';
import { formatters } from '@/shared/utils/formatters';
import { theme } from '@/theme';
import { getAbsoluteImageUrl } from '@/shared/utils/imageUtils';

interface ProductCardProps {
    product: Product;
    onPress: () => void;
}

const PLACEHOLDER_ICON_SIZE = 48;
const RATING_ICON_SIZE = 14;

/**
 * ProductCard Component
 * Displays product information with image, name, price, and ratings
 * Shows placeholder icon if image fails to load
 */
export const ProductCard: React.FC<ProductCardProps> = ({ product, onPress }) => {
    const [imageError, setImageError] = useState(false);
    
    const productData = useMemo(() => {
        const rawImageUrl = product.thumbnail || (product.images && product.images[0]?.url);
        const imageUrl = getAbsoluteImageUrl(rawImageUrl);
        const hasValidImage = 
            imageUrl && 
            typeof imageUrl === 'string' && 
            imageUrl.trim().length > 0 &&
            !imageError;

        return {
            imageUrl,
            hasValidImage,
            hasDiscount: product.special_price && product.special_price < product.price,
            name: product.name || 'Product',
            rating: product.rating || 0,
            reviewCount: product.reviews_count || 0,
            discountPercent: product.special_price && product.price
                ? Math.round(((product.price - product.special_price) / product.price) * 100)
                : 0,
        };
    }, [product, imageError]);

    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
            <Card variant="elevated" style={styles.card}>
                {/* Product Image */}
                <View style={styles.imageContainer}>
                    {productData.hasValidImage ? (
                        <Image
                            source={{ uri: productData.imageUrl }}
                            style={styles.image}
                            resizeMode="cover"
                            onError={() => setImageError(true)}
                        />
                    ) : (
                        <View style={styles.imagePlaceholder}>
                            <Ionicons 
                                name="image-outline" 
                                size={PLACEHOLDER_ICON_SIZE} 
                                color={theme.colors.gray[400]} 
                            />
                        </View>
                    )}
                    {productData.hasDiscount ? (
                        <View style={styles.discountBadge}>
                            <Text style={styles.discountText}>
                                {productData.discountPercent}% OFF
                            </Text>
                        </View>
                    ) : null}
                    
                    {!product.in_stock ? (
                        <View style={styles.outOfStockBadge}>
                            <Text style={styles.outOfStockText}>Out of Stock</Text>
                        </View>
                    ) : null}
                </View>

                {/* Product Info */}
                <View style={styles.info}>
                    <Text style={styles.name} numberOfLines={2}>
                        {productData.name}
                    </Text>

                    {productData.rating > 0 ? (
                        <View style={styles.ratingContainer}>
                            <Ionicons 
                                name="star" 
                                size={RATING_ICON_SIZE} 
                                color={theme.colors.warning.main} 
                            />
                            <Text style={styles.rating}>
                                {productData.rating.toFixed(1)}
                            </Text>
                            {productData.reviewCount > 0 ? (
                                <Text style={styles.reviewCount}>
                                    ({productData.reviewCount})
                                </Text>
                            ) : null}
                        </View>
                    ) : null}

                    <View style={styles.priceContainer}>
                        {productData.hasDiscount ? (
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
        backgroundColor: '#F3F4F6',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    imagePlaceholder: {
        width: '100%',
        height: '100%',
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
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
