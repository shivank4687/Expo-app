import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, TextInput } from 'react-native';
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
import { useTranslation } from 'react-i18next';
import { useProductVariants } from '@/features/product/hooks/useProductVariants';
import { CardVariantSelector } from '@/features/product/components/CardVariantSelector';

interface ProductCardProps {
    product: Product;
    onPress: () => void;
    cardVariant?: 'elevated' | 'outlined' | 'flat';
}

const RATING_ICON_SIZE = 14;

/**
 * ProductCard Component
 * Displays product information with image, name, price, and ratings.
 * For configurable products: shows an inline variant selector that lets the
 * user pick options, see the updated image/price, and add to cart — all
 * without navigating to the ProductDetailScreen.
 */
export const ProductCard: React.FC<ProductCardProps> = ({ product, onPress, cardVariant = 'elevated' }) => {
    const dispatch = useAppDispatch();
    const router = useRouter();
    const { showToast } = useToast();
    const { t } = useTranslation();
    const { isAddingToCart, lastAddedProductId } = useAppSelector((state) => state.cart);
    const { items: wishlistItems } = useAppSelector((state) => state.wishlist);
    const { isAuthenticated } = useAppSelector((state) => state.auth);
    const { selectedCurrency } = useAppSelector((state) => state.core);

    const [isTogglingWishlist, setIsTogglingWishlist] = useState(false);
    const [quantity, setQuantity] = useState('1');
    const [isSelectorOpen, setIsSelectorOpen] = useState(false);

    const currencySymbol = selectedCurrency?.symbol || selectedCurrency?.code || '$';
    const isConfigurable = product.type === 'configurable';
    const isAddingThisProduct = isAddingToCart && lastAddedProductId === product.id;

    // ─── Variant hook (only meaningful for configurable products) ────────────
    const variantState = useProductVariants(product.id, product.variants);
    const {
        selectedVariantId,
        displayPrice: variantPrice,
        displayRegularPrice: variantRegularPrice,
        displayImageUrl: variantImageUrl,
        isFullySelected,
        fetchConfig,
    } = variantState;

    // ─── Wishlist ────────────────────────────────────────────────────────────
    const isInWishlist = useMemo(() => {
        return wishlistItems.some((item) => item.product.id === product.id);
    }, [wishlistItems, product.id]);

    // ─── Derived display values ───────────────────────────────────────────────
    const productData = useMemo(() => {
        // When a variant is selected use its image, otherwise use the product thumbnail
        const rawImageUrl =
            (isConfigurable && isFullySelected && variantImageUrl)
                ? variantImageUrl
                : product.thumbnail || (product.images && product.images[0]?.url);

        const hasDiscount =
            product.on_sale || (product.regular_price && product.regular_price > product.price);

        const isOnSale = product.on_sale || hasDiscount;
        const isNew = product.is_new || (product.new === true || product.new === 1);

        // Effective price: use variant price once selected, else product base price
        const effectivePrice =
            isConfigurable && isFullySelected && variantPrice !== null
                ? variantPrice
                : product.price;

        const effectiveRegularPrice =
            isConfigurable && isFullySelected && variantRegularPrice !== null
                ? variantRegularPrice
                : product.regular_price || product.price;

        const effectiveHasDiscount =
            isConfigurable && isFullySelected
                ? variantRegularPrice !== null && variantRegularPrice > (variantPrice ?? 0)
                : hasDiscount;

        const discountPercent =
            effectiveHasDiscount && effectiveRegularPrice > effectivePrice
                ? Math.round(((effectiveRegularPrice - effectivePrice) / effectiveRegularPrice) * 100)
                : 0;

        return {
            imageUrl: rawImageUrl,
            hasDiscount: effectiveHasDiscount,
            isOnSale,
            isNew,
            name: product.name || 'Product',
            rating: Number(product.rating) || 0,
            reviewCount: Number(product.reviews_count) || 0,
            discountPercent,
            currentPrice: effectivePrice,
            originalPrice: effectiveRegularPrice,
        };
    }, [
        product,
        isConfigurable,
        isFullySelected,
        variantPrice,
        variantRegularPrice,
        variantImageUrl,
    ]);

    // ─── Price label ─────────────────────────────────────────────────────────
    // Only show "as low as" when no variant is selected yet.
    // Once a variant is chosen it becomes a real price — no label needed.
    const priceLabel = useMemo(() => {
        if (isConfigurable && !isFullySelected) {
            return t('product.asLowAs');
        }
        if (product.type === 'grouped') {
            return t('product.startingAt');
        }
        return '';
    }, [isConfigurable, isFullySelected, product.type, t]);

    // ─── Toggle selector ─────────────────────────────────────────────────────
    const handleToggleSelector = (e: any) => {
        e.stopPropagation();
        const nextOpen = !isSelectorOpen;
        setIsSelectorOpen(nextOpen);
        if (nextOpen) {
            // Lazy-load config on first open
            fetchConfig();
        }
    };

    // ─── Add to cart ─────────────────────────────────────────────────────────
    const handleAddToCart = async (e: any) => {
        e.stopPropagation();

        if (!product.in_stock) {
            showToast({ message: t('product.productOutOfStock'), type: 'error' });
            return;
        }

        if (isConfigurable && !isFullySelected) {
            // If selector is closed, open it; if already open, prompt user
            if (!isSelectorOpen) {
                setIsSelectorOpen(true);
                fetchConfig();
            } else {
                showToast({ message: t('product.selectProductOptions'), type: 'warning' });
            }
            return;
        }

        try {
            const qty = parseInt(quantity);
            if (!qty || qty <= 0) {
                showToast({ message: t('product.invalidQuantity'), type: 'error' });
                return;
            }

            const cartData: any = {
                product_id: product.id,
                quantity: qty,
            };

            if (isConfigurable && selectedVariantId) {
                cartData.selected_configurable_option = selectedVariantId;
            }

            await dispatch(addToCartThunk(cartData)).unwrap();
            showToast({ message: t('product.addedToCart', { name: product.name }), type: 'success' });

            // Close selector and reset variant selections after successful add
            // so the card returns to "Select Options" state
            if (isConfigurable) {
                setIsSelectorOpen(false);
                variantState.reset();
            }
        } catch (error: any) {
            showToast({ message: error || t('product.failedToAddToCart'), type: 'error' });
        }
    };

    // ─── Wishlist ────────────────────────────────────────────────────────────
    const handleToggleWishlist = async (e: any) => {
        e.stopPropagation();

        if (!isAuthenticated) {
            showToast({ message: t('product.loginToAddWishlist'), type: 'warning' });
            return;
        }

        setIsTogglingWishlist(true);
        try {
            await dispatch(toggleWishlistThunk(product.id)).unwrap();
            await dispatch(fetchWishlistThunk()).unwrap();
        } catch (error: any) {
            showToast({ message: error || t('product.failedToUpdateWishlist'), type: 'error' });
        } finally {
            setIsTogglingWishlist(false);
        }
    };

    // ─── RFQ ─────────────────────────────────────────────────────────────────
    const handleRFQPress = (e: any) => {
        e.stopPropagation();

        if (!isAuthenticated) {
            showToast({ message: t('product.loginToRequestQuote'), type: 'warning' });
            router.push('/login');
            return;
        }

        if (product.supplier?.id) {
            router.push({
                pathname: `/rfq/${product.supplier.id}` as any,
                params: {
                    productId: product.id.toString(),
                    productName: product.name,
                },
            });
        }
    };

    // ─── Render ───────────────────────────────────────────────────────────────
    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.8}
            // Disable outer press-through when selector is open to prevent
            // accidental navigation while the user is picking options.
            disabled={isSelectorOpen}
        >
            <Card variant={cardVariant} style={styles.card}>
                {/* ── Image + Info ──────────────────────────────────────── */}
                <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={isSelectorOpen ? undefined : onPress}
                    style={styles.cardBody}
                >
                    {/* Product Image */}
                    <View style={styles.imageContainer}>
                        <ProductImage
                            imageUrl={productData.imageUrl}
                            style={styles.image}
                            recyclingKey={product.id?.toString()}
                            priority="low"
                            contentFit="cover"
                        />

                        {/* Availability Badge */}
                        {(product.immediate_shipping && product.in_stock && (product.quantity ?? 0) > 0) ? (
                            <View style={styles.availabilityBadgeGreen}>
                                <Ionicons name="checkmark" size={18} color="#15803d" />
                            </View>
                        ) : product.made_to_order ? (
                            <View style={styles.availabilityBadgeOrange}>
                                <Ionicons name="time-outline" size={16} color="#c2410c" />
                            </View>
                        ) : null}

                        {/* Sale Badge */}
                        {productData.isOnSale && product.in_stock ? (
                            <View style={styles.saleBadge}>
                                <Text style={styles.saleText}>{t('product.sale')}</Text>
                            </View>
                        ) : null}

                        {/* New Badge */}
                        {!productData.isOnSale && productData.isNew && product.in_stock ? (
                            <View style={styles.newBadge}>
                                <Text style={styles.newText}>{t('product.new')}</Text>
                            </View>
                        ) : null}

                        {/* Wishlist button */}
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

                        {/* RFQ button */}
                        {product.supplier?.id && isAuthenticated ? (
                            <TouchableOpacity
                                style={styles.rfqButtonOverlay}
                                onPress={handleRFQPress}
                                activeOpacity={0.7}
                            >
                                <Ionicons
                                    name="document-text-outline"
                                    size={20}
                                    color={theme.colors.primary[500]}
                                />
                            </TouchableOpacity>
                        ) : null}

                        {/* Rating badge */}
                        {productData.rating > 0 ? (
                            <View style={styles.ratingContainer}>
                                <Ionicons
                                    name="star"
                                    size={RATING_ICON_SIZE}
                                    color={theme.colors.warning.main}
                                />
                                <Text style={styles.rating}>{productData.rating.toFixed(1)}</Text>
                                {productData.reviewCount > 0 ? (
                                    <Text style={styles.reviewCount}>({productData.reviewCount})</Text>
                                ) : null}
                            </View>
                        ) : null}
                    </View>

                    {/* Product Info */}
                    <View style={styles.info}>
                        <Text style={styles.name} numberOfLines={1}>
                            {productData.name}
                        </Text>

                        <View style={styles.priceWrapper}>
                            {/* Price label — "as low as" only when no variant chosen yet */}
                            {/* <View style={styles.priceLabelContainer}>
                                {priceLabel ? (
                                    <Text style={styles.priceLabel}>{priceLabel}</Text>
                                ) : null}
                            </View> */}

                            <View style={styles.priceRow}>
                                <View style={styles.priceContainer}>
                                    {productData.hasDiscount ? (
                                        <>
                                            <Text style={styles.specialPrice}>
                                                {formatters.formatPrice(
                                                    productData.currentPrice,
                                                    currencySymbol,
                                                )}
                                            </Text>
                                            <Text style={styles.originalPrice}>
                                                {formatters.formatPriceWithoutCurrency(
                                                    productData.originalPrice,
                                                )}
                                            </Text>
                                        </>
                                    ) : (
                                        <Text style={styles.price}>
                                            {formatters.formatPrice(
                                                productData.currentPrice,
                                                currencySymbol,
                                            )}
                                        </Text>
                                    )}
                                </View>
                            </View>
                        </View>
                    </View>
                </TouchableOpacity>

                {/* ── Inline Variant Selector (configurable only) ─────────── */}
                {isConfigurable && isSelectorOpen && (
                    <CardVariantSelector variantState={variantState} />
                )}

                {/* ── Footer Actions ────────────────────────────────────── */}
                <View style={styles.footerActions}>
                    {isConfigurable && !isFullySelected ? (
                        /* Configurable — no variant selected yet:
                           show a "Select Options" toggle that opens/closes the selector */
                        <TouchableOpacity
                            style={styles.selectOptionsButton}
                            onPress={handleToggleSelector}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.selectOptionsText}>
                                {isSelectorOpen
                                    ? t('product.hideOptions') || 'Hide Options'
                                    : t('product.selectOptions') || 'Select Options'}
                            </Text>
                            <Ionicons
                                name={isSelectorOpen ? 'chevron-up' : 'chevron-down'}
                                size={14}
                                color={theme.colors.primary[500]}
                            />
                        </TouchableOpacity>
                    ) : (
                        /* Simple product OR configurable with variant fully selected:
                           show qty input + cart icon button */
                        <>
                            <View style={styles.quantityContainer}>
                                <Text style={styles.qtyLabel}>{t('product.qty') || 'Qty'}:</Text>
                                <TextInput
                                    style={styles.quantityInput}
                                    value={quantity}
                                    onChangeText={(text) =>
                                        setQuantity(text.replace(/[^0-9]/g, ''))
                                    }
                                    keyboardType="numeric"
                                    maxLength={4}
                                    selectTextOnFocus
                                />
                            </View>

                            <TouchableOpacity
                                style={[
                                    styles.addToCartIconButton,
                                    !product.in_stock && styles.addToCartButtonDisabled,
                                ]}
                                onPress={handleAddToCart}
                                disabled={!product.in_stock || isAddingThisProduct}
                                activeOpacity={0.7}
                            >
                                {isAddingThisProduct ? (
                                    <ActivityIndicator size="small" color={theme.colors.white} />
                                ) : (
                                    <Ionicons name="cart-outline" size={20} color={theme.colors.white} />
                                )}
                            </TouchableOpacity>
                        </>
                    )}
                </View>
            </Card>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        padding: 0,
        overflow: 'hidden',
        backgroundColor: theme.colors.background.default,
        borderWidth: 0.5,
        borderColor: theme.colors.border.card_light,
    },
    cardBody: {
        overflow: 'hidden',
    },
    imageContainer: {
        width: '100%',
        height: 140,
        position: 'relative',
        backgroundColor: theme.colors.background.default,
        borderTopLeftRadius: theme.borderRadius.lg,
        borderTopRightRadius: theme.borderRadius.lg,
        overflow: 'hidden',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    wishlistButton: {
        position: 'absolute',
        bottom: theme.spacing.sm,
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
        backgroundColor: '#DC2626',
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.xs,
        borderRadius: 22,
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
        backgroundColor: '#1E3A8A',
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.xs,
        borderRadius: 22,
    },
    newText: {
        color: theme.colors.white,
        fontSize: theme.typography.fontSize.xs,
        fontWeight: theme.typography.fontWeight.semiBold,
        textTransform: 'uppercase',
    },
    info: {
        paddingHorizontal: theme.spacing.sm,
        paddingTop: theme.spacing.sm,
        paddingBottom: theme.spacing.xs,
    },
    name: {
        fontSize: theme.typography.fontSize.sm,
        fontWeight: theme.typography.fontWeight.medium,
        color: theme.colors.text.primary,
        marginBottom: 0,
        height: 18,
    },
    ratingContainer: {
        position: 'absolute',
        bottom: theme.spacing.sm,
        left: theme.spacing.sm,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: 2,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1.41,
        elevation: 2,
        zIndex: 10,
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
        gap: 0,
        minHeight: 24,
    },
    priceLabelContainer: {
        height: 14,
        justifyContent: 'flex-start',
        marginBottom: -10,
    },
    priceLabel: {
        fontSize: theme.typography.fontSize.xs,
        color: theme.colors.text.secondary,
        lineHeight: 12,
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        minHeight: 10,
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    rfqButtonOverlay: {
        position: 'absolute',
        bottom: theme.spacing.sm + 44,
        right: theme.spacing.sm,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.3,
        shadowRadius: 2,
        elevation: 3,
    },
    footerActions: {
        flexDirection: 'row',
        backgroundColor: theme.colors.background.default,
        borderTopWidth: 0.5,
        borderTopColor: theme.colors.border.card_light,
        overflow: 'hidden',
        height: 40,
    },

    /* Configurable — no selection yet */
    selectOptionsButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        paddingHorizontal: theme.spacing.sm,
    },
    selectOptionsText: {
        fontSize: theme.typography.fontSize.xs,
        fontWeight: theme.typography.fontWeight.semiBold,
        color: theme.colors.primary[500],
    },

    /* Qty + cart (simple & fully-selected configurable) */
    quantityContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.sm,
        gap: theme.spacing.xs,
    },
    qtyLabel: {
        fontSize: theme.typography.fontSize.xs,
        color: theme.colors.text.secondary,
        fontWeight: theme.typography.fontWeight.medium,
    },
    quantityInput: {
        flex: 1,
        height: 28,
        paddingVertical: 0,
        paddingHorizontal: theme.spacing.xs,
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.text.primary,
        backgroundColor: theme.colors.gray[50],
        borderRadius: 4,
        textAlign: 'center',
        textAlignVertical: 'center',
        includeFontPadding: false,
        borderWidth: 1,
        borderColor: theme.colors.border.card_light,
    },
    addToCartIconButton: {
        width: 48,
        height: '100%',
        backgroundColor: theme.colors.primary[500],
        alignItems: 'center',
        justifyContent: 'center',
    },
    addToCartButtonDisabled: {
        backgroundColor: theme.colors.gray[400],
    },

    /* Availability badges */
    availabilityBadgeGreen: {
        position: 'absolute',
        top: theme.spacing.sm,
        right: theme.spacing.sm,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.92)',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 3,
        zIndex: 10,
    },
    availabilityBadgeOrange: {
        position: 'absolute',
        top: theme.spacing.sm,
        right: theme.spacing.sm,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.92)',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 3,
        zIndex: 10,
    },

    /* Prices */
    price: {
        fontSize: theme.typography.fontSize.md,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.primary[500],
    },
    specialPrice: {
        fontSize: theme.typography.fontSize.md,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.error.main,
        marginRight: theme.spacing.sm,
    },
    originalPrice: {
        fontSize: theme.typography.fontSize.xs,
        color: '#9CA3AF',
        textDecorationLine: 'line-through',
        textDecorationColor: '#9CA3AF',
        fontWeight: theme.typography.fontWeight.medium,
    },
});

export default ProductCard;
