/**
 * ReviewStep Component
 * Final review step showing all order details before placing order
 */

import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Card } from '@/shared/components/Card';
import { Button } from '@/shared/components/Button';
import { ProductImage } from '@/shared/components/LazyImage';
import { theme } from '@/theme';
import { Cart } from '@/features/cart/types/cart.types';
import { CheckoutAddress, ShippingMethod, PaymentMethod } from '../types/checkout.types';
import { formatters } from '@/shared/utils/formatters';
import { useAppDispatch } from '@/store/hooks';
import { applyCouponThunk, removeCouponThunk } from '@/store/slices/cartSlice';
import { useToast } from '@/shared/components/Toast';

interface ReviewStepProps {
    cart: Cart;
    billingAddress: CheckoutAddress | null;
    shippingAddress: CheckoutAddress | null;
    sameAsBilling: boolean;
    selectedShippingMethod: string | null;
    shippingMethods: Record<string, ShippingMethod> | null;
    selectedPaymentMethod: string | null;
    paymentMethods: PaymentMethod[] | null;
    onPlaceOrder: () => void;
    isProcessing?: boolean;
}

export const ReviewStep: React.FC<ReviewStepProps> = ({
    cart,
    billingAddress,
    shippingAddress,
    sameAsBilling,
    selectedShippingMethod,
    shippingMethods,
    selectedPaymentMethod,
    paymentMethods,
    onPlaceOrder,
    isProcessing = false,
}) => {
    const { t } = useTranslation();
    const dispatch = useAppDispatch();
    const { showToast } = useToast();
    const [couponCode, setCouponCode] = useState('');
    const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
    const [isRemovingCoupon, setIsRemovingCoupon] = useState(false);
    const [isCouponExpanded, setIsCouponExpanded] = useState(false);
    const [isPriceDetailsExpanded, setIsPriceDetailsExpanded] = useState(true);

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

    // Get selected shipping method details
    const getShippingMethodDetails = () => {
        if (!selectedShippingMethod || !shippingMethods) return null;
        
        for (const carrier of Object.values(shippingMethods)) {
            const rate = carrier.rates.find(r => 
                `${r.carrier}_${r.method}` === selectedShippingMethod
            );
            if (rate) return rate;
        }
        return null;
    };

    // Get selected payment method details
    const getPaymentMethodDetails = () => {
        if (!selectedPaymentMethod || !paymentMethods) return null;
        return paymentMethods.find(p => p.method === selectedPaymentMethod);
    };

    const shippingMethodDetails = getShippingMethodDetails();
    const paymentMethodDetails = getPaymentMethodDetails();
    const hasDiscount = cart.discount_amount > 0;

    const renderAddress = (address: CheckoutAddress | null, title: string) => {
        if (!address) return null;

        return (
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>{title}</Text>
                <Card style={styles.infoCard}>
                    <Text style={styles.addressName}>
                        {address.first_name} {address.last_name}
                    </Text>
                    <Text style={styles.addressText}>{address.address1}</Text>
                    {address.address2 && (
                        <Text style={styles.addressText}>{address.address2}</Text>
                    )}
                    <Text style={styles.addressText}>
                        {address.city}, {address.state} {address.postcode}
                    </Text>
                    <Text style={styles.addressText}>{address.country}</Text>
                    <Text style={styles.addressText}>{address.phone}</Text>
                    <Text style={styles.addressText}>{address.email}</Text>
                </Card>
            </View>
        );
    };

    return (
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.container}>
            {/* Billing Address */}
            {renderAddress(billingAddress, t('address.billingAddress'))}

            {/* Shipping Address (if different) */}
            {!sameAsBilling && renderAddress(shippingAddress, t('address.shippingAddress'))}

            {/* Shipping Method */}
            {shippingMethodDetails && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>
                        {t('checkout.shippingMethod', 'Shipping Method')}
                    </Text>
                    <Card style={styles.infoCard}>
                        <View style={styles.methodRow}>
                            <View style={styles.methodInfo}>
                                <Text style={styles.methodTitle}>
                                    {shippingMethodDetails.method_title}
                                </Text>
                                {shippingMethodDetails.method_description && (
                                    <Text style={styles.methodDescription}>
                                        {shippingMethodDetails.method_description}
                                    </Text>
                                )}
                            </View>
                            <Text style={styles.methodPrice}>
                                {shippingMethodDetails.formatted_price}
                            </Text>
                        </View>
                    </Card>
                </View>
            )}

            {/* Payment Method */}
            {paymentMethodDetails && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>
                        {t('checkout.paymentMethod', 'Payment Method')}
                    </Text>
                    <Card style={styles.infoCard}>
                        <Text style={styles.methodTitle}>
                            {paymentMethodDetails.method_title}
                        </Text>
                        {paymentMethodDetails.description && (
                            <Text style={styles.methodDescription}>
                                {paymentMethodDetails.description}
                            </Text>
                        )}
                    </Card>
                </View>
            )}

            {/* Order Summary */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                    {t('checkout.orderSummary', 'Order Summary')}
                </Text>
                
                {cart.items.map((item) => (
                    <Card key={item.id} style={styles.productCard}>
                        <View style={styles.productRow}>
                            <ProductImage
                                imageUrl={item.product.thumbnail}
                                style={styles.productImage}
                                recyclingKey={item.product_id?.toString()}
                                priority="normal"
                            />
                            <View style={styles.productDetails}>
                                <Text style={styles.productName} numberOfLines={2}>
                                    {item.name}
                                </Text>
                                <View style={styles.productMeta}>
                                    <Text style={styles.productQty}>
                                        {t('checkout.qty', 'Qty')}: {item.quantity}
                                    </Text>
                                    <Text style={styles.productPrice}>
                                        {formatters.formatPrice(item.price)}
                                    </Text>
                                </View>
                                <Text style={styles.productSubtotal}>
                                    {t('cart.subtotal')}: {formatters.formatPrice(item.total)}
                                </Text>
                            </View>
                        </View>
                    </Card>
                ))}
            </View>

            {/* Apply Coupon Section */}
            {/* <View style={styles.expansionSection}>
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
                                    value={couponCode}
                                    onChangeText={setCouponCode}
                                    autoCapitalize="characters"
                                    editable={!isApplyingCoupon}
                                />
                                <TouchableOpacity
                                    style={[
                                        styles.applyButton,
                                        isApplyingCoupon && styles.applyButtonDisabled,
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
            </View> */}

            {/* Price Details Section */}
            <View style={styles.expansionSection}>
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
                        {/* Subtotal */}
                        <View style={styles.priceRow}>
                            <Text style={styles.priceLabel}>{t('cart.subtotal')}</Text>
                            <Text style={styles.priceValue}>
                                {cart.formatted_sub_total || formatters.formatPrice(cart.sub_total)}
                            </Text>
                        </View>

                        {/* Discount */}
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

                        {/* Shipping */}
                        {shippingMethodDetails && (
                            <View style={styles.priceRow}>
                                <Text style={styles.priceLabel}>{t('cart.shipping')}</Text>
                                <Text style={styles.priceValue}>
                                    {shippingMethodDetails.formatted_price}
                                </Text>
                            </View>
                        )}

                        {/* Tax */}
                        <View style={styles.priceRow}>
                            <Text style={styles.priceLabel}>{t('cart.tax')}</Text>
                            <Text style={styles.priceValue}>
                                {cart.formatted_tax_total || formatters.formatPrice(cart.tax_total)}
                            </Text>
                        </View>

                        {/* Divider */}
                        <View style={styles.divider} />

                        {/* Grand Total */}
                        <View style={styles.priceRow}>
                            <Text style={styles.totalLabel}>{t('cart.grandTotal')}</Text>
                            <Text style={styles.totalValue}>
                                {cart.formatted_grand_total || formatters.formatPrice(cart.grand_total)}
                            </Text>
                        </View>
                    </View>
                )}
            </View>

            {/* Place Order Button */}
            <Button
                title={t('checkout.placeOrder', 'Place Order')}
                onPress={onPlaceOrder}
                disabled={isProcessing}
                loading={isProcessing}
                style={styles.placeOrderButton}
            />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    scrollView: {
        flex: 1,
    },
    container: {
        padding: theme.spacing.md,
        paddingBottom: theme.spacing.xxl,
    },
    section: {
        marginBottom: theme.spacing.lg,
    },
    sectionTitle: {
        fontSize: theme.typography.fontSize.md,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.sm,
    },
    infoCard: {
        padding: theme.spacing.md,
    },
    addressName: {
        fontSize: theme.typography.fontSize.md,
        fontWeight: theme.typography.fontWeight.semiBold,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.xs,
    },
    addressText: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.text.secondary,
        marginBottom: 2,
    },
    methodRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    methodInfo: {
        flex: 1,
    },
    methodTitle: {
        fontSize: theme.typography.fontSize.md,
        fontWeight: theme.typography.fontWeight.semiBold,
        color: theme.colors.text.primary,
    },
    methodDescription: {
        fontSize: theme.typography.fontSize.xs,
        color: theme.colors.text.secondary,
        marginTop: 2,
    },
    methodPrice: {
        fontSize: theme.typography.fontSize.md,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.primary[500],
        marginLeft: theme.spacing.md,
    },
    productCard: {
        padding: theme.spacing.md,
        marginBottom: theme.spacing.sm,
    },
    productRow: {
        flexDirection: 'row',
    },
    productImage: {
        width: 60,
        height: 60,
        borderRadius: theme.borderRadius.sm,
        backgroundColor: theme.colors.gray[100],
        marginRight: theme.spacing.md,
    },
    productDetails: {
        flex: 1,
    },
    productName: {
        fontSize: theme.typography.fontSize.sm,
        fontWeight: theme.typography.fontWeight.medium,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.xs,
    },
    productMeta: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: theme.spacing.xs,
    },
    productQty: {
        fontSize: theme.typography.fontSize.xs,
        color: theme.colors.text.secondary,
    },
    productPrice: {
        fontSize: theme.typography.fontSize.sm,
        fontWeight: theme.typography.fontWeight.semiBold,
        color: theme.colors.primary[500],
    },
    productSubtotal: {
        fontSize: theme.typography.fontSize.xs,
        color: theme.colors.text.secondary,
    },
    expansionSection: {
        backgroundColor: theme.colors.white,
        borderRadius: theme.borderRadius.lg,
        overflow: 'hidden',
        marginBottom: theme.spacing.md,
        ...theme.shadows.sm,
    },
    expansionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: theme.spacing.md,
        backgroundColor: theme.colors.white,
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
        backgroundColor: theme.colors.white,
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
    divider: {
        height: 1,
        backgroundColor: theme.colors.gray[200],
        marginVertical: theme.spacing.sm,
    },
    totalLabel: {
        fontSize: theme.typography.fontSize.lg,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.text.primary,
    },
    totalValue: {
        fontSize: theme.typography.fontSize.lg,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.primary[500],
    },
    placeOrderButton: {
        marginTop: theme.spacing.xl,
    },
});

