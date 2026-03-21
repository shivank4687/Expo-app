/**
 * CartItemCard Component
 * Displays individual cart item with quantity controls and actions
 */

import { CartItem } from '@/features/cart/types/cart.types';
import { Card } from '@/shared/components/Card';
import { ProductImage } from '@/shared/components/LazyImage';
import { useToast } from '@/shared/components/Toast';
import { QuantitySelector } from '@/shared/components/QuantitySelector';
import { formatters } from '@/shared/utils/formatters';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { moveToWishlistThunk, removeFromCartThunk, updateCartItemThunk } from '@/store/slices/cartSlice';
import { theme } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface CartItemCardProps {
    item: CartItem;
}

export const CartItemCard: React.FC<CartItemCardProps> = ({ item }) => {
    const dispatch = useAppDispatch();
    const router = useRouter();
    const { showToast } = useToast();
    const { t } = useTranslation();
    const { isAuthenticated } = useAppSelector((state) => state.auth);
    const { selectedCurrency } = useAppSelector((state) => state.core);
    const [isUpdating, setIsUpdating] = useState(false);

    const currencySymbol = selectedCurrency?.symbol || selectedCurrency?.code || '$';

    const imageUrl = item.product?.thumbnail || (item.product?.images && item.product.images[0]?.url);
    const subtotal = item.price * item.quantity;

    const handleProductPress = () => {
        const productId = item.product_id || item.product?.id;
        // console.log('🎯 Cart item clicked - item.product_id:', item.product_id, 'item.product.id:', item.product?.id);

        if (productId) {
            // console.log('✅ Navigating to product:', productId);
            router.push(`/product/${productId}` as any);
        } else {
            // console.log('❌ No product ID available. Item data:', JSON.stringify({
            //     id: item.id,
            //     product_id: item.product_id,
            //     product: item.product ? { id: item.product.id } : null
            // }));
        }
    };

    const handleQuantityChange = async (newQuantity: number) => {
        if (newQuantity < 1) return;

        setIsUpdating(true);
        try {
            await dispatch(updateCartItemThunk({
                qty: { [item.id]: newQuantity }
            })).unwrap();
        } catch (error: any) {
            showToast({ message: error || t('cart.failedToUpdate'), type: 'error' });
        } finally {
            setIsUpdating(false);
        }
    };

    const handleRemove = () => {
        Alert.alert(
            t('cart.removeItem'),
            t('cart.removeItemConfirm', { name: item.name }),
            [
                { text: t('common.cancel'), style: 'cancel' },
                {
                    text: t('cart.remove'),
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await dispatch(removeFromCartThunk(item.id)).unwrap();
                            showToast({ message: t('cart.itemRemoved'), type: 'success' });
                        } catch (error: any) {
                            showToast({ message: error || t('cart.failedToRemove'), type: 'error' });
                        }
                    },
                },
            ]
        );
    };

    const handleMoveToWishlist = async () => {
        // Check if user is authenticated
        if (!isAuthenticated) {
            showToast({ message: t('cart.loginToMoveWishlist'), type: 'warning' });
            return;
        }

        try {
            // console.log('[CartItemCard] Moving item to wishlist:', item.id);
            const result = await dispatch(moveToWishlistThunk(item.id)).unwrap();
            // console.log('[CartItemCard] Move completed, updated cart:', result);

            // Cart state is already updated by moveToWishlistThunk which fetches the cart
            // The header will automatically reflect the new count

            showToast({ message: t('cart.itemMovedToWishlist'), type: 'success' });
        } catch (error: any) {
            console.error('[CartItemCard] Move to wishlist failed:', error);
            showToast({ message: error || t('cart.failedToMoveWishlist'), type: 'error' });
        }
    };

    return (
        <Card style={styles.card}>
            <View style={styles.mainContent}>
                <View style={styles.topSection}>
                    {/* Product Image */}
                    <TouchableOpacity onPress={handleProductPress} activeOpacity={0.7}>
                        <View style={styles.imageContainer}>
                            <ProductImage
                                imageUrl={imageUrl}
                                style={styles.image}
                                recyclingKey={item.product_id?.toString()}
                                priority="normal"
                            />
                        </View>
                    </TouchableOpacity>

                    {/* Product Details */}
                    <View style={styles.detailsContainer}>
                        <View style={styles.productInfoSection}>
                            <View style={styles.nameAndPrice}>
                                <TouchableOpacity style={{ flex: 1, paddingRight: 8 }} onPress={handleProductPress} activeOpacity={0.7}>
                                    <Text style={styles.productName} numberOfLines={2}>
                                        {item.name}
                                    </Text>
                                </TouchableOpacity>
                                <Text style={styles.price}>
                                    {formatters.formatPrice(item.price, currencySymbol)}
                                </Text>
                            </View>
                        </View>

                        {/* Quantity Controls + Subtotal */}
                        <View style={styles.qtyAndSubtotal}>
                            <QuantitySelector
                                quantity={item.quantity}
                                onIncrease={() => handleQuantityChange(item.quantity + 1)}
                                onDecrease={() => handleQuantityChange(item.quantity - 1)}
                                isLoading={isUpdating}
                                minQuantity={1}
                                disabled={isUpdating}
                            />
                            <View style={styles.subtotalRow}>
                                <Text style={styles.subtotalLabel}>{t('cart.subtotal')}</Text>
                                <Text style={styles.subtotal}>
                                    {formatters.formatPrice(subtotal, currencySymbol)}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>
            </View>

            {/* Actions - Full Width at Bottom */}
            <View style={styles.actionsContainer}>
                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={(e) => {
                        e?.stopPropagation?.();
                        handleMoveToWishlist();
                    }}
                >
                    <Ionicons
                        name="heart-outline"
                        size={18}
                        color={theme.colors.text.secondary}
                    />
                    <Text style={styles.actionText}>{t('cart.moveToWishlist')}</Text>
                </TouchableOpacity>

                <View style={styles.actionDivider} />

                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={(e) => {
                        e?.stopPropagation?.();
                        handleRemove();
                    }}
                >
                    <Ionicons
                        name="trash-outline"
                        size={18}
                        color={theme.colors.error.main}
                    />
                    <Text style={[styles.actionText, styles.removeText]}>{t('cart.remove')}</Text>
                </TouchableOpacity>
            </View>
        </Card>
    );
};

