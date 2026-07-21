/**
 * CheckoutScreen Component
 * Main checkout flow with multi-step process
 */

import { addressApi } from '@/services/api/address.api';
import { checkoutApi } from '@/services/api/checkout.api';
import { TopHeader } from '@/shared/components';
import { Button } from '@/shared/components/Button';
import { LoadingSpinner } from '@/shared/components/LoadingSpinner';
import { useToast } from '@/shared/components/Toast';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchCartThunk } from '@/store/slices/cartSlice';
import { theme } from '@/theme';
import { formatters } from '@/shared/utils/formatters';
import { useRouter } from 'expo-router';
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AddressStep } from '../components/AddressStep';
import { CheckoutStepper } from '../components/CheckoutStepper';
import { PaymentStep } from '../components/PaymentStep';
import { PaypalSmartButtonWebView } from '../components/PaypalSmartButtonWebView';
import { ReviewStep } from '../components/ReviewStep';
import { ShippingStep } from '../components/ShippingStep';
import { StripeConnectWebView } from '../components/StripeConnectWebView';
import { PriceDetailsSummaryCard } from '@/features/cart/components/PriceDetailsSummaryCard';
import {
    CheckoutAddress,
    CheckoutStep,
    ShippingRate,
    PaymentMethod,
    ShippingMethod,
} from '../types/checkout.types';

const STEP_ORDER: CheckoutStep[] = ['address', 'shipping', 'payment', 'review'];

const findSelectedShippingRate = (
    selectedMethod: string | null,
    shippingMethods: Record<string, ShippingMethod> | null
): ShippingRate | null => {
    if (!selectedMethod || !shippingMethods) return null;
    for (const carrier of Object.values(shippingMethods)) {
        const rate = carrier.rates?.find((r) => `${r.carrier}_${r.method}` === selectedMethod);
        if (rate) {
            return rate;
        }
    }
    return null;
};

