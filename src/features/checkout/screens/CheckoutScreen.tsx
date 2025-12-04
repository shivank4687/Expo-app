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
                const checkoutAddress: CheckoutAddress = {
                    id: defaultAddress.id,
                    first_name: defaultAddress.first_name,
                    last_name: defaultAddress.last_name,
                    email: defaultAddress.email,
                    address1: Array.isArray(defaultAddress.address) 
                        ? defaultAddress.address[0] 
                        : defaultAddress.address?.split('\n')[0] || '',
                    address2: Array.isArray(defaultAddress.address) 
                        ? defaultAddress.address[1] 
                        : defaultAddress.address?.split('\n')[1],
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
            const payload = {
                billing: {
                    ...billingAddress,
                    use_for_shipping: sameAsBilling,
                },
                ...(sameAsBilling ? {} : { shipping: shippingAddress! }),
            };

            const response = await checkoutApi.saveAddress(payload);

            // If cart has stockable items, show shipping methods
            if (response.shippingMethods) {
                setShippingMethods(response.shippingMethods);
                markStepComplete('address');
                setCurrentStep('shipping');
            } else if (response.payment_methods) {
                // No shipping needed, go directly to payment
                setPaymentMethods(response.payment_methods);
                markStepComplete('address');
                markStepComplete('shipping'); // Skip shipping
                setCurrentStep('payment');
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

        setIsProcessing(true);
        try {
            const response = await checkoutApi.saveShipping({
                shipping_method: selectedShippingMethod,
            });

            setPaymentMethods(response.payment_methods);
            markStepComplete('shipping');
            setCurrentStep('payment');
        } catch (error: any) {
            showToast({ message: error.message || t('checkout.shippingSaveFailed'), type: 'error' });
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

    const handlePlaceOrder = () => {
        Alert.alert(
            t('checkout.placeOrder'),
            t('checkout.comingSoon', 'This feature is coming soon!'),
            [{ text: t('common.ok'), style: 'default' }]
        );

        /* 
        // Actual implementation:
        setIsProcessing(true);
        try {
            const response = await checkoutApi.placeOrder();
            showToast({ message: t('checkout.orderPlaced', 'Order placed successfully!'), type: 'success' });
            router.push(`/order-success/${response.order.id}`);
        } catch (error: any) {
            showToast({ message: error.message || t('checkout.orderFailed'), type: 'error' });
        } finally {
            setIsProcessing(false);
        }
        */
    };

    const markStepComplete = (step: CheckoutStep) => {
        if (!completedSteps.includes(step)) {
            setCompletedSteps([...completedSteps, step]);
        }
    };

    if (isLoading) {
        return <LoadingSpinner />;
    }

    if (!cart || cart.items.length === 0) {
        router.replace('/cart');
        return null;
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

