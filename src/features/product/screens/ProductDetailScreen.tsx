import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Image,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { productsApi } from '@/services/api/products.api';
import { Product } from '../types/product.types';
import { ProductGallery } from '../components/ProductGallery';
import { Button } from '@/shared/components/Button';
import { LoadingSpinner } from '@/shared/components/LoadingSpinner';
import { ErrorMessage } from '@/shared/components/ErrorMessage';
import { formatters } from '@/shared/utils/formatters';
import { theme } from '@/theme';

export const ProductDetailScreen: React.FC = () => {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();

    const [product, setProduct] = useState<Product | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [quantity, setQuantity] = useState(1);

    useEffect(() => {
        if (id) {
            loadProduct();
        }
    }, [id]);

    const loadProduct = async () => {
        try {
            setError(null);
            const data = await productsApi.getProductById(Number(id));
            setProduct(data);
        } catch (err: any) {
            setError(err.message || 'Failed to load product');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddToCart = () => {
        if (!product) return;

        // TODO: Implement add to cart functionality
        Alert.alert(
            'Added to Cart',
            `${product.name} (${quantity}) has been added to your cart.`
        );
    };

    const handleQuantityChange = (delta: number) => {
        const newQuantity = quantity + delta;
        if (newQuantity >= 1 && newQuantity <= (product?.quantity || 99)) {
            setQuantity(newQuantity);
        }
    };

    if (isLoading) {
        return <LoadingSpinner />;
    }

    if (error || !product) {
        return <ErrorMessage message={error || 'Product not found'} onRetry={loadProduct} />;
    }

    const hasDiscount = product.special_price && product.special_price < product.price;

    return (
        <View style={styles.container}>
            <ScrollView>
                {/* Image Gallery */}
                <ProductGallery images={product.images} />

                {/* Product Info */}
                <View style={styles.content}>
                    <Text style={styles.name}>{product.name}</Text>

                    {/* Rating */}
                    {product.rating && (
                        <View style={styles.ratingContainer}>
                            <View style={styles.stars}>
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <Ionicons
                                        key={star}
                                        name={star <= Math.round(product.rating!) ? 'star' : 'star-outline'}
                                        size={18}
                                        color={theme.colors.warning.main}
                                    />
                                ))}
                            </View>
                            <Text style={styles.ratingText}>
                                {product.rating.toFixed(1)} ({product.reviews_count || 0} reviews)
                            </Text>
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
                                <View style={styles.discountBadge}>
                                    <Text style={styles.discountText}>
                                        {Math.round(((product.price - product.special_price!) / product.price) * 100)}% OFF
                                    </Text>
                                </View>
                            </>
                        ) : (
                            <Text style={styles.price}>
                                {formatters.formatPrice(product.price)}
                            </Text>
                        )}
                    </View>

                    {/* Stock Status */}
                    <View style={styles.stockContainer}>
                        <Ionicons
                            name={product.in_stock ? 'checkmark-circle' : 'close-circle'}
                            size={20}
                            color={product.in_stock ? theme.colors.success.main : theme.colors.error.main}
                        />
                        <Text
                            style={[
                                styles.stockText,
                                { color: product.in_stock ? theme.colors.success.main : theme.colors.error.main },
                            ]}
                        >
                            {product.in_stock ? 'In Stock' : 'Out of Stock'}
                        </Text>
                    </View>

                    {/* Description */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Description</Text>
                        <Text style={styles.description}>
                            {product.description || product.short_description || 'No description available.'}
                        </Text>
                    </View>

                    {/* SKU */}
                    <View style={styles.section}>
                        <Text style={styles.label}>SKU: <Text style={styles.value}>{product.sku}</Text></Text>
                    </View>
                </View>
            </ScrollView>

            {/* Bottom Bar */}
            {product.in_stock && (
                <View style={styles.bottomBar}>
                    {/* Quantity Selector */}
                    <View style={styles.quantityContainer}>
                        <TouchableOpacity
                            style={styles.quantityButton}
                            onPress={() => handleQuantityChange(-1)}
                            disabled={quantity <= 1}
                        >
                            <Ionicons name="remove" size={20} color={theme.colors.text.primary} />
                        </TouchableOpacity>
                        <Text style={styles.quantityText}>{quantity}</Text>
                        <TouchableOpacity
                            style={styles.quantityButton}
                            onPress={() => handleQuantityChange(1)}
                            disabled={quantity >= (product.quantity || 99)}
                        >
                            <Ionicons name="add" size={20} color={theme.colors.text.primary} />
                        </TouchableOpacity>
                    </View>

                    {/* Add to Cart Button */}
                    <Button
                        title="Add to Cart"
                        onPress={handleAddToCart}
                        style={styles.addToCartButton}
                    />
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background.default,
    },
    content: {
        padding: theme.spacing.lg,
    },
    name: {
        fontSize: theme.typography.fontSize['2xl'],
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.md,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.spacing.md,
    },
    stars: {
        flexDirection: 'row',
        marginRight: theme.spacing.sm,
    },
    ratingText: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.text.secondary,
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.spacing.md,
    },
    price: {
        fontSize: theme.typography.fontSize['3xl'],
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.primary[500],
    },
    specialPrice: {
        fontSize: theme.typography.fontSize['3xl'],
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.error.main,
        marginRight: theme.spacing.md,
    },
    originalPrice: {
        fontSize: theme.typography.fontSize.lg,
        color: theme.colors.text.secondary,
        textDecorationLine: 'line-through',
        marginRight: theme.spacing.md,
    },
    discountBadge: {
        backgroundColor: theme.colors.error.light,
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: theme.spacing.xs,
        borderRadius: theme.borderRadius.sm,
    },
    discountText: {
        color: theme.colors.error.dark,
        fontSize: theme.typography.fontSize.xs,
        fontWeight: theme.typography.fontWeight.bold,
    },
    stockContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.spacing.lg,
    },
    stockText: {
        fontSize: theme.typography.fontSize.base,
        fontWeight: theme.typography.fontWeight.medium,
        marginLeft: theme.spacing.sm,
    },
    section: {
        marginBottom: theme.spacing.lg,
    },
    sectionTitle: {
        fontSize: theme.typography.fontSize.lg,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.sm,
    },
    description: {
        fontSize: theme.typography.fontSize.base,
        color: theme.colors.text.secondary,
        lineHeight: theme.typography.lineHeight.relaxed * theme.typography.fontSize.base,
    },
    label: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.text.secondary,
        fontWeight: theme.typography.fontWeight.medium,
    },
    value: {
        color: theme.colors.text.primary,
        fontWeight: theme.typography.fontWeight.regular,
    },
    bottomBar: {
        flexDirection: 'row',
        padding: theme.spacing.lg,
        backgroundColor: theme.colors.white,
        ...theme.shadows.lg,
        alignItems: 'center',
    },
    quantityContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: theme.spacing.md,
        borderWidth: 1,
        borderColor: theme.colors.border.main,
        borderRadius: theme.borderRadius.md,
    },
    quantityButton: {
        padding: theme.spacing.sm,
    },
    quantityText: {
        fontSize: theme.typography.fontSize.lg,
        fontWeight: theme.typography.fontWeight.semiBold,
        color: theme.colors.text.primary,
        paddingHorizontal: theme.spacing.md,
        minWidth: 40,
        textAlign: 'center',
    },
    addToCartButton: {
        flex: 1,
    },
});

export default ProductDetailScreen;
