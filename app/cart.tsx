import React from 'react';
import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { CartScreen } from '@/features/cart/screens/CartScreen';

export default function CartPage() {
    const { t } = useTranslation();
    
    return (
        <>
            <Stack.Screen 
                options={{ 
                    title: t('cart.shoppingCart'),
                    headerBackTitle: t('common.back'),
                }} 
            />
            <CartScreen />
        </>
    );
}

