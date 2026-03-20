/**
 * CartScreen Component
 * Main cart screen with items, coupon, and price details
 */

import { LoadingSpinner } from '@/shared/components/LoadingSpinner';
import { useToast } from '@/shared/components/Toast';
import { formatters } from '@/shared/utils/formatters';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
    applyCouponThunk,
    fetchCartThunk,
    removeCouponThunk
} from '@/store/slices/cartSlice';
import { theme } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CartItemCard } from '../components/CartItemCard';
import { CheckoutAuthModal } from '../components/CheckoutAuthModal';
import { EmptyCart } from '../components/EmptyCart';
import { PriceDetailsSummaryCard } from '../components/PriceDetailsSummaryCard';

export const CartScreen: React.FC = () => {
    const dispatch = useAppDispatch();
    const router = useRouter();
    const { showToast } = useToast();
    const { t } = useTranslation();
    const { cart, isLoading } = useAppSelector((state) => state.cart);
    const { isAuthenticated } = useAppSelector((state) => state.auth);
    const [couponCode, setCouponCode] = useState('');
    const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
    const [isRemovingCoupon, setIsRemovingCoupon] = useState(false);
    const [isCouponExpanded, setIsCouponExpanded] = useState(false);
    const [isPriceDetailsExpanded, setIsPriceDetailsExpanded] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [summaryHeight, setSummaryHeight] = useState(0);
    const insets = useSafeAreaInsets();

    useEffect(() => {
        loadCart();
    }, []);

    const loadCart = async () => {
        try {
            await dispatch(fetchCartThunk()).unwrap();
        } catch (error) {
            // Error handled in slice
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadCart();
        setRefreshing(false);
    };

    const handleApplyCoupon = async () => {
        if (!couponCode.trim()) {
            showToast({ message: t('cart.enterCouponPrompt'), type: 'error' });
            return;
        }

        setIsApplyingCoupon(true);
        try {
            await dispatch(applyCouponThunk({ code: couponCode.trim() })).unwrap();
            showToast({ message: t('cart.couponApplied'), type: 'success' });
            setCouponCode('');
        } catch (error: any) {
            showToast({ message: error || t('cart.failedToApplyCoupon'), type: 'error' });
        } finally {
            setIsApplyingCoupon(false);
        }
    };

    const handleRemoveCoupon = async () => {
        setIsRemovingCoupon(true);
        try {
            await dispatch(removeCouponThunk()).unwrap();
            showToast({ message: t('cart.couponRemoved'), type: 'success' });
        } catch (error: any) {
            showToast({ message: error || t('cart.failedToRemoveCoupon'), type: 'error' });
        } finally {
            setIsRemovingCoupon(false);
        }
    };

    const handleProceedToCheckout = () => {
        if (!isAuthenticated) {
            // Show login/signup modal for guest users
            setShowAuthModal(true);
        } else {
            // Navigate to checkout screen
            router.push('/checkout');
        }
    };

    if (isLoading && !cart) {
        return <LoadingSpinner />;
    }

    if (!cart || !cart.items || cart.items.length === 0) {
        return <EmptyCart />;
    }

    const hasDiscount = (cart.discount_amount || 0) > 0;

    // Debug: Log cart structure
    // console.log('🛒 Cart object keys:', Object.keys(cart));
    // console.log('🛒 Cart values:', {
    //     sub_total: cart.sub_total,
    //     base_sub_total: cart.base_sub_total,
    //     discount_amount: cart.discount_amount,
    //     tax_total: cart.tax_total,
    //     grand_total: cart.grand_total,
    //     shipping_amount: cart.shipping_amount,
    //     formatted_sub_total: cart.formatted_sub_total,
    //     formatted_grand_total: cart.formatted_grand_total,
    // });

    // Calculate amount to pay WITHOUT shipping
    // Use || 0 to handle undefined values
    const subtotal = Number(cart.sub_total || cart.base_sub_total || 0);
    const discount = Number(cart.discount_amount || cart.base_discount_amount || 0);
    const tax = Number(cart.tax_total || cart.base_tax_total || 0);
    const grandTotal = Number(cart.grand_total || cart.base_grand_total || 0);

    //console.log('💰 Parsed values:', { subtotal, discount, tax, grandTotal });

    // Calculate: Subtotal - Discount + Tax
    let amountToPay = subtotal - discount + tax;

    // If calculated amount is 0 or invalid, use grand_total minus shipping if available
    if (amountToPay <= 0 && grandTotal > 0) {
        const shipping = Number(cart.shipping_amount || cart.base_shipping_amount || 0);
        amountToPay = grandTotal - shipping;
        // console.log('⚠️ Using grand_total minus shipping:', grandTotal, '-', shipping, '=', amountToPay);
    }

    // Final fallback: if still 0, use grand_total
    if (amountToPay <= 0 && grandTotal > 0) {
        amountToPay = grandTotal;
        // console.log('⚠️ Final fallback to grand_total:', amountToPay);
    }

    // console.log('✅ Final amount to pay:', amountToPay);

    const formattedAmountToPay = formatters.formatPrice(amountToPay);
    const formattedSubtotal =
        cart.formatted_sub_total || formatters.formatPrice(cart.sub_total || cart.base_sub_total || 0);
    const formattedTax =
        cart.formatted_tax_total || formatters.formatPrice(cart.tax_total || cart.base_tax_total || 0);
    const formattedDiscount =
        cart.formatted_discount_amount || formatters.formatPrice(cart.discount_amount || discount);
    const formattedGrandTotal =
        cart.formatted_grand_total || formatters.formatPrice(cart.grand_total || cart.base_grand_total || 0);

    return (
        <View style={styles.container}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={[
                    styles.scrollContent,
                    { paddingBottom: summaryHeight }
                ]}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {/* Cart Items */}
                <View style={styles.itemsSection}>
                    <Text style={styles.sectionTitle}>
                        {t('cart.itemsInCart', { count: cart.items_count })}
                    </Text>
                    {cart.items.map((item) => (
                        <CartItemCard key={item.id} item={item} />
                    ))}
                </View>

                {/* Apply Coupon Section - Only for authenticated users */}
                {isAuthenticated && (
                    <View style={styles.section}>
                        <TouchableOpacity
                            style={styles.expansionHeader}
                            onPress={() => setIsCouponExpanded(!isCouponExpanded)}
                            activeOpacity={0.7}
                        >
                            <View style={styles.expansionTitleContainer}>
                                <Ionicons
                                    name="pricetag-outline"
                                    size={20}
                                    color={theme.colors.primary[500]}
                                />
                                <Text style={styles.expansionTitle}>{t('cart.applyCoupon')}</Text>
                            </View>
                            <Ionicons
                                name={isCouponExpanded ? 'chevron-up' : 'chevron-down'}
                                size={24}
                                color={theme.colors.text.secondary}
                            />
                        </TouchableOpacity>

                        {isCouponExpanded && (
                            <View style={styles.expansionContent}>
                                {cart.coupon_code ? (
                                    <View style={styles.appliedCouponContainer}>
                                        <View style={styles.appliedCouponInfo}>
                                            <Ionicons
                                                name="checkmark-circle"
                                                size={20}
                                                color={theme.colors.success.main}
                                            />
                                            <Text style={styles.appliedCouponText}>
                                                {cart.coupon_code}
                                            </Text>
                                        </View>
                                        <TouchableOpacity
                                            onPress={handleRemoveCoupon}
                                            disabled={isRemovingCoupon}
                                        >
                                            {isRemovingCoupon ? (
                                                <ActivityIndicator size="small" color={theme.colors.error.main} />
                                            ) : (
                                                <Ionicons
                                                    name="close-circle"
                                                    size={24}
                                                    color={theme.colors.error.main}
                                                />
                                            )}
                                        </TouchableOpacity>
                                    </View>
                                ) : (
                                    <View style={styles.couponInputContainer}>
                                        <TextInput
                                            style={styles.couponInput}
                                            placeholder={t('cart.enterCouponCode')}
                                            placeholderTextColor={theme.colors.gray[400]}
                                            value={couponCode}
                                            onChangeText={setCouponCode}
                                            autoCapitalize="characters"
                                            editable={!isApplyingCoupon}
                                        />
                                        <TouchableOpacity
                                            style={[
                                                styles.applyButton,
                                                isApplyingCoupon && styles.applyButtonDisabled
                                            ]}
                                            onPress={handleApplyCoupon}
                                            disabled={isApplyingCoupon}
                                        >
                                            {isApplyingCoupon ? (
                                                <ActivityIndicator size="small" color={theme.colors.white} />
                                            ) : (
                                                <Text style={styles.applyButtonText}>{t('cart.apply')}</Text>
                                            )}
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>
                        )}
                    </View>
                )}

                {/* Price Details Section */}
                {/* <View style={styles.section}>
                    <TouchableOpacity
                        style={styles.expansionHeader}
                        onPress={() => setIsPriceDetailsExpanded(!isPriceDetailsExpanded)}
                        activeOpacity={0.7}
                    >
                        <View style={styles.expansionTitleContainer}>
                            <Ionicons
                                name="receipt-outline"
                                size={20}
                                color={theme.colors.primary[500]}
                            />
                            <Text style={styles.expansionTitle}>{t('cart.priceDetails')}</Text>
                        </View>
                        <Ionicons
                            name={isPriceDetailsExpanded ? 'chevron-up' : 'chevron-down'}
                            size={24}
                            color={theme.colors.text.secondary}
                        />
                    </TouchableOpacity>

                    {isPriceDetailsExpanded && (
                        <View style={styles.expansionContent}>
                            <View style={styles.priceRow}>
                                <Text style={styles.priceLabel}>{t('cart.subtotal')}</Text>
                                <Text style={styles.priceValue}>
                                    {cart.formatted_sub_total || formatters.formatPrice(cart.sub_total)}
                                </Text>
                            </View>

                            {hasDiscount && (
                                <View style={styles.priceRow}>
                                    <Text style={[styles.priceLabel, styles.discountLabel]}>
                                        {t('cart.discount')}
                                        {cart.coupon_code && (
                                            <Text style={styles.couponBadge}> ({cart.coupon_code})</Text>
                                        )}
                                    </Text>
                                    <Text style={[styles.priceValue, styles.discountValue]}>
                                        -{cart.formatted_discount_amount || formatters.formatPrice(cart.discount_amount)}
                                    </Text>
                                </View>
                            )}

                            <View style={styles.priceRow}>
                                <Text style={styles.priceLabel}>{t('cart.tax')}</Text>
                                <Text style={styles.priceValue}>
                                    {cart.formatted_tax_total || formatters.formatPrice(cart.tax_total)}
                                </Text>
                            </View>
                        </View>
                    )}
                </View> */}

            </ScrollView>

            <View
                style={[styles.summaryCardFixed]}
                onLayout={(e) => setSummaryHeight(e.nativeEvent.layout.height)}
            >
                <PriceDetailsSummaryCard
                    subtotal={formattedSubtotal}
                    tax={formattedTax}
                    discount={hasDiscount ? formattedDiscount : undefined}
                    couponCode={cart.coupon_code}
                    grandTotal={formattedGrandTotal}
                    onCheckoutPress={handleProceedToCheckout}
                />
            </View>

            {/* Checkout Auth Modal */}
            <CheckoutAuthModal
                visible={showAuthModal}
                onClose={() => setShowAuthModal(false)}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background.default,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: theme.spacing.md,
    },
    itemsSection: {
        padding: theme.spacing.md,
    },
    sectionTitle: {
        fontSize: theme.typography.fontSize.lg,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.md,
    },
    section: {
        backgroundColor: theme.colors.background.default,
        marginHorizontal: theme.spacing.md,
        marginBottom: theme.spacing.md,
        borderRadius: theme.borderRadius.lg,
        overflow: 'hidden',
        ...theme.shadows.sm,
    },
    summaryCardFixed: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border.light,
        backgroundColor: theme.colors.background.default,
        ...theme.shadows.md,
        paddingHorizontal: theme.spacing.md,
        paddingTop: theme.spacing.sm,
    },
    expansionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: theme.spacing.md,
        backgroundColor: theme.colors.background.default,
    },
    expansionTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
    },
    expansionTitle: {
        fontSize: theme.typography.fontSize.md,
        fontWeight: theme.typography.fontWeight.semiBold,
        color: theme.colors.text.primary,
    },
    expansionContent: {
        padding: theme.spacing.md,
        paddingTop: 0,
    },
    couponInputContainer: {
        flexDirection: 'row',
        gap: theme.spacing.sm,
    },
    couponInput: {
        flex: 1,
        height: 48,
        borderWidth: 1,
        borderColor: theme.colors.gray[300],
        borderRadius: theme.borderRadius.md,
        paddingHorizontal: theme.spacing.md,
        fontSize: theme.typography.fontSize.md,
        color: theme.colors.text.primary,
        backgroundColor: theme.colors.background.default,
    },
    applyButton: {
        backgroundColor: theme.colors.primary[500],
        paddingHorizontal: theme.spacing.lg,
        borderRadius: theme.borderRadius.md,
        justifyContent: 'center',
        alignItems: 'center',
        minWidth: 80,
    },
    applyButtonDisabled: {
        opacity: 0.6,
    },
    applyButtonText: {
        color: theme.colors.white,
        fontSize: theme.typography.fontSize.md,
        fontWeight: theme.typography.fontWeight.semiBold,
    },
    appliedCouponContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: theme.spacing.md,
        backgroundColor: theme.colors.success.light,
        borderRadius: theme.borderRadius.md,
    },
    appliedCouponInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
    },
    appliedCouponText: {
        fontSize: theme.typography.fontSize.md,
        fontWeight: theme.typography.fontWeight.semiBold,
        color: theme.colors.success.dark,
        textTransform: 'uppercase',
    },
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.md,
    },
    priceLabel: {
        fontSize: theme.typography.fontSize.md,
        color: theme.colors.text.secondary,
    },
    priceValue: {
        fontSize: theme.typography.fontSize.md,
        fontWeight: theme.typography.fontWeight.semiBold,
        color: theme.colors.text.primary,
    },
    discountLabel: {
        color: theme.colors.success.main,
    },
    discountValue: {
        color: theme.colors.success.main,
    },
    couponBadge: {
        fontSize: theme.typography.fontSize.xs,
        fontWeight: theme.typography.fontWeight.bold,
        textTransform: 'uppercase',
    },
});
