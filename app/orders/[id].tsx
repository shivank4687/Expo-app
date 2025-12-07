/**
 * Order Detail Route
 * Placeholder for order details page
 * TODO: Implement full order details view
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { theme } from '@/theme';
import { useTranslation } from 'react-i18next';

export default function OrderDetailScreen() {
    const { t } = useTranslation();
    const { id } = useLocalSearchParams<{ id: string }>();

    return (
        <>
            <Stack.Screen 
                options={{ 
                    title: t('orders.orderDetails', 'Order Details'),
                    headerBackTitle: t('common.back', 'Back'),
                }} 
            />
            <View style={styles.container}>
                <Text style={styles.text}>
                    {t('orders.orderDetailsComingSoon', 'Order details page coming soon!')}
                </Text>
                <Text style={styles.orderId}>
                    Order ID: {id}
                </Text>
            </View>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: theme.spacing.xl,
        backgroundColor: theme.colors.background.default,
    },
    text: {
        fontSize: theme.typography.fontSize.lg,
        color: theme.colors.text.secondary,
        textAlign: 'center',
        marginBottom: theme.spacing.md,
    },
    orderId: {
        fontSize: theme.typography.fontSize.md,
        color: theme.colors.text.primary,
        fontWeight: theme.typography.fontWeight.semibold,
    },
});

