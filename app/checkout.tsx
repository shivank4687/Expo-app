import { CheckoutScreen } from '@/features/checkout/screens/CheckoutScreen';
import { Stack } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';

export default function CheckoutPage() {
    const { t } = useTranslation();

    return (
        <>

            <Stack.Screen
                options={{
                    headerShown: false,
                }}
            />
            <CheckoutScreen />
        </>
    );
}
