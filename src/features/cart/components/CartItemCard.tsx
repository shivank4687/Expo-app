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

    const productInfo = item.child?.product || item.product;

    const imageUrl = productInfo?.thumbnail ||
        (productInfo?.images && productInfo.images[0]?.url);
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

        const availableQty = productInfo.quantity ?? 0;
        let targetQty = newQuantity;

        if (!productInfo.made_to_order) {
            if (availableQty === 0 || !productInfo.in_stock) {
                showToast({
                    message: t('cart.outOfStock') || 'This item is out of stock.',
                    type: 'error'
                });
                return;
            }

            if (newQuantity > availableQty) {
                if (newQuantity < item.quantity) {
                    // Clamping decrement to available stock
                    targetQty = availableQty;
                } else {
                    // Prevent incrementing beyond stock
                    showToast({
                        message: t('cart.onlyQtyAvailable', { count: availableQty }) || `Only ${availableQty} units available in stock.`,
                        type: 'warning'
                    });
                    return;
                }
            }
        }

        setIsUpdating(true);
        try {
            await dispatch(updateCartItemThunk({
                qty: { [item.id]: targetQty }
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
            {/* Delete/Cross Button (Option A: Top-Left) */}
            <TouchableOpacity
                style={styles.deleteButton}
                onPress={handleRemove}
                disabled={isRemovingThis}
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
                {isRemovingThis ? (
                    <ActivityIndicator size="small" color={theme.colors.error.main} />
                ) : (
                    <Ionicons name="close" size={12} color={theme.colors.error.main} />
                )}
            </TouchableOpacity>

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

                            {/* Availability Badge - top right (made_to_order wins over immediate_shipping, followed by stock check) */}
                            {(!productInfo.made_to_order && (!productInfo.in_stock || (productInfo.quantity ?? 0) < item.quantity)) ? (
                                <View style={styles.availabilityBadgeRed}>
                                    <Ionicons name="close" size={16} color={theme.colors.error.main} />
                                </View>
                            ) : (productInfo.immediate_shipping && productInfo.in_stock && (productInfo.quantity ?? 0) >= item.quantity) ? (
                                <View style={styles.availabilityBadgeGreen}>
                                    <Ionicons name="checkmark" size={16} color="#15803d" />
                                </View>
                            ) : productInfo.made_to_order ? (
                                <View style={styles.availabilityBadgeOrange}>
                                    <Ionicons name="time-outline" size={14} color="#c2410c" />
                                </View>
                            ) : null}
                        </View>
                    </TouchableOpacity>

                    {/* Product Details */}
                    <View style={styles.detailsContainer}>
                        <View style={styles.productInfoSection}>
                            <View style={styles.nameAndPrice}>
                                <TouchableOpacity style={{ flex: 1, paddingRight: 8 }} onPress={handleProductPress} activeOpacity={0.7}>
                                    <Text style={styles.productName} numberOfLines={1}>
                                        {item.name}
                                    </Text>
                                    {(() => {
                                        const attributes = item.additional?.attributes
                                            ? (Array.isArray(item.additional.attributes)
                                                ? item.additional.attributes
                                                : Object.values(item.additional.attributes))
                                            : [];

                                        if (attributes.length === 0) return null;

                                        return (
                                            <View style={styles.chipsContainer}>
                                                {attributes.map((attr: any, index: number) => (
                                                    <View key={index} style={styles.chip}>
                                                        <Text style={styles.chipText}>
                                                            {attr.attribute_name}: {attr.option_label}
                                                        </Text>
                                                    </View>
                                                ))}
                                            </View>
                                        );
                                    })()}
                                </TouchableOpacity>
                                <Text style={styles.price}>
                                    {formatters.formatPrice(item.price, currencySymbol)}
                                </Text>
                            </View>

                            {/* Warning / Availability Indicators */}
                            {(() => {
                                const isMadeToOrder = productInfo.made_to_order;
                                const availableQty = productInfo.quantity ?? 0;
                                const inStock = productInfo.in_stock;

                                if (isMadeToOrder) {
                                    const inStockQty = Math.max(0, availableQty);
                                    const mtoQty = Math.max(0, item.quantity - inStockQty);
                                    const days = productInfo.made_to_order_days;

                                    if (inStockQty > 0 && mtoQty > 0) {
                                        // Split MTO and in-stock units
                                        return (
                                            <View style={[styles.stockAlertContainer, styles.warningStockAlert]}>
                                                <Ionicons name="time-outline" size={16} color={theme.colors.warning.main} />
                                                <Text style={[styles.stockAlertText, styles.warningStockText]}>
                                                    {t('cart.mtoSplitAlert', { inStock: inStockQty, mto: mtoQty })}
                                                </Text>
                                            </View>
                                        );
                                    } else if (mtoQty > 0) {
                                        // Entire quantity is MTO
                                        return (
                                            <View style={[styles.stockAlertContainer, styles.warningStockAlert]}>
                                                <Ionicons name="time-outline" size={16} color={theme.colors.warning.main} />
                                                <Text style={[styles.stockAlertText, styles.warningStockText]}>
                                                    {t('cart.mtoFullAlert')}
                                                </Text>
                                            </View>
                                        );
                                    } else {
                                        // All units in stock (ready to ship)
                                        return (
                                            <View style={[styles.stockAlertContainer, styles.successStockAlert]}>
                                                <Ionicons name="checkmark-circle-outline" size={16} color={theme.colors.success.main} />
                                                <Text style={[styles.stockAlertText, styles.successStockText]}>
                                                    {t('cart.readyToShip')}
                                                </Text>
                                            </View>
                                        );
                                    }
                                }

                                // Else: Immediate shipping stock logic
                                if (!inStock || availableQty === 0) {
                                    return (
                                        <View style={[styles.stockAlertContainer, styles.outOfStockAlert]}>
                                            <Ionicons name="alert-circle-outline" size={16} color={theme.colors.error.main} />
                                            <Text style={[styles.stockAlertText, styles.outOfStockText]}>
                                                {t('cart.outOfStock')}
                                            </Text>
                                        </View>
                                    );
                                }

                                if (item.quantity > availableQty) {
                                    return (
                                        <View style={[styles.stockAlertContainer, styles.errorStockAlert]}>
                                            <Ionicons name="alert-circle-outline" size={16} color={theme.colors.error.main} />
                                            <Text style={[styles.stockAlertText, styles.errorStockText]}>
                                                {t('cart.onlyQtyAvailable', { count: availableQty })}
                                            </Text>
                                        </View>
                                    );
                                }

                                if (availableQty < 50) {
                                    return (
                                        <View style={[styles.stockAlertContainer, styles.warningStockAlert]}>
                                            <Ionicons name="warning-outline" size={16} color={theme.colors.warning.main} />
                                            <Text style={[styles.stockAlertText, styles.warningStockText]}>
                                                {t('cart.lowStockWarning', { count: availableQty })}
                                            </Text>
                                        </View>
                                    );
                                }

                                return null;
                            })()}
                        </View>

                        {/* Quantity Controls + Subtotal */}
                        <View style={styles.qtyAndSubtotal}>
                            <QuantitySelector
                                quantity={item.quantity}
                                onChangeQuantity={handleQuantityChange}
                                isLoading={isUpdating}
                                minQuantity={1}
                                maxQuantity={!productInfo.made_to_order ? (productInfo.quantity ?? 999) : 999}
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
        backgroundColor: theme.colors.background.default,
        borderWidth: 1,
        borderColor: theme.colors.border.card_light,
    },
    deleteButton: {
        position: 'absolute',
        top: -6,
        right: -4,
        zIndex: 20,
        width: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: '#FEF2F2',
        borderWidth: 1,
        borderColor: '#FCA5A5',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1,
        elevation: 1,
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
    chipsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 4,
        marginTop: 6,
    },
    chip: {
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    chipText: {
        fontSize: 10,
        fontWeight: '500',
        color: '#4B5563',
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
    availabilityBadgeRed: {
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
    stockAlertContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 6,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        alignSelf: 'flex-start',
    },
    outOfStockAlert: {
        backgroundColor: '#FEE2E2', // red-100
        borderColor: '#FCA5A5', // red-300
        borderWidth: 0.5,
    },
    errorStockAlert: {
        backgroundColor: '#FEE2E2', // red-100
        borderColor: '#FCA5A5', // red-300
        borderWidth: 0.5,
    },
    warningStockAlert: {
        backgroundColor: '#FEF3C7', // amber-100
        borderColor: '#FDE68A', // amber-200
        borderWidth: 0.5,
    },
    stockAlertText: {
        fontSize: 12,
        fontWeight: '600',
        fontFamily: 'Inter',
    },
    outOfStockText: {
        color: theme.colors.error.main,
    },
    errorStockText: {
        color: theme.colors.error.main,
    },
    warningStockText: {
        color: '#D97706',
    },
    successStockAlert: {
        backgroundColor: '#ECFDF5', // green-50
        borderColor: '#A7F3D0', // green-200
        borderWidth: 0.5,
    },
    successStockText: {
        color: theme.colors.success.dark,
    },
});