export const CheckoutScreen: React.FC = () => {
    const { t } = useTranslation();
    const router = useRouter();
    const dispatch = useAppDispatch();
    const { showToast } = useToast();
    const { cart, isLoading } = useAppSelector((state) => state.cart);
    const { isAuthenticated } = useAppSelector((state) => state.auth);
    const insets = useSafeAreaInsets();

    const [currentStep, setCurrentStep] = useState<CheckoutStep>('address');
    const [completedSteps, setCompletedSteps] = useState<CheckoutStep[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isDefaultAddressLoading, setIsDefaultAddressLoading] = useState(true);
    const [hasLoadedCartOnce, setHasLoadedCartOnce] = useState(false);

    // Address state
    const [billingAddress, setBillingAddress] = useState<CheckoutAddress | null>(null);
    const [shippingAddress, setShippingAddress] = useState<CheckoutAddress | null>(null);
    const [sameAsBilling, setSameAsBilling] = useState(true);

    // Shipping state
    const [shippingMethods, setShippingMethods] = useState<Record<string, ShippingMethod> | null>(null);
    const [selectedShippingMethod, setSelectedShippingMethod] = useState<string | null>(null);

    // Payment state
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[] | null>(null);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);

    // Stripe Connect WebView state
    const [showStripeWebView, setShowStripeWebView] = useState(false);
    const [stripeCheckoutUrl, setStripeCheckoutUrl] = useState<string | null>(null);

    // PayPal Smart Button WebView state
    const [showPaypalWebView, setShowPaypalWebView] = useState(false);
    const [paypalApprovalUrl, setPaypalApprovalUrl] = useState<string | null>(null);
    const [paypalOrderId, setPaypalOrderId] = useState<string | null>(null);
    const scrollViewRef = useRef<ScrollView | null>(null);
    const stepPositionsRef = useRef<Record<CheckoutStep, number>>({});
    const [reviewSummaryHeight, setReviewSummaryHeight] = useState(0);

    const resetShippingAndBeyond = () => {
        setShippingMethods(null);
        setSelectedShippingMethod(null);
        setPaymentMethods(null);
        setSelectedPaymentMethod(null);
    };

    const handleStepLayout = (step: CheckoutStep, y: number) => {
        stepPositionsRef.current[step] = y;
        if (currentStep === step) {
            scrollViewRef.current?.scrollTo({ y, animated: true });
        }
    };

    const shippingMethodDetails = useMemo(
        () => findSelectedShippingRate(selectedShippingMethod, shippingMethods),
        [selectedShippingMethod, shippingMethods]
    );

    const resetStepsAfter = (step: CheckoutStep) => {
        const stepIndex = STEP_ORDER.indexOf(step);
        if (stepIndex === -1) return;
        setCompletedSteps((prev) =>
            prev.filter((stepKey) => STEP_ORDER.indexOf(stepKey) < stepIndex)
        );
    };

    const handleSameAsBillingChange = (value: boolean) => {
        setSameAsBilling(value);
        if (value && billingAddress) {
            setShippingAddress(billingAddress);
        } else if (!value) {
            setShippingAddress(null);
        }
        resetShippingAndBeyond();
        resetStepsAfter('address');
        setCurrentStep('address');
    };

    const handleAddressUpdate = (type: 'billing' | 'shipping', address: CheckoutAddress) => {
        if (type === 'billing') {
            setBillingAddress(address);
            if (sameAsBilling) {
                setShippingAddress(address);
            }
        } else {
            setShippingAddress(address);
        }
        resetShippingAndBeyond();
        // If we are in a later step, go back to address step
        if (STEP_ORDER.indexOf(currentStep) > STEP_ORDER.indexOf('address')) {
            setCurrentStep('address');
            resetStepsAfter('address');
        }
    };

    const handleShippingMethodSelect = (method: string) => {
        setSelectedShippingMethod(method);
        // If we are in a later step, go back to shipping step and reset subsequent steps
        if (STEP_ORDER.indexOf(currentStep) > STEP_ORDER.indexOf('shipping')) {
            setCurrentStep('shipping');
            resetStepsAfter('shipping');
        }
    };

    const handlePaymentMethodSelect = (method: string) => {
        setSelectedPaymentMethod(method);
        // If we are in a later step (review), go back to payment step
        if (STEP_ORDER.indexOf(currentStep) > STEP_ORDER.indexOf('payment')) {
            setCurrentStep('payment');
            resetStepsAfter('payment');
        }
    };

    useEffect(() => {
        // Redirect if not authenticated
        if (!isAuthenticated) {
            setIsDefaultAddressLoading(false);
            showToast({ message: t('checkout.loginRequired', 'Please login to checkout'), type: 'error' });
            router.replace('/login');
            return;
        }

        // Load cart and addresses
        loadCheckoutData();
    }, [isAuthenticated]);

    // Redirect to cart if empty
    useEffect(() => {
        if (!isLoading && cart && cart.items.length === 0) {
            router.replace('/cart');
        }
    }, [cart, isLoading, router]);

    useEffect(() => {
        if (cart && !hasLoadedCartOnce) {
            setHasLoadedCartOnce(true);
        }
    }, [cart, hasLoadedCartOnce]);

    useEffect(() => {
        const targetY = stepPositionsRef.current[currentStep];
        if (typeof targetY === 'number') {
            scrollViewRef.current?.scrollTo({ y: targetY, animated: true });
        }
    }, [currentStep]);

    const loadCheckoutData = async () => {
        setIsDefaultAddressLoading(true);
        try {
            // Load cart
            await dispatch(fetchCartThunk()).unwrap();

            // Load customer addresses
            const addresses = await addressApi.getAddresses();

            // Find default address
            const defaultAddress = addresses.find((addr: any) => addr.is_default || addr.default_address);

            if (defaultAddress) {
                // Convert to CheckoutAddress format
                const addressLines = Array.isArray(defaultAddress.address)
                    ? defaultAddress.address
                    : (defaultAddress.address ? String(defaultAddress.address).split('\n') : []);

                const checkoutAddress: CheckoutAddress = {
                    id: defaultAddress.id,
                    first_name: defaultAddress.first_name,
                    last_name: defaultAddress.last_name,
                    email: defaultAddress.email || '',
                    address1: addressLines[0] || '',
                    address2: addressLines[1] || '',
                    city: defaultAddress.city,
                    state: defaultAddress.state,
                    country: defaultAddress.country,
                    postcode: defaultAddress.postcode,
                    phone: defaultAddress.phone,
                };

                setBillingAddress(checkoutAddress);
                // Also set as shipping by default
                setShippingAddress(checkoutAddress);
            }
        } catch (error) {
            console.error('Error loading checkout data:', error);
        } finally {
            setIsDefaultAddressLoading(false);
        }
    };

    const handleAddressComplete = async () => {
        if (!billingAddress) {
            showToast({ message: t('checkout.billingAddressRequired', 'Billing address is required'), type: 'error' });
            return;
        }

        if (!sameAsBilling && !shippingAddress) {
            showToast({ message: t('checkout.shippingAddressRequired', 'Shipping address is required'), type: 'error' });
            return;
        }

        setIsProcessing(true);
        try {
            // Transform address format: backend expects 'address' as array, not address1/address2
            // Also remove 'id' field as it's not needed for cart addresses (only for customer addresses)
            const transformAddress = (addr: CheckoutAddress) => {
                const { id, address1, address2, ...rest } = addr;
                return {
                    ...rest,
                    address: [address1, address2].filter(Boolean), // Convert to array format
                };
            };

            const payload: any = {
                billing: {
                    ...transformAddress(billingAddress),
                    use_for_shipping: sameAsBilling,
                },
                ...(sameAsBilling ? {} : { shipping: transformAddress(shippingAddress!) }),
            };

            console.log('[CheckoutScreen] Sending address payload:', JSON.stringify(payload, null, 2));

            const response = await checkoutApi.saveAddress(payload);
            console.log('[CheckoutScreen] Response received:', response);

            // REST API returns 'rates' array: [{ carrier_title: "...", rates: [...] }, ...]
            if (response.rates && response.rates.length > 0) {
                // Transform rates array to shippingMethods object
                // Expected format: { "carrier_code": { carrier_title: "...", rates: [...] }, ... }
                const shippingMethods: Record<string, any> = {};
                response.rates.forEach((carrierData: any, index: number) => {
                    // Use index or a sanitized version of carrier_title as key
                    const carrierKey = `carrier_${index}`;
                    shippingMethods[carrierKey] = {
                        carrier_title: carrierData.carrier_title,
                        rates: carrierData.rates || []
                    };
                });

                console.log('[CheckoutScreen] Transformed shipping methods:', shippingMethods);
                setShippingMethods(shippingMethods);
                markStepComplete('address');
                setCurrentStep('shipping');
            } else {
                // No shipping rates means either error or virtual products
                showToast({ message: t('checkout.noShippingMethods', 'No shipping methods available'), type: 'error' });
            }
        } catch (error: any) {
            showToast({ message: error.message || t('checkout.addressSaveFailed'), type: 'error' });
        } finally {
            setIsProcessing(false);
        }
    };

    const handleShippingComplete = async () => {
        if (!selectedShippingMethod) {
            showToast({ message: t('checkout.selectShippingMethod', 'Please select a shipping method'), type: 'error' });
            return;
        }

        console.log('[CheckoutScreen] Selected shipping method (composite key):', selectedShippingMethod);

        // Extract actual method code by stripping the "carrier_N_" prefix that ShippingStep
        // adds for uniqueness. The composite key is: `carrier_${index}_${rate.method}`.
        // rate.method is the full backend code (e.g. "skydropxshipping_sk-paquetexpress_sin_recoleccion"),
        // so we must remove only the leading "carrier_N_" part, not split/slice from the end.
        const actualMethodCode = selectedShippingMethod.replace(/^carrier_\d+_/, '');

        console.log('[CheckoutScreen] Actual method code to send:', actualMethodCode);

        setIsProcessing(true);
        try {
            const response = await checkoutApi.saveShipping({
                shipping_method: actualMethodCode,
            });

            console.log('[CheckoutScreen] Shipping save response:', response);

            // Refresh cart to update totals (especially shipping amount)
            await dispatch(fetchCartThunk()).unwrap();

            // REST API returns 'methods' instead of 'payment_methods'
            setPaymentMethods(response.methods || []);
            markStepComplete('shipping');
            setCurrentStep('payment');
        } catch (error: any) {
            console.error('[CheckoutScreen] Shipping save error:', error);
            showToast({ message: error.message || t('checkout.shippingSaveFailed', 'Failed to save shipping method'), type: 'error' });
        } finally {
            setIsProcessing(false);
        }
    };

    const handlePaymentComplete = async () => {
        if (!selectedPaymentMethod) {
            showToast({ message: t('checkout.selectPaymentMethod', 'Please select a payment method'), type: 'error' });
            return;
        }

        setIsProcessing(true);
        try {
            await checkoutApi.savePayment({
                payment: {
                    method: selectedPaymentMethod,
                },
            });

            // Reload cart with updated totals
            await dispatch(fetchCartThunk()).unwrap();

            markStepComplete('payment');
            setCurrentStep('review');
        } catch (error: any) {
            showToast({ message: error.message || t('checkout.paymentSaveFailed'), type: 'error' });
        } finally {
            setIsProcessing(false);
        }
    };

    const handlePlaceOrder = async () => {
        if (isProcessing) return;
        setIsProcessing(true);
        try {
            // console.log('[CheckoutScreen] Starting place order...');
            const response = await checkoutApi.placeOrder();

            // console.log('[CheckoutScreen] Place order response received:', JSON.stringify(response, null, 2));
            // console.log('[CheckoutScreen] Response analysis:', {
            //     hasRedirectUrl: !!response.redirect_url,
            //     redirectUrl: response.redirect_url,
            //     hasData: !!response.data,
            //     hasOrder: !!(response.data?.order || response.order),
            //     orderId: response.data?.order?.id || response.order?.id
            // });

            // Handle redirect URL (for payment methods that require external payment)
            if (response.redirect_url) {
                // console.log('[CheckoutScreen] Redirect URL detected:', response.redirect_url);

                // Check if it's PayPal Smart Button (paypal.com URL)
                const isPaypalSmartButton = response.redirect_url.includes('paypal.com') &&
                    response.paypal_order_id;

                if (isPaypalSmartButton) {
                    // For PayPal Smart Button, show WebView to complete payment
                    setPaypalApprovalUrl(response.redirect_url);
                    setPaypalOrderId(response.paypal_order_id);
                    setShowPaypalWebView(true);
                    setIsProcessing(false);
                    return;
                }

                // Check if it's Stripe Connect (checkout.stripe.com URL)
                const isStripeConnect = response.redirect_url.includes('checkout.stripe.com') ||
                    response.redirect_url.includes('stripe.com');

                if (isStripeConnect) {
                    // For Stripe Connect, show WebView to complete payment
                    setStripeCheckoutUrl(response.redirect_url);
                    setShowStripeWebView(true);
                    setIsProcessing(false);
                    return;
                }

                // For other payment methods like OXXO, order is created during redirect
                // Check if order is in response.data.order
                const order = response.data?.order || response.order;
                console.log('[CheckoutScreen] OXXO/Other redirect - Order:', order);
                if (order?.id) {
                    console.log('[CheckoutScreen] Navigating to order success:', order.id);
                    // Clear cart
                    await dispatch(fetchCartThunk()).unwrap();
                    showToast({
                        message: t('checkout.orderPlaced', 'Order placed successfully!'),
                        type: 'success',
                        duration: 3000,
                    });
                    router.replace(`/order-success/${order.id}`);
                } else {
                    console.warn('[CheckoutScreen] No order ID in redirect response, navigating to orders list');
                    // If no order ID, navigate to orders page
                    router.replace('/orders');
                }
            } else {
                // Normal flow - order is in response
                const order = response.data?.order || response.order;
                console.log('[CheckoutScreen] Normal flow - Order:', order);
                if (order?.id) {
                    console.log('[CheckoutScreen] Navigating to order success:', order.id);
                    // Clear cart and show success message
                    await dispatch(fetchCartThunk()).unwrap();
                    showToast({
                        message: t('checkout.orderPlaced', 'Order placed successfully!'),
                        type: 'success',
                        duration: 3000,
                    });
                    router.replace(`/order-success/${order.id}`);
                } else {
                    console.error('[CheckoutScreen] No order ID found in response!', {
                        response,
                        dataOrder: response.data?.order,
                        order: response.order
                    });
                    // Fallback: navigate to orders page if no order ID
                    showToast({
                        message: t('checkout.orderPlaced', 'Order placed successfully!'),
                        type: 'info',
                        duration: 3000,
                    });
                    router.replace('/orders');
                }
            }
        } catch (error: any) {
            console.error('[CheckoutScreen] Place order error:', error);
            console.error('[CheckoutScreen] Error details:', {
                message: error.message,
                response: error.response?.data,
                stack: error.stack
            });
            showToast({
                message: error.message || t('checkout.orderFailed', 'Failed to place order'),
                type: 'error',
                duration: 4000,
            });
        } finally {
            setIsProcessing(false);
        }
    };

    const addressStepReady = Boolean(billingAddress && (sameAsBilling || shippingAddress));
    const shippingStepReady = Boolean(selectedShippingMethod);
    const paymentStepReady = Boolean(selectedPaymentMethod);

    const getActionButtonTitle = () => {
        switch (currentStep) {
            case 'address':
                return t('checkout.proceedToShipping', 'Proceed to Shipping');
            case 'shipping':
                return t('checkout.proceedToPayment', 'Proceed to Payment');
            case 'payment':
                return t('checkout.proceedToReview', 'Proceed to Review');
            case 'review':
                return t('checkout.placeOrder', 'Place Order');
            default:
                return t('checkout.proceed', 'Proceed');
        }
    };

    const isActionButtonDisabled = () => {
        if (isProcessing) return true;

        switch (currentStep) {
            case 'address':
                return !addressStepReady;
            case 'shipping':
                return !shippingStepReady;
            case 'payment':
                return !paymentStepReady;
            case 'review':
                return false;
            default:
                return true;
        }
    };

    const handleActionButtonPress = () => {
        if (isProcessing) return;

        switch (currentStep) {
            case 'address':
                handleAddressComplete();
                break;
            case 'shipping':
                handleShippingComplete();
                break;
            case 'payment':
                handlePaymentComplete();
                break;
            case 'review':
                handlePlaceOrder();
                break;
        }
    };

    const handleStripeSuccess = async (orderId: number) => {
        // Close WebView
        setShowStripeWebView(false);
        setStripeCheckoutUrl(null);

        // Clear cart
        await dispatch(fetchCartThunk()).unwrap();

        // Navigate to order success screen
        router.replace(`/order-success/${orderId}`);
    };

    const handleStripeCancel = () => {
        setShowStripeWebView(false);
        setStripeCheckoutUrl(null);
        setIsProcessing(false);
    };

    const handleStripeError = (error: string) => {
        setShowStripeWebView(false);
        setStripeCheckoutUrl(null);
        setIsProcessing(false);
        // Error toast is already shown in WebView component
    };

    const handlePaypalSuccess = async (orderId: number) => {
        // Close WebView
        setShowPaypalWebView(false);
        setPaypalApprovalUrl(null);
        setPaypalOrderId(null);

        // Clear cart
        await dispatch(fetchCartThunk()).unwrap();

        // Navigate to order success screen
        router.replace(`/order-success/${orderId}`);
    };

    const handlePaypalCancel = () => {
        setShowPaypalWebView(false);
        setPaypalApprovalUrl(null);
        setPaypalOrderId(null);
        setIsProcessing(false);
    };

    const handlePaypalError = (error: string) => {
        setShowPaypalWebView(false);
        setPaypalApprovalUrl(null);
        setPaypalOrderId(null);
        setIsProcessing(false);
        // Error toast is already shown in WebView component
    };

    const markStepComplete = (step: CheckoutStep) => {
        if (!completedSteps.includes(step)) {
            setCompletedSteps([...completedSteps, step]);
        }
    };

    const isCartReady = Boolean(cart && cart.items.length > 0);
    const subtotalValue =
        cart?.formatted_sub_total ||
        formatters.formatPrice(cart?.sub_total || cart?.base_sub_total || 0);
    const taxValue =
        cart?.formatted_tax_total ||
        formatters.formatPrice(cart?.tax_total || cart?.base_tax_total || 0);
    const hasDiscount = Number(cart?.discount || 0) !== 0;
    const discountValue = hasDiscount
        ? cart?.formatted_discount ||
        formatters.formatPrice(cart?.discount || cart?.base_discount || 0)
        : undefined;
    const shippingValue =
        shippingMethodDetails?.formatted_price ||
        shippingMethodDetails?.base_formatted_price ||
        cart?.selected_shipping_rate?.formatted_price ||
        cart?.formatted_shipping_amount ||
        (cart?.shipping_amount !== undefined
            ? formatters.formatPrice(cart.shipping_amount)
            : undefined) ||
        (shippingMethodDetails?.price !== undefined
            ? formatters.formatPrice(shippingMethodDetails.price)
            : undefined);
    const grandTotalValue =
        cart?.formatted_grand_total ||
        formatters.formatPrice(cart?.grand_total || cart?.base_grand_total || 0);
    const headerTitle = t('cart.checkout', 'Checkout');
    const scrollContentStyle = [
        styles.scrollContent,
        currentStep === 'review'
            ? { paddingBottom: reviewSummaryHeight || theme.spacing.lg }
            : undefined,
    ];

    return (
        <View style={styles.container}>
            <TopHeader
                title={headerTitle}
                onBack={() => router.back()}
                backgroundColor={theme.colors.background.default}
            />
            {(!hasLoadedCartOnce && (isLoading || !isCartReady || isDefaultAddressLoading)) ? (
                <View style={styles.loaderWrapper}>
                    <LoadingSpinner />
                </View>
            ) : (
                <ScrollView
                    ref={scrollViewRef}
                    style={styles.scrollView}
                    contentContainerStyle={scrollContentStyle}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Vertical Stepper with inline step content */}
                    <CheckoutStepper
                        currentStep={currentStep}
                        completedSteps={completedSteps}
                        onStepLayout={handleStepLayout}
                    >
                        {/* Address Step */}
                        <AddressStep
                            billingAddress={billingAddress}
                            shippingAddress={shippingAddress}
                            sameAsBilling={sameAsBilling}
                            onSameAsBillingChange={handleSameAsBillingChange}
                            onAddressUpdate={handleAddressUpdate}
                            isDefaultAddressLoading={isDefaultAddressLoading}
                        />

                        {/* Shipping Step */}
                        <ShippingStep
                            cart={cart}
                            shippingMethods={shippingMethods}
                            selectedMethod={selectedShippingMethod}
                            onMethodSelect={handleShippingMethodSelect}
                        />

                        {/* Payment Step */}
                        <PaymentStep
                            paymentMethods={paymentMethods}
                            selectedMethod={selectedPaymentMethod}
                            onMethodSelect={handlePaymentMethodSelect}
                        />

                        {/* Review Step */}
                        <ReviewStep
                            cart={cart}
                            billingAddress={billingAddress}
                            shippingAddress={shippingAddress}
                            sameAsBilling={sameAsBilling}
                            selectedShippingMethod={selectedShippingMethod}
                            shippingMethodDetails={shippingMethodDetails}
                            selectedPaymentMethod={selectedPaymentMethod}
                            paymentMethods={paymentMethods}
                            isProcessing={isProcessing}
                            onEditStep={setCurrentStep}
                        />
                    </CheckoutStepper>
                </ScrollView>
            )}

            {currentStep === 'review' && isCartReady && cart && (
                <View
                    style={[
                        styles.reviewSummaryFixed,
                        { paddingBottom: Math.max(insets.bottom, theme.spacing.md) },
                    ]}
                    onLayout={({ nativeEvent }) => {
                        const height = nativeEvent.layout.height;
                        if (reviewSummaryHeight !== height) {
                            setReviewSummaryHeight(height);
                        }
                    }}
                >
                    <PriceDetailsSummaryCard
                        subtotal={subtotalValue}
                        tax={taxValue}
                        discount={discountValue}
                        couponCode={discountValue ? cart.coupon_code : undefined}
                        shipping={shippingValue}
                        grandTotal={grandTotalValue}
                        onCheckoutPress={handlePlaceOrder}
                        buttonText={t('checkout.placeOrder', 'Place Order')}
                        loading={isProcessing}
                        disabled={isProcessing}
                    />
                </View>
            )}

            {currentStep !== 'review' && isCartReady && (
                <View style={[styles.actionButtonContainer, { paddingBottom: Math.max(insets.bottom, theme.spacing.md) }]}>
                    <Button
                        title={getActionButtonTitle()}
                        onPress={handleActionButtonPress}
                        disabled={isActionButtonDisabled()}
                        loading={isProcessing}
                    />
                </View>
            )}

            {/* Stripe Connect WebView Modal */}
            {stripeCheckoutUrl && (
                <StripeConnectWebView
                    visible={showStripeWebView}
                    checkoutUrl={stripeCheckoutUrl}
                    onSuccess={handleStripeSuccess}
                    onCancel={handleStripeCancel}
                    onError={handleStripeError}
                />
            )}

            {/* PayPal Smart Button WebView Modal */}
            {paypalApprovalUrl && paypalOrderId && (
                <PaypalSmartButtonWebView
                    visible={showPaypalWebView}
                    approvalUrl={paypalApprovalUrl}
                    paypalOrderId={paypalOrderId}
                    onSuccess={handlePaypalSuccess}
                    onCancel={handlePaypalCancel}
                    onError={handlePaypalError}
                />
            )}
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
        flexGrow: 1,
    },
    actionButtonContainer: {
        padding: theme.spacing.md,
        borderTopWidth: 1,
        borderTopColor: theme.colors.gray[200],
        backgroundColor: theme.colors.background.default,
    },
    loaderWrapper: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    reviewSummaryFixed: {
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
});
