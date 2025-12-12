import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Product } from '@/features/product/types/product.types';
import { Card } from '@/shared/components/Card';
import { formatters } from '@/shared/utils/formatters';
import { theme } from '@/theme';
import { ProductImage } from '@/shared/components/LazyImage';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { addToCartThunk } from '@/store/slices/cartSlice';
import { toggleWishlistThunk, fetchWishlistThunk } from '@/store/slices/wishlistSlice';
import { useToast } from '@/shared/components/Toast';
import { useRouter } from 'expo-router';

interface ProductCardProps {
    product: Product;
    onPress: () => void;
}

const RATING_ICON_SIZE = 14;

/**
 * ProductCard Component
 * Displays product information with image, name, price, and ratings
 * Shows placeholder icon if image fails to load
 */
export const ProductCard: React.FC<ProductCardProps> = ({ product, onPress }) => {
    const dispatch = useAppDispatch();
    const router = useRouter();
    const { showToast } = useToast();
    const { isAddingToCart, lastAddedProductId } = useAppSelector((state) => state.cart);
    const { items: wishlistItems } = useAppSelector((state) => state.wishlist);
    const { isAuthenticated } = useAppSelector((state) => state.auth);
    const [isTogglingWishlist, setIsTogglingWishlist] = useState(false);
    
    const isAddingThisProduct = isAddingToCart && lastAddedProductId === product.id;
    
    // Check if product is in wishlist
    const isInWishlist = useMemo(() => {
        return wishlistItems.some((item) => item.product.id === product.id);
    }, [wishlistItems, product.id]);

    const productData = useMemo(() => {
        const rawImageUrl = product.thumbnail || (product.images && product.images[0]?.url);
        
        // Check if product has discount based on API fields
        // When on sale, API returns: price=special_price, regular_price=original
        const hasDiscount = product.on_sale || (product.regular_price && product.regular_price > product.price);
        
        // Check if product is on sale
        const isOnSale = product.on_sale || hasDiscount;
        
        // Check if product is new (using either 'new' or 'is_new' field)
        const isNew = product.is_new || (product.new === true || product.new === 1);

        // Calculate discount percentage
        const originalPrice = product.regular_price || product.price;
        const currentPrice = hasDiscount ? product.price : product.price;
        const discountPercent = hasDiscount && originalPrice > currentPrice
            ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
            : 0;

        // Get price label based on product type (matching web application)
        let priceLabel = '';
        if (product.type === 'configurable') {
            priceLabel = 'As low as';
        } else if (product.type === 'grouped') {
            priceLabel = 'Starting at';
        }
        // bundle, simple, and other types don't show a label

        return {
            imageUrl: rawImageUrl,
            hasDiscount,
            isOnSale,
            isNew,
            name: product.name || 'Product',
            rating: product.rating || 0,
            reviewCount: product.reviews_count || 0,
            discountPercent,
            currentPrice,
            originalPrice,
            priceLabel,
        };
    }, [product]);

    const handleAddToCart = async (e: any) => {
        e.stopPropagation();
        
        if (!product.in_stock) {
            showToast({ message: 'Product is out of stock', type: 'error' });
            return;
        }

        // Check if product is configurable - requires option selection
        if (product.type === 'configurable') {
            showToast({ 
                message: 'Please select product options', 
                type: 'warning' 
            });
            // Redirect to product detail page to select options
            setTimeout(() => {
                router.push(`/product/${product.id}` as any);
            }, 500);
            return;
        }

        try {
            await dispatch(addToCartThunk({
                product_id: product.id,
                quantity: 1,
                product: product, // Pass product data for guest cart
            })).unwrap();
            
            showToast({ message: `${product.name} added to cart!`, type: 'success' });
        } catch (error: any) {
            showToast({ message: error || 'Failed to add to cart', type: 'error' });
        }
    };

    const handleToggleWishlist = async (e: any) => {
        e.stopPropagation();
        
        // Check if user is authenticated
        if (!isAuthenticated) {
            showToast({ 
                message: 'Please login first to add items to wishlist', 
                type: 'warning' 
            });
            return;
        }

        setIsTogglingWishlist(true);
        
        try {
            await dispatch(toggleWishlistThunk(product.id)).unwrap();
            
            // Fetch updated wishlist
            await dispatch(fetchWishlistThunk()).unwrap();
            
            const message = isInWishlist 
                ? `${product.name} removed from wishlist`
                : `${product.name} added to wishlist!`;
            
            showToast({ message, type: 'success' });
        } catch (error: any) {
            showToast({ 
                message: error || 'Failed to update wishlist', 
                type: 'error' 
            });
        } finally {
            setIsTogglingWishlist(false);
        }
    };

    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
            <Card variant="elevated" style={styles.card}>
                {/* Product Image */}
                <View style={styles.imageContainer}>
                    <ProductImage
                        imageUrl={productData.imageUrl}
                        style={styles.image}
                        recyclingKey={product.id?.toString()}
                        priority="low"
                    />
                    
                    {/* Wishlist Heart Icon */}
                    <TouchableOpacity 
                        style={styles.wishlistButton}
                        onPress={handleToggleWishlist}
                        disabled={isTogglingWishlist}
                        activeOpacity={0.7}
                    >
                        {isTogglingWishlist ? (
                            <ActivityIndicator size="small" color={theme.colors.error.main} />
                        ) : (
                            <Ionicons
                                name={isInWishlist ? 'heart' : 'heart-outline'}
                                size={24}
                                color={isInWishlist ? theme.colors.error.main : '#6B7280'}
                                style={styles.heartIcon}
                            />
                        )}
                    </TouchableOpacity>
                    
                    {/* Sale Badge - Shows when product is on sale */}
                    {productData.isOnSale && product.in_stock ? (
                        <View style={styles.saleBadge}>
                            <Text style={styles.saleText}>SALE</Text>
                        </View>
                    ) : null}
                    
                    {/* New Badge - Shows when product is new and not on sale */}
                    {!productData.isOnSale && productData.isNew && product.in_stock ? (
                        <View style={styles.newBadge}>
                            <Text style={styles.newText}>NEW</Text>
                        </View>
                    ) : null}
                    
                    {/* Out of Stock Badge */}
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

                    <View style={styles.priceWrapper}>
                        {/* Price Label for Configurable/Grouped Products */}
                        {/* Always reserve space for price label to maintain consistent card height */}
                        <View style={styles.priceLabelContainer}>
                            {productData.priceLabel ? (
                                <Text style={styles.priceLabel}>
                                    {productData.priceLabel}
                                </Text>
                            ) : null}
                        </View>
                        
                        <View style={styles.priceContainer}>
                            {productData.hasDiscount ? (
                                <>
                                    <Text style={styles.specialPrice}>
                                        {formatters.formatPrice(productData.currentPrice)}
                                    </Text>
                                    <Text style={styles.originalPrice}>
                                        {formatters.formatPrice(productData.originalPrice)}
                                    </Text>
                                </>
                            ) : (
                                <Text style={styles.price}>
                                    {formatters.formatPrice(product.price)}
                                </Text>
                            )}
                        </View>
                    </View>
                </View>

                {/* Add to Cart Button */}
                <TouchableOpacity
                    style={[
                        styles.addToCartButton,
                        !product.in_stock && styles.addToCartButtonDisabled
                    ]}
                    onPress={handleAddToCart}
                    disabled={!product.in_stock || isAddingThisProduct}
                    activeOpacity={0.7}
                >
                    {isAddingThisProduct ? (
                        <ActivityIndicator size="small" color={theme.colors.white} />
                    ) : (
                        <>
                            <Ionicons 
                                name="cart-outline" 
                                size={18} 
                                color={theme.colors.white} 
                            />
                            <Text style={styles.addToCartText}>
                                {product.in_stock ? 'Add to Cart' : 'Out of Stock'}
                            </Text>
                        </>
                    )}
                </TouchableOpacity>
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
    wishlistButton: {
        position: 'absolute',
        top: theme.spacing.sm,
        right: theme.spacing.sm,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    heartIcon: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.3,
        shadowRadius: 2,
        elevation: 3,
    },
    saleBadge: {
        position: 'absolute',
        top: theme.spacing.sm,
        left: theme.spacing.sm,
        backgroundColor: '#DC2626', // Red color matching web app (bg-red-600)
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.xs,
        borderRadius: 22, // Rounded pill shape (rounded-[44px])
    },
    saleText: {
        color: theme.colors.white,
        fontSize: theme.typography.fontSize.xs,
        fontWeight: theme.typography.fontWeight.semiBold,
        textTransform: 'uppercase',
    },
    newBadge: {
        position: 'absolute',
        top: theme.spacing.sm,
        left: theme.spacing.sm,
        backgroundColor: '#1E3A8A', // Navy blue matching web app (bg-navyBlue)
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.xs,
        borderRadius: 22, // Rounded pill shape (rounded-[44px])
    },
    newText: {
        color: theme.colors.white,
        fontSize: theme.typography.fontSize.xs,
        fontWeight: theme.typography.fontWeight.semiBold,
        textTransform: 'uppercase',
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
    priceWrapper: {
        gap: 2,
        minHeight: 40, // Fixed minimum height to ensure consistent card heights
    },
    priceLabelContainer: {
        height: 16, // Fixed height for price label area to maintain consistent card heights
        justifyContent: 'flex-start',
    },
    priceLabel: {
        fontSize: theme.typography.fontSize.xs,
        color: theme.colors.text.secondary,
        lineHeight: 16,
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
        color: '#9CA3AF', // Gray-400 color matching web app (text-zinc-500)
        textDecorationLine: 'line-through',
        textDecorationColor: '#9CA3AF',
        fontWeight: theme.typography.fontWeight.medium,
    },
    addToCartButton: {
        backgroundColor: theme.colors.primary[500],
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: theme.spacing.sm,
        paddingHorizontal: theme.spacing.md,
        gap: theme.spacing.xs,
        borderBottomLeftRadius: theme.borderRadius.md,
        borderBottomRightRadius: theme.borderRadius.md,
    },
    addToCartButtonDisabled: {
        backgroundColor: theme.colors.gray[400],
    },
    addToCartText: {
        color: theme.colors.white,
        fontSize: theme.typography.fontSize.sm,
        fontWeight: theme.typography.fontWeight.semiBold,
    },
});

export default ProductCard;
