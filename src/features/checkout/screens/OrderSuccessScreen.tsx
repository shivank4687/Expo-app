/**
 * OrderSuccessScreen Component
 * Displays order confirmation after successful checkout
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { theme } from '@/theme';
import { Ionicons } from '@expo/vector-icons';

export const OrderSuccessScreen: React.FC = () => {
    const { t } = useTranslation();
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();

    useEffect(() => {
        // Redirect to home if no order ID
        if (!id) {
            router.replace('/(drawer)/(tabs)');
        }
    }, [id, router]);

    const handleContinueShopping = () => {
        // Navigate to home and clear the navigation stack
        router.dismissAll();
        router.replace('/(drawer)/(tabs)');
    };

    const handleViewOrder = () => {
        router.push('/orders');
    };

    if (!id) {
        return null;
    }

    return (
        <>
            <Stack.Screen 
                options={{ 
                    title: t('checkout.orderSuccess.title', 'Order Placed'),
                    headerBackVisible: false,
                    headerLeft: () => null,
                }} 
            />
            <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
                {/* Success Icon */}
                <View style={styles.iconContainer}>
                    <View style={styles.iconCircle}>
                        <Ionicons name="checkmark" size={60} color={theme.colors.white} />
                    </View>
                </View>

                {/* Success Message */}
                <Text style={styles.title}>
                    {t('checkout.orderSuccess.thankYou', 'Thank You for Your Order!')}
                </Text>

                {/* Order ID */}
                <View style={styles.orderIdContainer}>
                    <Text style={styles.orderIdLabel}>
                        {t('checkout.orderSuccess.orderNumber', 'Your Order Number is')}
                    </Text>
                    <Text style={styles.orderId}>#{id}</Text>
                </View>

                {/* Information Message */}
                <Text style={styles.infoText}>
                    {t('checkout.orderSuccess.emailConfirmation', 'We will email you an order confirmation with details and tracking info.')}
                </Text>

                {/* Action Buttons */}
                <View style={styles.buttonContainer}>
                    <TouchableOpacity 
                        style={styles.primaryButton}
                        onPress={handleContinueShopping}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.primaryButtonText}>
                            {t('checkout.orderSuccess.continueShopping', 'Continue Shopping')}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={styles.secondaryButton}
                        onPress={handleViewOrder}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.secondaryButtonText}>
                            {t('checkout.orderSuccess.viewOrder', 'View Order')}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Additional Info */}
                <View style={styles.additionalInfo}>
                    <View style={styles.infoRow}>
                        <Ionicons name="mail-outline" size={20} color={theme.colors.primary[500]} />
                        <Text style={styles.infoRowText}>
                            {t('checkout.orderSuccess.checkEmail', 'Check your email for order details')}
                        </Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Ionicons name="time-outline" size={20} color={theme.colors.primary[500]} />
                        <Text style={styles.infoRowText}>
                            {t('checkout.orderSuccess.processingTime', 'Your order is being processed')}
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.white,
    },
    contentContainer: {
        alignItems: 'center',
        paddingVertical: theme.spacing.xl * 2,
        paddingHorizontal: theme.spacing.lg,
    },
    iconContainer: {
        marginBottom: theme.spacing.xl,
    },
    iconCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: theme.colors.success,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: theme.colors.success,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    title: {
        fontSize: 26,
        fontWeight: '700',
        color: theme.colors.text.primary,
        textAlign: 'center',
        marginBottom: theme.spacing.lg,
        textTransform: 'uppercase',
    },
    orderIdContainer: {
        alignItems: 'center',
        marginBottom: theme.spacing.xl,
        paddingVertical: theme.spacing.lg,
        paddingHorizontal: theme.spacing.xl,
        backgroundColor: theme.colors.gray[50],
        borderRadius: theme.spacing.md,
        borderWidth: 1,
        borderColor: theme.colors.gray[200],
        width: '100%',
    },
    orderIdLabel: {
        fontSize: 14,
        color: theme.colors.text.secondary,
        marginBottom: theme.spacing.xs,
    },
    orderId: {
        fontSize: 24,
        fontWeight: '700',
        color: theme.colors.primary[600],
    },
    infoText: {
        fontSize: 15,
        color: theme.colors.text.secondary,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: theme.spacing.xl,
        paddingHorizontal: theme.spacing.md,
    },
    buttonContainer: {
        width: '100%',
        marginBottom: theme.spacing.xl,
        gap: theme.spacing.md,
    },
    primaryButton: {
        backgroundColor: theme.colors.primary[500],
        paddingVertical: theme.spacing.md + 2,
        paddingHorizontal: theme.spacing.xl,
        borderRadius: theme.spacing.md,
        alignItems: 'center',
        shadowColor: theme.colors.primary[500],
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    primaryButtonText: {
        color: theme.colors.white,
        fontSize: 16,
        fontWeight: '600',
    },
    secondaryButton: {
        backgroundColor: theme.colors.white,
        paddingVertical: theme.spacing.md + 2,
        paddingHorizontal: theme.spacing.xl,
        borderRadius: theme.spacing.md,
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: theme.colors.primary[500],
    },
    secondaryButtonText: {
        color: theme.colors.primary[500],
        fontSize: 16,
        fontWeight: '600',
    },
    additionalInfo: {
        width: '100%',
        marginTop: theme.spacing.lg,
        paddingTop: theme.spacing.xl,
        borderTopWidth: 1,
        borderTopColor: theme.colors.gray[200],
        gap: theme.spacing.md,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
        paddingVertical: theme.spacing.xs,
    },
    infoRowText: {
        flex: 1,
        fontSize: 14,
        color: theme.colors.text.secondary,
        lineHeight: 20,
    },
});

