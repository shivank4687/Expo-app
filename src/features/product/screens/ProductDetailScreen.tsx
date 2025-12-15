import React, { useState, useEffect, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { productsApi } from '@/services/api/products.api';
import { Product } from '../types/product.types';
import { ProductGallery } from '../components/ProductGallery';
import { ConfigurableOptions } from '../components/ConfigurableOptions';
import { ProductReviews } from '../components/ProductReviews';
import { MessageSupplierModal } from '../components/MessageSupplierModal';
import { Button } from '@/shared/components/Button';
import { LoadingSpinner } from '@/shared/components/LoadingSpinner';
import { ErrorMessage } from '@/shared/components/ErrorMessage';
import { HTMLContent } from '@/shared/components/HTMLContent';
import { Accordion } from '@/shared/components/Accordion';
import { formatters } from '@/shared/utils/formatters';
import { theme } from '@/theme';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { addToCartThunk } from '@/store/slices/cartSlice';
import { toggleWishlistThunk, fetchWishlistThunk } from '@/store/slices/wishlistSlice';
import { useToast } from '@/shared/components/Toast';

export const ProductDetailScreen: React.FC = () => {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const { showToast } = useToast();
    const { id } = useLocalSearchParams<{ id: string }>();

    const [product, setProduct] = useState<Product | null>(null);
    const [configurableConfig, setConfigurableConfig] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [quantity, setQuantity] = useState(1);
    const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);
    const [selectedVariantPrice, setSelectedVariantPrice] = useState<number | null>(null);
    const [selectedVariantRegularPrice, setSelectedVariantRegularPrice] = useState<number | null>(null);
    const [variantImages, setVariantImages] = useState<any[] | null>(null);
    const [isAddingToCart, setIsAddingToCart] = useState(false);
    const [isTogglingWishlist, setIsTogglingWishlist] = useState(false);
    const [isMessageModalVisible, setIsMessageModalVisible] = useState(false);

    const { isAuthenticated } = useAppSelector((state) => state.auth);
    const { items: wishlistItems } = useAppSelector((state) => state.wishlist);

    // Check if product is in wishlist
    const isInWishlist = useMemo(() => {
        if (!product) return false;
        return wishlistItems.some((item) => item.product.id === product.id);
    }, [wishlistItems, product]);

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

            // If configurable product, fetch configuration data
            if (data.type === 'configurable') {
                try {
                    const config = await productsApi.getConfigurableConfig(Number(id));
                    console.log('📦 Configurable Config:', config);
                    setConfigurableConfig(config);
                } catch (configError) {
                    console.warn('Failed to load configurable config:', configError);
                    // Continue without config - will use fallback display
                }
            }
        } catch (err: any) {
            setError(err.message || 'Failed to load product');
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggleWishlist = async () => {
        if (!product) return;

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

    const handleAddToCart = async () => {
        if (!product) return;

        // Validation for configurable products
        if (product.type === 'configurable' && !selectedVariantId) {
            showToast({
                message: 'Please select product options',
                type: 'warning',
            });
            return;
        }

        setIsAddingToCart(true);

        try {
            const cartData: any = {
                product_id: product.id,
                quantity: quantity,
                product: product,
            };

            // Add selected variant for configurable products
            if (product.type === 'configurable' && selectedVariantId) {
                cartData.selected_configurable_option = selectedVariantId;
            }

            await dispatch(addToCartThunk(cartData)).unwrap();

            showToast({
                message: `${product.name} added to cart!`,
                type: 'success'
            });
        } catch (error: any) {
            showToast({
                message: error || 'Failed to add to cart',
                type: 'error'
            });
        } finally {
            setIsAddingToCart(false);
        }
    };

    const handleQuantityChange = (delta: number) => {
        const newQuantity = quantity + delta;
        if (newQuantity >= 1 && newQuantity <= 99) {
            setQuantity(newQuantity);
        }
    };

    if (isLoading) {
        return <LoadingSpinner />;
    }

    if (error || !product) {
        return (
            <>
                <Stack.Screen options={{ title: 'Product Details' }} />
                <ErrorMessage message={error || 'Product not found'} onRetry={loadProduct} />
            </>
        );
    }

    // Use variant price if selected, otherwise use product price
    const displayPrice = selectedVariantPrice ?? product.price;
    const displayRegularPrice = selectedVariantRegularPrice ?? product.regular_price;
    const hasDiscount = product.on_sale || (displayRegularPrice && displayRegularPrice > displayPrice);

    console.log('💵 Display price:', displayPrice, 'selectedVariantPrice:', selectedVariantPrice, 'product.price:', product.price);

    const showQuantityBox = product.type !== 'grouped' && product.type !== 'bundle';
    const canAddToCart = product.is_saleable !== false && product.in_stock;

    // Get price label based on product type and selection
    let priceLabel = '';
    if (product.type === 'configurable' && !selectedVariantId) {
        priceLabel = 'As low as';
    } else if (product.type === 'grouped') {
        priceLabel = 'Starting at';
    }

    // Use variant images if available, otherwise use product images
    const displayImages = variantImages && variantImages.length > 0 ? variantImages : product.images;

    console.log('🖼️ Display images count:', displayImages?.length, 'variantImages:', variantImages?.length, 'product.images:', product.images?.length);

    return (
        <View style={styles.container}>
            <Stack.Screen
                options={{
                    title: product.name,
                    headerBackTitle: 'Back',
                }}
            />

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Image Gallery */}
                <ProductGallery
                    images={displayImages}
                    isOnSale={!!(product.on_sale || hasDiscount)}
                    isNew={!!(product.is_new || product.new === true || product.new === 1)}
                    inStock={product.in_stock}
                />

                {/* Product Info */}
                <View style={styles.content}>
                    {/* Header with Name and Wishlist */}
                    <View style={styles.header}>
                        <View style={styles.titleContainer}>
                            <Text style={styles.name}>{product.name}</Text>
                        </View>

                        {/* Wishlist Button */}
                        <TouchableOpacity
                            style={styles.wishlistButton}
                            onPress={handleToggleWishlist}
                            disabled={isTogglingWishlist}
                        >
                            {isTogglingWishlist ? (
                                <ActivityIndicator size="small" color={theme.colors.error.main} />
                            ) : (
                                <Ionicons
                                    name={isInWishlist ? 'heart' : 'heart-outline'}
                                    size={28}
                                    color={isInWishlist ? theme.colors.error.main : theme.colors.text.secondary}
                                />
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* Rating */}
                    {product.rating && product.rating > 0 ? (
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
                    ) : null}

                    {/* Price */}
                    <View style={styles.priceSection}>
                        <View style={styles.priceLeftContainer}>
                            {priceLabel ? (
                                <Text style={styles.priceLabel}>{priceLabel}</Text>
                            ) : null}

                            <View style={styles.priceContainer}>
                                {hasDiscount ? (
                                    <>
                                        <Text style={styles.specialPrice}>
                                            {formatters.formatPrice(displayPrice)}
                                        </Text>
                                        <Text style={styles.originalPrice}>
                                            {formatters.formatPrice(displayRegularPrice!)}
                                        </Text>
                                        <View style={styles.discountBadge}>
                                            <Text style={styles.discountText}>
                                                {Math.round(((displayRegularPrice! - displayPrice) / displayRegularPrice!) * 100)}% OFF
                                            </Text>
                                        </View>
                                    </>
                                ) : (
                                    <Text style={styles.price}>
                                        {formatters.formatPrice(displayPrice)}
                                    </Text>
                                )}
                            </View>
                        </View>

                        {/* Quantity Selector */}
                        {canAddToCart && showQuantityBox ? (
                            <View style={styles.quantityContainer}>
                                <TouchableOpacity
                                    style={styles.quantityButton}
                                    onPress={() => handleQuantityChange(-1)}
                                    disabled={quantity <= 1}
                                >
                                    <Ionicons name="remove" size={18} color={theme.colors.text.primary} />
                                </TouchableOpacity>
                                <Text style={styles.quantityText}>{quantity}</Text>
                                <TouchableOpacity
                                    style={styles.quantityButton}
                                    onPress={() => handleQuantityChange(1)}
                                    disabled={quantity >= 99}
                                >
                                    <Ionicons name="add" size={18} color={theme.colors.text.primary} />
                                </TouchableOpacity>
                            </View>
                        ) : null}
                    </View>

                    {/* Stock Status */}
                    {/* <View style={styles.stockContainer}>
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
                    </View> */}

                    {/* Short Description */}
                    {product.short_description ? (
                        <View style={styles.shortDescriptionContainer}>
                            <HTMLContent
                                html={product.short_description}
                                baseStyle={styles.htmlContent}
                            />
                        </View>
                    ) : null}

                    {/* Configurable Product Options */}
                    {product.type === 'configurable' && (product.super_attributes || product.variants) ? (
                        <View style={styles.section}>
                            <ConfigurableOptions
                                product={product}
                                configurableConfig={configurableConfig}
                                superAttributes={product.configurable_attributes || product.super_attributes}
                                variants={product.variants}
                                onVariantChange={(variantId, variant) => {
                                    console.log('📍 ProductDetailScreen - Variant changed:', variantId);
                                    setSelectedVariantId(variantId);
                                }}
                                onPriceChange={(price, regularPrice) => {
                                    console.log('📍 ProductDetailScreen - Price changed:', price, regularPrice);
                                    setSelectedVariantPrice(price);
                                    setSelectedVariantRegularPrice(regularPrice ?? null);
                                }}
                                onImagesChange={(images) => {
                                    console.log('📍 ProductDetailScreen - Images changed:', images.length, images[0]);
                                    setVariantImages(images);
                                }}
                            />
                        </View>
                    ) : null}

                    {/* Description Accordion */}
                    {product.description ? (
                        <Accordion
                            title="Description"
                            defaultExpanded={false}
                            style={styles.accordion}
                        >
                            <HTMLContent
                                html={product.description}
                                baseStyle={styles.htmlContent}
                            />
                        </Accordion>
                    ) : null}

                    {/* Sold By Accordion */}
                    {product.supplier ? (
                        <Accordion
                            title="Sold By"
                            defaultExpanded={false}
                            style={styles.accordion}
                        >
                            <View style={styles.supplierContainer}>
                                {/* Supplier Company Name */}
                                {/* <TouchableOpacity 
                                    style={styles.supplierNameContainer}
                                    onPress={() => {
                                        // Navigate to supplier shop page
                                        // router.push(`/supplier/${product.supplier!.url}`);
                                        showToast({ 
                                            message: `Navigate to ${product.supplier!.company_name} shop`, 
                                            type: 'info' 
                                        });
                                    }}
                                > */}
                                <Text style={styles.supplierName}>
                                    {product.supplier.company_name}
                                </Text>
                                {/* <Ionicons 
                                        name="chevron-forward" 
                                        size={20} 
                                        color={theme.colors.text.secondary} 
                                    />
                                </TouchableOpacity> */}

                                {/* Supplier Rating */}
                                {product.supplier.rating && product.supplier.rating > 0 ? (
                                    <View style={styles.supplierRatingContainer}>
                                        <View style={styles.supplierStars}>
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <Ionicons
                                                    key={star}
                                                    name={star <= Math.round(product.supplier!.rating!) ? 'star' : 'star-outline'}
                                                    size={16}
                                                    color={theme.colors.warning.main}
                                                />
                                            ))}
                                        </View>
                                        <Text style={styles.supplierRatingText}>
                                            {product.supplier.rating.toFixed(1)}
                                            {product.supplier.total_reviews
                                                ? ` (${product.supplier.total_reviews} ${product.supplier.total_reviews === 1 ? 'review' : 'reviews'})`
                                                : ''
                                            }
                                        </Text>
                                    </View>
                                ) : null}

                                {/* View Supplier Shop Button */}
                                <TouchableOpacity
                                    style={styles.viewSupplierButton}
                                    onPress={() => {
                                        if (product.supplier?.url) {
                                            router.push(`/supplier/${product.supplier.url}`);
                                        } else {
                                            showToast({
                                                message: 'Supplier shop URL not available',
                                                type: 'warning'
                                            });
                                        }
                                    }}
                                >
                                    <Text style={styles.viewSupplierButtonText}>
                                        View Supplier Shop
                                    </Text>
                                    <Ionicons
                                        name="storefront-outline"
                                        size={18}
                                        color={theme.colors.primary[500]}
                                    />
                                </TouchableOpacity>

                                {/* Message Supplier Button */}
                                <TouchableOpacity
                                    style={styles.messageSupplierButton}
                                    onPress={() => {
                                        if (!isAuthenticated) {
                                            showToast({
                                                message: 'Please login to message supplier',
                                                type: 'warning'
                                            });
                                            return;
                                        }
                                        setIsMessageModalVisible(true);
                                    }}
                                >
                                    <Ionicons
                                        name="chatbubble-outline"
                                        size={18}
                                        color={theme.colors.primary[500]}
                                    />
                                    <Text style={styles.messageSupplierButtonText}>
                                        Message Supplier
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </Accordion>
                    ) : null}

                    {/* Message Supplier Modal */}
                    {product.supplier && (
                        <MessageSupplierModal
                            visible={isMessageModalVisible}
                            supplierId={product.supplier.id}
                            supplierCompanyName={product.supplier.company_name}
                            onClose={() => setIsMessageModalVisible(false)}
                            onSuccess={() => {
                                showToast({
                                    message: 'Message sent successfully!',
                                    type: 'success'
                                });
                            }}
                        />
                    )}

                    {/* Customer Reviews Accordion */}
                    <ProductReviews
                        productId={product.id}
                        averageRating={product.rating || 0}
                        totalReviews={product.reviews_count || 0}
                    />

                    {/* SKU */}
                    {/* <View style={styles.section}>
                        <Text style={styles.label}>
                            SKU: <Text style={styles.value}>{product.sku}</Text>
                        </Text>
                    </View> */}
                </View>
            </ScrollView>

            {/* Bottom Bar */}
            {canAddToCart ? (
                <View style={styles.bottomBar}>
                    {/* Action Buttons Container */}
                    <View style={styles.actionButtonsContainer}>
                        {/* RFQ Button */}
                        {/* RFQ Button */}
                        {product?.supplier?.id && (
                            isAuthenticated ? (
                                <TouchableOpacity
                                    style={styles.rfqButton}
                                    onPress={() => {
                                        router.push(`/rfq/${product.supplier!.id}`);
                                    }}
                                >
                                    <Ionicons name="document-text-outline" size={18} color={theme.colors.primary[500]} />
                                    <Text style={styles.rfqButtonText}>
                                        Request for Quote
                                    </Text>
                                </TouchableOpacity>
                            ) : (
                                <TouchableOpacity
                                    style={styles.rfqButton}
                                    onPress={() => {
                                        router.push('/login');
                                    }}
                                >
                                    <Ionicons name="log-in-outline" size={18} color={theme.colors.primary[500]} />
                                    <Text style={styles.rfqButtonText}>
                                        Login for RFQ
                                    </Text>
                                </TouchableOpacity>
                            )
                        )}

                        {/* Add to Cart Button */}
                        <Button
                            title={isAddingToCart ? 'Adding...' : 'Add to Cart'}
                            onPress={handleAddToCart}
                            style={[
                                styles.addToCartButton,
                                (product?.supplier?.id && isAuthenticated) ? styles.addToCartButtonWithRFQ : undefined
                            ]}
                            disabled={isAddingToCart}
                        />
                    </View>
                </View>
            ) : null}
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
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: theme.spacing.md,
    },
    titleContainer: {
        flex: 1,
        marginRight: theme.spacing.md,
    },
    name: {
        fontSize: theme.typography.fontSize['2xl'],
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.text.primary,
    },
    wishlistButton: {
        width: 46,
        height: 46,
        borderRadius: 23,
        backgroundColor: theme.colors.white,
        borderWidth: 1,
        borderColor: theme.colors.border.main,
        justifyContent: 'center',
        alignItems: 'center',
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
    priceSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: theme.spacing.md,
    },
    priceLeftContainer: {
        flex: 1,
    },
    priceLabel: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.text.secondary,
        marginBottom: 4,
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
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
        backgroundColor: theme.colors.error.light || '#FEE2E2',
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
    shortDescriptionContainer: {
        marginBottom: theme.spacing.lg,
    },
    htmlContent: {
        marginBottom: theme.spacing.sm,
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
    accordion: {
        marginBottom: theme.spacing.lg,
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
        gap: theme.spacing.md,
    },
    quantityContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.colors.border.main,
        borderRadius: theme.borderRadius.md,
        marginLeft: theme.spacing.md,
        alignSelf: 'flex-start',
    },
    quantityButton: {
        padding: theme.spacing.xs,
    },
    quantityText: {
        fontSize: theme.typography.fontSize.base,
        fontWeight: theme.typography.fontWeight.semiBold,
        color: theme.colors.text.primary,
        paddingHorizontal: theme.spacing.sm,
        minWidth: 35,
        textAlign: 'center',
    },
    actionButtonsContainer: {
        flex: 1,
        flexDirection: 'row',
        gap: theme.spacing.md,
    },
    rfqButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.md,
        backgroundColor: theme.colors.white,
        borderRadius: theme.borderRadius.md,
        borderWidth: 1,
        borderColor: theme.colors.primary[500],
        gap: theme.spacing.xs,
        flexShrink: 1,
    },
    rfqButtonText: {
        fontSize: theme.typography.fontSize.sm,
        fontWeight: theme.typography.fontWeight.semiBold,
        color: theme.colors.primary[500],
    },
    addToCartButton: {
        flex: 1,
    },
    addToCartButtonWithRFQ: {
        flex: 1,
    },
    supplierContainer: {
        paddingVertical: theme.spacing.xs,
    },
    supplierNameContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
    },
    supplierName: {
        fontSize: theme.typography.fontSize.lg,
        fontWeight: theme.typography.fontWeight.semiBold,
        color: theme.colors.text.primary,
        flex: 1,
    },
    supplierRatingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.spacing.md,
    },
    supplierStars: {
        flexDirection: 'row',
        marginRight: theme.spacing.sm,
    },
    supplierRatingText: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.text.secondary,
    },
    viewSupplierButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.lg,
        backgroundColor: theme.colors.primary[50] || theme.colors.primary[100] || '#E0E7FF',
        borderRadius: theme.borderRadius.md,
        marginTop: theme.spacing.sm,
        gap: theme.spacing.sm,
    },
    viewSupplierButtonText: {
        fontSize: theme.typography.fontSize.base,
        fontWeight: theme.typography.fontWeight.semiBold,
        color: theme.colors.primary[500],
    },
    messageSupplierButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.lg,
        backgroundColor: theme.colors.white,
        borderRadius: theme.borderRadius.md,
        marginTop: theme.spacing.sm,
        borderWidth: 1,
        borderColor: theme.colors.primary[500],
        gap: theme.spacing.sm,
    },
    messageSupplierButtonText: {
        fontSize: theme.typography.fontSize.base,
        fontWeight: theme.typography.fontWeight.semiBold,
        color: theme.colors.primary[500],
    },
});

export default ProductDetailScreen;