const styles = StyleSheet.create({
    card: {
        marginBottom: theme.spacing.md,
        padding: 0,
        overflow: 'hidden',
        backgroundColor: theme.colors.background.default,
        borderWidth: 1,
        borderColor: theme.colors.border.card_light,
    },
    mainContent: {
        padding: theme.spacing.md,
    },
    topSection: {
        flexDirection: 'row',
    },
    imageContainer: {
        width: 100,
        height: 90,
        borderRadius: theme.borderRadius.md,
        overflow: 'hidden',
        backgroundColor: theme.colors.gray[100],
    },
    image: {
        width: '100%',
        height: '100%',
    },
    detailsContainer: {
        flex: 1,
        marginLeft: theme.spacing.md,
        justifyContent: 'space-between',
    },
    productInfoSection: {
        flex: 1,
    },
    nameAndPrice: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: theme.spacing.sm,
        marginBottom: theme.spacing.xs,
    },
    productName: {
        fontSize: theme.typography.fontSize.md,
        fontWeight: theme.typography.fontWeight.semiBold,
        color: theme.colors.text.primary,
    },
    price: {
        fontSize: theme.typography.fontSize.md,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.primary[500],
    },
    qtyAndSubtotal: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: theme.spacing.sm,
    },
    subtotalRow: {
        flexDirection: 'column',
        alignItems: 'center',
    },
    subtotalLabel: {
        fontSize: theme.typography.fontSize.xs,
        color: theme.colors.text.secondary,
    },
    subtotal: {
        fontSize: theme.typography.fontSize.sm,
        fontWeight: theme.typography.fontWeight.semiBold,
        color: theme.colors.text.primary,
    },
    quantitySelectorWrapper: {
        marginVertical: theme.spacing.sm,
    },
    actionsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        borderTopWidth: 1,
        borderTopColor: theme.colors.gray[200],
        paddingVertical: theme.spacing.sm,
        backgroundColor: theme.colors.background.default,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.xs,
        paddingHorizontal: theme.spacing.md,
    },
    actionDivider: {
        width: 1,
        height: 24,
        backgroundColor: theme.colors.gray[300],
    },
    actionText: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.text.secondary,
        fontWeight: theme.typography.fontWeight.medium,
    },
    removeText: {
        color: theme.colors.error.main,
    },
});

