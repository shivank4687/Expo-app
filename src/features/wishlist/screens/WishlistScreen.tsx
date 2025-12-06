import React, { useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { theme } from '@/theme';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchWishlistThunk, removeFromWishlistThunk, moveToCartThunk } from '@/store/slices/wishlistSlice';
import { fetchCartThunk } from '@/store/slices/cartSlice';
import { WishlistItem } from '@/features/wishlist/types/wishlist.types';
import { ProductImage } from '@/shared/components/LazyImage';
import { formatters } from '@/shared/utils/formatters';
import { useToast } from '@/shared/components/Toast';
import { Card } from '@/shared/components/Card';

/**
 * WishlistScreen Component
 * Displays user's wishlist with product cards and remove functionality
 */
export const WishlistScreen = () => {
    const { t } = useTranslation();
    const router = useRouter();
    const dispatch = useAppDispatch();
    const { showToast } = useToast();
    const { items, isLoading, isRemoving, removingProductId } = useAppSelector((state) => state.wishlist);

    useEffect(() => {
        // Fetch wishlist when component mounts
        console.log('[WishlistScreen] Component mounted, fetching wishlist...');
        dispatch(fetchWishlistThunk());
    }, [dispatch]);

    // Refresh wishlist when screen comes into focus (e.g., after adding from product screen or moving from cart)
    useFocusEffect(
        useCallback(() => {
            console.log('[WishlistScreen] Screen focused, refreshing wishlist...');
            dispatch(fetchWishlistThunk());
        }, [dispatch])
    );

    // Log whenever items change
    useEffect(() => {
        console.log('[WishlistScreen] Items updated:', items);
        console.log('[WishlistScreen] Items count:', items?.length);
        console.log('[WishlistScreen] Is loading:', isLoading);
    }, [items, isLoading]);

    const handleProductPress = (productId: number) => {
        router.push(`/product/${productId}` as any);
    };

    const handleRemoveFromWishlist = (item: WishlistItem) => {
        Alert.alert(
            t('wishlist.removeFromWishlist'),
            t('wishlist.removeConfirm', { name: item.product.name }),
            [
                {
                    text: t('common.cancel'),
                    style: 'cancel',
                },
                {
                    text: t('common.delete'),
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await dispatch(removeFromWishlistThunk(item.product.id)).unwrap();
                            showToast({ message: t('wishlist.removed'), type: 'success' });
                        } catch (error: any) {
                            showToast({ message: error || t('wishlist.removeFailed'), type: 'error' });
                        }
                    },
                },
            ]
        );
    };

    const handleMoveToCart = async (item: WishlistItem, e: any) => {
        e.stopPropagation();
        
        if (!item.product.in_stock) {
            showToast({ message: t('product.outOfStock'), type: 'error' });
            return;
        }

        try {
            console.log('[WishlistScreen] Moving item to cart:', item.product.id);
            
            // Move item from wishlist to cart
            await dispatch(moveToCartThunk({
                productId: item.product.id,
                quantity: 1,
            })).unwrap();
            
            console.log('[WishlistScreen] Item moved to cart successfully');
            
            // Fetch updated cart to update the cart icon count in header
            console.log('[WishlistScreen] Fetching updated cart to refresh header count...');
            await dispatch(fetchCartThunk());
            console.log('[WishlistScreen] Cart updated');
            
            showToast({ message: t('wishlist.movedToCart', 'Moved to cart successfully'), type: 'success' });
        } catch (error: any) {
            console.error('[WishlistScreen] Failed to move to cart:', error);
            showToast({ message: error || t('wishlist.failedToMoveCart', 'Failed to move to cart'), type: 'error' });
        }
    };

    const renderWishlistItem = ({ item }: { item: WishlistItem }) => {
        const product = item.product;
        const hasDiscount = product.on_sale || (product.regular_price && product.regular_price > product.price);
        const isRemovingThis = isRemoving && removingProductId === product.id;

        return (
            <TouchableOpacity 
                onPress={() => handleProductPress(product.id)}
                activeOpacity={0.7}
                style={styles.itemContainer}
            >
                <Card variant="elevated" style={styles.card}>
                    <View style={styles.cardContent}>
                        {/* Product Image */}
                        <View style={styles.imageContainer}>
                            <ProductImage
                                imageUrl={product.thumbnail || (product.images && product.images[0]?.url)}
                                style={styles.image}
                                recyclingKey={product.id?.toString()}
                                priority="low"
                            />
                            
                            {/* Out of Stock Badge */}
                            {!product.in_stock && (
                                <View style={styles.outOfStockBadge}>
                                    <Text style={styles.outOfStockText}>{t('product.outOfStock')}</Text>
                                </View>
                            )}
                        </View>

                        {/* Product Info */}
                        <View style={styles.infoContainer}>
                            <Text style={styles.productName} numberOfLines={2}>
                                {product.name}
                            </Text>

                            {/* Rating */}
                            {product.rating && product.rating > 0 ? (
                                <View style={styles.ratingContainer}>
                                    <Ionicons name="star" size={14} color={theme.colors.warning.main} />
                                    <Text style={styles.rating}>{product.rating.toFixed(1)}</Text>
                                    {product.reviews_count && product.reviews_count > 0 ? (
                                        <Text style={styles.reviewCount}>({product.reviews_count})</Text>
                                    ) : null}
                                </View>
                            ) : null}

                            {/* Price */}
                            <View style={styles.priceContainer}>
                                {hasDiscount ? (
                                    <>
                                        <Text style={styles.specialPrice}>
                                            {formatters.formatPrice(product.price)}
                                        </Text>
                                        <Text style={styles.originalPrice}>
                                            {formatters.formatPrice(product.regular_price || product.price)}
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

                    {/* Actions - Full Width at Bottom */}
                    <View style={styles.actionsContainer}>
                        <TouchableOpacity 
                            style={styles.actionButton}
                            onPress={(e) => {
                                e?.stopPropagation?.();
                                handleMoveToCart(item, e);
                            }}
                            disabled={!product.in_stock}
                        >
                            <Ionicons 
                                name="cart-outline" 
                                size={18} 
                                color={product.in_stock ? theme.colors.text.secondary : theme.colors.gray[400]} 
                            />
                            <Text style={[
                                styles.actionText,
                                !product.in_stock && styles.actionTextDisabled
                            ]}>
                                {t('wishlist.moveToCart', 'Move to Cart')}
                            </Text>
                        </TouchableOpacity>

                        <View style={styles.actionDivider} />

                        <TouchableOpacity 
                            style={styles.actionButton}
                            onPress={(e) => {
                                e?.stopPropagation?.();
                                handleRemoveFromWishlist(item);
                            }}
                            disabled={isRemovingThis}
                        >
                            {isRemovingThis ? (
                                <ActivityIndicator size="small" color={theme.colors.error.main} />
                            ) : (
                                <>
                                    <Ionicons 
                                        name="trash-outline" 
                                        size={18} 
                                        color={theme.colors.error.main} 
                                    />
                                    <Text style={[styles.actionText, styles.removeText]}>
                                        {t('wishlist.remove', 'Remove')}
                                    </Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </Card>
            </TouchableOpacity>
        );
    };

    const renderEmptyState = () => (
        <View style={styles.emptyContainer}>
            <Ionicons name="heart-outline" size={80} color={theme.colors.gray[300]} />
            <Text style={styles.emptyTitle}>{t('wishlist.emptyWishlist')}</Text>
            <Text style={styles.emptyMessage}>{t('wishlist.emptyWishlistMessage')}</Text>
            <TouchableOpacity
                style={styles.shopButton}
                onPress={() => router.push('/(drawer)/(tabs)/')}
                activeOpacity={0.8}
            >
                <Text style={styles.shopButtonText}>{t('wishlist.startShopping')}</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('wishlist.myWishlist')}</Text>
                <View style={styles.headerRight}>
                    {items.length > 0 && (
                        <Text style={styles.itemCount}>
                            {t('wishlist.itemsCount', { count: items.length })}
                        </Text>
                    )}
                </View>
            </View>

            {/* Content */}
            {isLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.colors.primary[500]} />
                    <Text style={styles.loadingText}>{t('wishlist.loadingWishlist')}</Text>
                </View>
            ) : items.length === 0 ? (
                renderEmptyState()
            ) : (
                <FlatList
                    data={items}
                    renderItem={renderWishlistItem}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background.default,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.gray[200],
        backgroundColor: theme.colors.background.paper,
    },
    backButton: {
        padding: theme.spacing.xs,
    },
    headerTitle: {
        flex: 1,
        fontSize: theme.typography.fontSize.xl,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.text.primary,
        textAlign: 'center',
    },
    headerRight: {
        minWidth: 40,
        alignItems: 'flex-end',
    },
    itemCount: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.text.secondary,
        fontWeight: theme.typography.fontWeight.medium,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: theme.spacing.md,
        fontSize: theme.typography.fontSize.md,
        color: theme.colors.text.secondary,
    },
    listContent: {
        padding: theme.spacing.md,
    },
    itemContainer: {
        marginBottom: theme.spacing.md,
    },
    card: {
        padding: 0,
        overflow: 'hidden',
    },
    cardContent: {
        flexDirection: 'row',
        padding: theme.spacing.md,
        position: 'relative',
    },
    imageContainer: {
        width: 100,
        height: 100,
        borderRadius: theme.borderRadius.md,
        overflow: 'hidden',
        backgroundColor: theme.colors.gray[100],
    },
    image: {
        width: '100%',
        height: '100%',
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
    infoContainer: {
        flex: 1,
        marginLeft: theme.spacing.md,
        justifyContent: 'space-between',
    },
    productName: {
        fontSize: theme.typography.fontSize.md,
        fontWeight: theme.typography.fontWeight.semiBold,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.xs,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.spacing.xs,
    },
    rating: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.text.primary,
        marginLeft: theme.spacing.xs,
        fontWeight: theme.typography.fontWeight.medium,
    },
    reviewCount: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.text.secondary,
        marginLeft: theme.spacing.xs,
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.spacing.sm,
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
        color: theme.colors.gray[400],
        textDecorationLine: 'line-through',
        fontWeight: theme.typography.fontWeight.medium,
    },
    actionsContainer: {
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: theme.colors.border.light,
        backgroundColor: theme.colors.background.paper,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: theme.spacing.md,
        gap: theme.spacing.xs,
    },
    actionDivider: {
        width: 1,
        backgroundColor: theme.colors.border.light,
    },
    actionText: {
        fontSize: theme.typography.fontSize.sm,
        fontWeight: theme.typography.fontWeight.medium,
        color: theme.colors.text.secondary,
    },
    actionTextDisabled: {
        color: theme.colors.gray[400],
    },
    removeText: {
        color: theme.colors.error.main,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: theme.spacing.xl,
    },
    emptyTitle: {
        fontSize: theme.typography.fontSize.xl,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.text.primary,
        marginTop: theme.spacing.lg,
        marginBottom: theme.spacing.sm,
    },
    emptyMessage: {
        fontSize: theme.typography.fontSize.md,
        color: theme.colors.text.secondary,
        textAlign: 'center',
        marginBottom: theme.spacing.xl,
    },
    shopButton: {
        backgroundColor: theme.colors.primary[500],
        paddingHorizontal: theme.spacing.xl,
        paddingVertical: theme.spacing.md,
        borderRadius: theme.borderRadius.md,
    },
    shopButtonText: {
        color: theme.colors.white,
        fontSize: theme.typography.fontSize.md,
        fontWeight: theme.typography.fontWeight.semiBold,
    },
});

export default WishlistScreen;

