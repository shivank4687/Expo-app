import React from 'react';
import { Stack } from 'expo-router';
import { CartAddressScreen } from '@/features/cart/screens/CartAddressScreen';

export default function CartAddressPage() {
    return (
        <>
            <Stack.Screen
                options={{
                    headerShown: false,
                }}
            />
            <CartAddressScreen />
        </>
    );
}
