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
import { fetchWishlistThunk } from '@/store/slices/wishlistSlice';
import { moveToWishlistThunk, removeFromCartThunk, updateCartItemThunk } from '@/store/slices/cartSlice';
import { theme } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';

interface CartItemCardProps {
    item: CartItem;
    isSelected: boolean;
    onToggleSelection: (id: number) => void;
}

export const CartItemCard: React.FC<CartItemCardProps> = ({ item, isSelected, onToggleSelection }) => {
    const dispatch = useAppDispatch();
    const router = useRouter();
    const { showToast } = useToast();
    const { t } = useTranslation();
    const { isAuthenticated } = useAppSelector((state) => state.auth);
    const {
        isRemovingFromCart,
        removingCartItemId,
        isMovingToWishlist,
        movingToWishlistItemId
    } = useAppSelector((state) => state.cart);
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
                            //showToast({ message: t('cart.itemRemoved'), type: 'success' });
                        } catch (error: any) {
                            showToast({ message: error || t('cart.failedToRemove'), type: 'error' });
                        }
                    },
                },
            ]
        );
    };

    const isRemovingThis = isRemovingFromCart && removingCartItemId === item.id;
    const isMovingToWishlistThis = isMovingToWishlist && movingToWishlistItemId === item.id;

    const handleMoveToWishlist = async () => {
        // ... handled by bulk action now, but kept for single item if needed in future
    };

    const toggleSelection = () => {
        onToggleSelection(item.id);
    };

    return (
        <Card style={styles.card}>
            <View style={styles.mainContent}>
                <View style={styles.topSection}>
                    {/* Selection Checkbox */}
                    <TouchableOpacity
                        style={styles.checkboxContainer}
                        onPress={toggleSelection}
                        activeOpacity={0.7}
                    >
                        <Ionicons
                            name={isSelected ? 'checkbox' : 'square-outline'}
                            size={24}
                            color={isSelected ? theme.colors.primary[500] : theme.colors.gray[400]}
                        />
                    </TouchableOpacity>

                    {/* Product Image */}
                    <TouchableOpacity onPress={handleProductPress} activeOpacity={0.7}>
                        <View style={styles.imageContainer}>
                            <ProductImage
                                imageUrl={imageUrl}
                                style={styles.image}
                                recyclingKey={item.product_id?.toString()}
                                priority="normal"
                            />

                            {/* Availability Badge - top right (made_to_order wins over immediate_shipping) */}
                            {item.product.made_to_order ? (
                                <View style={styles.availabilityBadgeOrange}>
                                    <Ionicons name="time-outline" size={14} color="#c2410c" />
                                </View>
                            ) : (item.product.immediate_shipping && item.product.in_stock) ? (
                                <View style={styles.availabilityBadgeGreen}>
                                    <Ionicons name="checkmark" size={16} color="#15803d" />
                                </View>
                            ) : null}
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
        paddingVertical: theme.spacing.sm,
        paddingRight: theme.spacing.sm,
        paddingLeft: theme.spacing.xs,
    },
    topSection: {
        flexDirection: 'row',
    },
    imageContainer: {
        width: 80,
        height: 80,
        borderRadius: theme.borderRadius.md,
        overflow: 'hidden',
        backgroundColor: theme.colors.gray[100],
    },
    image: {
        width: '100%',
        height: '100%',
    },
    checkboxContainer: {
        justifyContent: 'center',
        paddingRight: theme.spacing.xs,
    },
    availabilityBadgeGreen: {
        position: 'absolute',
        top: 2,
        right: 2,
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.92)',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1,
        elevation: 2,
        zIndex: 10,
    },
    availabilityBadgeOrange: {
        position: 'absolute',
        top: 2,
        right: 2,
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.92)',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1,
        elevation: 2,
        zIndex: 10,
    },
    detailsContainer: {
        flex: 1,
        marginLeft: theme.spacing.xs,
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
        fontSize: theme.typography.fontSize.xs,
        fontWeight: theme.typography.fontWeight.semiBold,
        color: theme.colors.text.primary,
    },
    quantitySelectorWrapper: {
        marginVertical: theme.spacing.sm,
    },
    actionsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: theme.colors.gray[200],
        backgroundColor: theme.colors.background.default,
    },
    actionButton: {
        flex: 1,
        paddingVertical: theme.spacing.md,
    },
    actionButtonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    actionButtonInner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.xs,
    },
    loaderOverlay: {
        position: 'absolute',
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

