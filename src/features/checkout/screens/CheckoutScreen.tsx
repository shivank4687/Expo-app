/**
 * CheckoutScreen Component
 * Main checkout flow with multi-step process
 */

import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { theme } from '@/theme';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchCartThunk } from '@/store/slices/cartSlice';
import { checkoutApi } from '@/services/api/checkout.api';
import { addressApi } from '@/services/api/address.api';
import { LoadingSpinner } from '@/shared/components/LoadingSpinner';
import { useToast } from '@/shared/components/Toast';
import { CheckoutStepper } from '../components/CheckoutStepper';
import { AddressStep } from '../components/AddressStep';
import { ShippingStep } from '../components/ShippingStep';
import { PaymentStep } from '../components/PaymentStep';
import { ReviewStep } from '../components/ReviewStep';
import { StripeConnectWebView } from '../components/StripeConnectWebView';
import { PaypalSmartButtonWebView } from '../components/PaypalSmartButtonWebView';
import {
    CheckoutStep,
    CheckoutAddress,
    ShippingMethod,
    PaymentMethod,
} from '../types/checkout.types';

export const CheckoutScreen: React.FC = () => {
    const { t } = useTranslation();
    const router = useRouter();
    const dispatch = useAppDispatch();
    const { showToast } = useToast();
    const { cart, isLoading } = useAppSelector((state) => state.cart);
    const { isAuthenticated } = useAppSelector((state) => state.auth);

    const [currentStep, setCurrentStep] = useState<CheckoutStep>('address');
    const [completedSteps, setCompletedSteps] = useState<CheckoutStep[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);

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

    useEffect(() => {
        // Redirect if not authenticated
        if (!isAuthenticated) {
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

    const loadCheckoutData = async () => {
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

            const payload :any= {
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

        // Extract actual method code from composite key (e.g., "carrier_0_flat_flat" -> "flat_flat")
        // ShippingStep creates keys as: ${carrierCode}_${rate.method}
        // We need to extract the rate.method part which is after the last underscore
        const parts = selectedShippingMethod.split('_');
        // For "carrier_0_flat_flat", we need "flat_flat" (last 2 parts)
        const actualMethodCode = parts.length >= 2 ? parts.slice(-2).join('_') : selectedShippingMethod;
        
        console.log('[CheckoutScreen] Actual method code to send:', actualMethodCode);

        setIsProcessing(true);
        try {
            const response = await checkoutApi.saveShipping({
                shipping_method: actualMethodCode,
            });

            console.log('[CheckoutScreen] Shipping save response:', response);

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
        setIsProcessing(true);
        try {
            console.log('[CheckoutScreen] Starting place order...');
            const response = await checkoutApi.placeOrder();
            
            console.log('[CheckoutScreen] Place order response received:', JSON.stringify(response, null, 2));
            console.log('[CheckoutScreen] Response analysis:', {
                hasRedirectUrl: !!response.redirect_url,
                redirectUrl: response.redirect_url,
                hasData: !!response.data,
                hasOrder: !!(response.data?.order || response.order),
                orderId: response.data?.order?.id || response.order?.id
            });
            
            // Handle redirect URL (for payment methods that require external payment)
            if (response.redirect_url) {
                console.log('[CheckoutScreen] Redirect URL detected:', response.redirect_url);
                
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

    if (isLoading || !cart || cart.items.length === 0) {
        return <LoadingSpinner />;
    }

    return (
        <View style={styles.container}>
            {/* Stepper */}
            <CheckoutStepper
                currentStep={currentStep}
                completedSteps={completedSteps}
            />

            {/* Step Content */}
            <View style={styles.content}>
                {currentStep === 'address' && (
                    <AddressStep
                        billingAddress={billingAddress}
                        shippingAddress={shippingAddress}
                        sameAsBilling={sameAsBilling}
                        onSameAsBillingChange={setSameAsBilling}
                        onProceed={handleAddressComplete}
                        onAddressUpdate={(type, address) => {
                            if (type === 'billing') {
                                setBillingAddress(address);
                            } else {
                                setShippingAddress(address);
                            }
                        }}
                        isProcessing={isProcessing}
                    />
                )}

                {currentStep === 'shipping' && (
                    <ShippingStep
                        shippingMethods={shippingMethods}
                        selectedMethod={selectedShippingMethod}
                        onMethodSelect={setSelectedShippingMethod}
                        onProceed={handleShippingComplete}
                        isProcessing={isProcessing}
                    />
                )}

                {currentStep === 'payment' && (
                    <PaymentStep
                        paymentMethods={paymentMethods}
                        selectedMethod={selectedPaymentMethod}
                        onMethodSelect={setSelectedPaymentMethod}
                        onProceed={handlePaymentComplete}
                        isProcessing={isProcessing}
                    />
                )}

                {currentStep === 'review' && (
                    <ReviewStep
                        cart={cart}
                        billingAddress={billingAddress}
                        shippingAddress={shippingAddress}
                        sameAsBilling={sameAsBilling}
                        selectedShippingMethod={selectedShippingMethod}
                        shippingMethods={shippingMethods}
                        selectedPaymentMethod={selectedPaymentMethod}
                        paymentMethods={paymentMethods}
                        onPlaceOrder={handlePlaceOrder}
                        isProcessing={isProcessing}
                    />
                )}
            </View>
            
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
    content: {
        flex: 1,
    },
});

