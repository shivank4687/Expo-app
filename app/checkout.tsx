import React from 'react';
import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { CheckoutScreen } from '@/features/checkout/screens/CheckoutScreen';

export default function CheckoutPage() {
    const { t } = useTranslation();
    
    return (
        <>
            <Stack.Screen 
                options={{ 
                    title: t('cart.checkout', 'Checkout'),
                    headerBackTitle: t('common.back'),
                }} 
            />
            <CheckoutScreen />
        </>
    );
}

