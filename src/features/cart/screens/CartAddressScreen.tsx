/**
 * CartAddressScreen Component
 * Screen to select, add, and save addresses for the cart session
 */

import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchCartThunk, setSelectedCartAddresses } from '@/store/slices/cartSlice';
import { addressApi } from '@/services/api/address.api';
import { checkoutApi } from '@/services/api/checkout.api';
import { TopHeader } from '@/shared/components';
import { Button } from '@/shared/components/Button';
import { useToast } from '@/shared/components/Toast';
import { theme } from '@/theme';
import { AddressStep } from '@/features/checkout/components/AddressStep';
import { CheckoutAddress } from '@/features/checkout/types/checkout.types';

export const CartAddressScreen: React.FC = () => {
    const { t } = useTranslation();
    const router = useRouter();
    const dispatch = useAppDispatch();
    const { showToast } = useToast();
    const { cart, selectedCartBillingAddress, selectedCartShippingAddress, selectedCartSameAsBilling } = useAppSelector((state) => state.cart);
    const insets = useSafeAreaInsets();

    const [billingAddress, setBillingAddress] = useState<CheckoutAddress | null>(null);
    const [shippingAddress, setShippingAddress] = useState<CheckoutAddress | null>(null);
    const [sameAsBilling, setSameAsBilling] = useState(true);
    const [isDefaultAddressLoading, setIsDefaultAddressLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        loadAddressData();
    }, []);

    const loadAddressData = async () => {
        setIsDefaultAddressLoading(true);
        try {
            // Check if Redux already has selected addresses
            if (selectedCartBillingAddress) {
                setBillingAddress(selectedCartBillingAddress);
                setShippingAddress(selectedCartShippingAddress || selectedCartBillingAddress);
                setSameAsBilling(selectedCartSameAsBilling);
                setIsDefaultAddressLoading(false);
                return;
            }

            // Load customer addresses
            const addresses = await addressApi.getAddresses();

            // Find default address
            const defaultAddress = addresses.find((addr: any) => addr.is_default || addr.default_address);

            const getFlatString = (val: any): string => {
                if (typeof val === 'string') return val;
                if (Array.isArray(val)) return getFlatString(val[0]);
                return '';
            };

            const formatCartAddress = (addr: any): CheckoutAddress => {
                const rawAddress = addr.address || addr.address1 || '';
                const addressLines = Array.isArray(rawAddress)
                    ? rawAddress
                    : (rawAddress ? String(rawAddress).split('\n') : []);

                return {
                    id: addr.id,
                    first_name: addr.first_name,
                    last_name: addr.last_name,
                    email: addr.email || '',
                    address1: getFlatString(addressLines[0]),
                    address2: getFlatString(addressLines[1] || addr.address2),
                    city: addr.city,
                    state: addr.state,
                    country: addr.country,
                    postcode: addr.postcode,
                    phone: addr.phone,
                };
            };

            const cartBilling = cart?.billing_address;
            const checkoutBilling = cartBilling ? formatCartAddress(cartBilling) : null;
            //console.log('[CartAddressScreen] loadAddressData - cartBilling:', JSON.stringify(cartBilling), 'checkoutBilling:', JSON.stringify(checkoutBilling));

            if (checkoutBilling && checkoutBilling.address1 && checkoutBilling.address1.trim() !== '') {
                const cartShipping = cart?.shipping_address || cartBilling;
                const checkoutShipping = formatCartAddress(cartShipping);

                setBillingAddress(checkoutBilling);
                setShippingAddress(checkoutShipping);
                setSameAsBilling(!cart?.shipping_address || (
                    checkoutBilling.address1 === checkoutShipping.address1 &&
                    checkoutBilling.city === checkoutShipping.city
                ));
            } else if (defaultAddress) {
                // Convert defaultAddress to CheckoutAddress format
                const addressLines = Array.isArray(defaultAddress.address)
                    ? defaultAddress.address
                    : (defaultAddress.address ? String(defaultAddress.address).split('\n') : []);

                const checkoutAddress: CheckoutAddress = {
                    id: defaultAddress.id,
                    first_name: defaultAddress.first_name,
                    last_name: defaultAddress.last_name,
                    email: defaultAddress.email || '',
                    address1: getFlatString(addressLines[0]),
                    address2: getFlatString(addressLines[1] || defaultAddress.address2),
                    city: defaultAddress.city,
                    state: defaultAddress.state,
                    country: defaultAddress.country,
                    postcode: defaultAddress.postcode,
                    phone: defaultAddress.phone,
                };

                setBillingAddress(checkoutAddress);
                setShippingAddress(checkoutAddress);
                setSameAsBilling(true);
            }
        } catch (error) {
            console.error('Error loading address data:', error);
        } finally {
            setIsDefaultAddressLoading(false);
        }
    };

    const handleSameAsBillingChange = (value: boolean) => {
        setSameAsBilling(value);
        if (value && billingAddress) {
            setShippingAddress(billingAddress);
        } else if (!value) {
            setShippingAddress(null);
        }
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
    };

    const handleSaveAddress = async () => {
        if (!billingAddress) {
            showToast({ message: t('checkout.billingAddressRequired', 'Billing address is required'), type: 'error' });
            return;
        }

        if (!sameAsBilling && !shippingAddress) {
            showToast({ message: t('checkout.shippingAddressRequired', 'Shipping address is required'), type: 'error' });
            return;
        }

        setIsSaving(true);
        try {
            const transformAddress = (addr: CheckoutAddress) => {
                const { id, address1, address2, ...rest } = addr;
                return {
                    ...rest,
                    address: [address1, address2].filter(Boolean),
                };
            };

            const payload: any = {
                billing: {
                    ...transformAddress(billingAddress),
                    use_for_shipping: sameAsBilling,
                },
                ...(sameAsBilling ? {} : { shipping: transformAddress(shippingAddress!) }),
            };

            await checkoutApi.saveAddress(payload);

            // Save to Redux so it persists in the local session
            dispatch(setSelectedCartAddresses({
                billingAddress,
                shippingAddress,
                sameAsBilling,
            }));

            // Refresh cart in Redux so all components (like CartScreen) receive updated addresses
            await dispatch(fetchCartThunk()).unwrap();

            showToast({ message: t('address.addressSavedSuccessfully', 'Address saved successfully'), type: 'success' });
            router.back();
        } catch (error: any) {
            showToast({ message: error.message || t('checkout.addressSaveFailed'), type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    const isSaveDisabled = isSaving || !billingAddress || (!sameAsBilling && !shippingAddress);

    return (
        <View style={styles.container}>
            <TopHeader
                title={t('cart.deliveryAddress', 'Delivery Address')}
                onBack={() => router.back()}
                backgroundColor={theme.colors.background.default}
            />

            <View style={styles.content}>
                <AddressStep
                    billingAddress={billingAddress}
                    shippingAddress={shippingAddress}
                    sameAsBilling={sameAsBilling}
                    onSameAsBillingChange={handleSameAsBillingChange}
                    onAddressUpdate={handleAddressUpdate}
                    isDefaultAddressLoading={isDefaultAddressLoading}
                />
            </View>

            <View style={[styles.actionButtonContainer, { paddingBottom: Math.max(insets.bottom, theme.spacing.md) }]}>
                <Button
                    title={t('common.save', 'Save')}
                    onPress={handleSaveAddress}
                    disabled={isSaveDisabled}
                    loading={isSaving}
                />
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
    actionButtonContainer: {
        padding: theme.spacing.md,
        borderTopWidth: 1,
        borderTopColor: theme.colors.gray[200],
        backgroundColor: theme.colors.background.default,
    },
});

export default CartAddressScreen;
