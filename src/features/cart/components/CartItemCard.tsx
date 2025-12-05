/**
 * CartItemCard Component
 * Displays individual cart item with quantity controls and actions
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { CartItem } from '@/features/cart/types/cart.types';
import { Card } from '@/shared/components/Card';
import { ProductImage } from '@/shared/components/LazyImage';
import { formatters } from '@/shared/utils/formatters';
import { theme } from '@/theme';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { updateCartItemThunk, removeFromCartThunk, moveToWishlistThunk } from '@/store/slices/cartSlice';
import { useToast } from '@/shared/components/Toast';

interface CartItemCardProps {
    item: CartItem;
}

export const CartItemCard: React.FC<CartItemCardProps> = ({ item }) => {
    const dispatch = useAppDispatch();
    const router = useRouter();
    const { showToast } = useToast();
    const { t } = useTranslation();
    const { isAuthenticated } = useAppSelector((state) => state.auth);
    const [isUpdating, setIsUpdating] = useState(false);

    const imageUrl = item.product?.thumbnail || (item.product?.images && item.product.images[0]?.url);
    const subtotal = item.price * item.quantity;

    const handleProductPress = () => {
        const productId = item.product_id || item.product?.id;
        console.log('🎯 Cart item clicked - item.product_id:', item.product_id, 'item.product.id:', item.product?.id);
        
        if (productId) {
            console.log('✅ Navigating to product:', productId);
            router.push(`/product/${productId}` as any);
        } else {
            console.log('❌ No product ID available. Item data:', JSON.stringify({
                id: item.id,
                product_id: item.product_id,
                product: item.product ? { id: item.product.id } : null
            }));
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
            console.log('[CartItemCard] Moving item to wishlist:', item.id);
            const result = await dispatch(moveToWishlistThunk(item.id)).unwrap();
            console.log('[CartItemCard] Move completed, updated cart:', result);
            
            // Cart state is already updated by moveToWishlistThunk which fetches the cart
            // The header will automatically reflect the new count
            
            showToast({ message: t('cart.itemMovedToWishlist'), type: 'success' });
        } catch (error: any) {
            console.error('[CartItemCard] Move to wishlist failed:', error);
            showToast({ message: error || t('cart.failedToMoveWishlist'), type: 'error' });
        }
    };

    return (
        <TouchableOpacity onPress={handleProductPress} activeOpacity={0.9}>
            <Card style={styles.card}>
                <View style={styles.mainContent}>
                    <View style={styles.topSection}>
                        {/* Product Image */}
                        <View style={styles.imageContainer}>
                            <ProductImage
                                imageUrl={imageUrl}
                                style={styles.image}
                                recyclingKey={item.product_id?.toString()}
                                priority="normal"
                            />
                        </View>

                        {/* Product Details */}
                        <View style={styles.detailsContainer}>
                            <View style={styles.productInfoSection}>
                                <Text style={styles.productName} numberOfLines={2}>
                                    {item.name}
                                </Text>
                                
                                <View style={styles.priceSection}>
                                    <Text style={styles.price}>
                                        {formatters.formatPrice(item.price)}
                                    </Text>
                                <Text style={styles.subtotalLabel}>{t('cart.subtotal')}:</Text>
                                <Text style={styles.subtotal}>
                                    {formatters.formatPrice(subtotal)}
                                </Text>
                                </View>
                            </View>

                        {/* Quantity Controls */}
                        <View style={styles.quantityContainer}>
                            <TouchableOpacity
                                style={[styles.quantityButton, item.quantity <= 1 && styles.quantityButtonDisabled]}
                                onPress={(e) => {
                                    e.stopPropagation();
                                    handleQuantityChange(item.quantity - 1);
                                }}
                                disabled={isUpdating || item.quantity <= 1}
                            >
                                <Ionicons 
                                    name="remove" 
                                    size={20} 
                                    color={item.quantity <= 1 ? theme.colors.gray[400] : theme.colors.text.primary} 
                                />
                            </TouchableOpacity>

                            <View style={styles.quantityDisplay}>
                                {isUpdating ? (
                                    <ActivityIndicator size="small" color={theme.colors.primary[500]} />
                                ) : (
                                    <Text style={styles.quantityText}>{item.quantity}</Text>
                                )}
                            </View>

                            <TouchableOpacity
                                style={styles.quantityButton}
                                onPress={(e) => {
                                    e.stopPropagation();
                                    handleQuantityChange(item.quantity + 1);
                                }}
                                disabled={isUpdating}
                            >
                                <Ionicons 
                                    name="add" 
                                    size={20} 
                                    color={theme.colors.text.primary} 
                                />
                            </TouchableOpacity>
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
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        marginBottom: theme.spacing.md,
        padding: 0,
        overflow: 'hidden',
    },
    mainContent: {
        padding: theme.spacing.md,
    },
    topSection: {
        flexDirection: 'row',
    },
    imageContainer: {
        width: 100,
        height: 120,
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
    productName: {
        fontSize: theme.typography.fontSize.md,
        fontWeight: theme.typography.fontWeight.semiBold,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.sm,
    },
    priceSection: {
        marginTop: theme.spacing.xs,
    },
    price: {
        fontSize: theme.typography.fontSize.md,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.primary[500],
        marginBottom: theme.spacing.xs,
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
    quantityContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: theme.spacing.sm,
    },
    quantityButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: theme.colors.gray[300],
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.white,
    },
    quantityButtonDisabled: {
        opacity: 0.5,
    },
    quantityDisplay: {
        minWidth: 40,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: theme.spacing.sm,
    },
    quantityText: {
        fontSize: theme.typography.fontSize.md,
        fontWeight: theme.typography.fontWeight.semiBold,
        color: theme.colors.text.primary,
    },
    actionsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        borderTopWidth: 1,
        borderTopColor: theme.colors.gray[200],
        paddingVertical: theme.spacing.sm,
        backgroundColor: theme.colors.gray[50],
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

