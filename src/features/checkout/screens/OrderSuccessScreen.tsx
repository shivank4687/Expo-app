/**
 * OrderSuccessScreen Component
 * Displays order confirmation after successful checkout
 */

import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { theme } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { ordersApi, Order } from '@/services/api/orders.api';
import { formatters } from '@/shared/utils/formatters';

export const OrderSuccessScreen: React.FC = () => {
    const { t } = useTranslation();
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const [order, setOrder] = useState<Order | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Redirect to home if no order ID
        if (!id) {
            router.replace('/(drawer)/(tabs)');
            return;
        }
        
        // Fetch order details to get voucher information
        loadOrder();
    }, [id, router]);

    const loadOrder = useCallback(async () => {
        if (!id) return;
        
        try {
            setIsLoading(true);
            const response = await ordersApi.getOrder(parseInt(id));
            setOrder(response.data);
        } catch (error) {
            console.error('[OrderSuccessScreen] Error loading order:', error);
        } finally {
            setIsLoading(false);
        }
    }, [id]);

    const handleContinueShopping = () => {
        // Navigate to home and clear the navigation stack
        router.dismissAll();
        router.replace('/(drawer)/(tabs)');
    };

    const handleViewOrder = () => {
        if (id) {
            router.push(`/orders/${id}`);
        } else {
            router.push('/orders');
        }
    };

    const handleViewVoucher = () => {
        const voucherUrl = order?.payment?.additional?.voucher_url;
        if (voucherUrl) {
            Linking.openURL(voucherUrl);
        }
    };

    if (!id) {
        return null;
    }

    const isOxxoPayment = order?.payment?.method === 'stripeoxxo';
    const oxxoVoucher = order?.payment?.additional;
    const isLoadingOrder = isLoading;

    if (isLoadingOrder) {
        return (
            <>
                <Stack.Screen 
                    options={{ 
                        title: t('checkout.orderSuccess.title', 'Order Placed'),
                        headerBackVisible: false,
                        headerLeft: () => null,
                    }} 
                />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.colors.primary[500]} />
                </View>
            </>
        );
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
                        <Ionicons name="checkmark" size={40} color={theme.colors.white} />
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
                    <Text style={styles.orderId}>#{order?.increment_id || id}</Text>
                </View>

                {/* OXXO Voucher Section */}
                {isOxxoPayment && oxxoVoucher && (
                    <View style={styles.voucherContainer}>
                        <Text style={styles.voucherTitle}>
                            {t('checkout.oxxo.paymentInstruction', 'Complete Your Payment')}
                        </Text>
                        
                        <View style={styles.voucherNumberContainer}>
                            <Text style={styles.voucherNumberLabel}>
                                {t('checkout.oxxo.refNumber', 'Reference Number')}
                            </Text>
                            <Text style={styles.voucherNumber}>
                                {oxxoVoucher.voucher_number}
                            </Text>
                        </View>

                        {oxxoVoucher.voucher_expires_at && (
                            <Text style={styles.voucherExpiry}>
                                <Text style={styles.voucherExpiryLabel}>
                                    {t('checkout.oxxo.expireOn', 'Expires on')}:{' '}
                                </Text>
                                {formatters.formatDate(oxxoVoucher.voucher_expires_at, 'long')}
                            </Text>
                        )}

                        <TouchableOpacity 
                            style={styles.voucherButton}
                            onPress={handleViewVoucher}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="receipt-outline" size={20} color={theme.colors.white} />
                            <Text style={styles.voucherButtonText}>
                                {t('checkout.oxxo.viewVoucher', 'View Voucher')}
                            </Text>
                        </TouchableOpacity>

                        <Text style={styles.voucherInstruction}>
                            {t('checkout.oxxo.successInstruction', 'Please complete your payment at any OXXO store using the reference number above. Your order will be processed once payment is confirmed.')}
                        </Text>
                    </View>
                )}

                {/* Information Message */}
                {!isOxxoPayment && (
                    <Text style={styles.infoText}>
                        {t('checkout.orderSuccess.emailConfirmation', 'We will email you an order confirmation with details and tracking info.')}
                    </Text>
                )}

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
        paddingTop: theme.spacing.md,
        paddingBottom: theme.spacing.xl * 2,
        paddingHorizontal: theme.spacing.lg,
    },
    iconContainer: {
        marginBottom: theme.spacing.lg,
    },
    iconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: theme.colors.success.main,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: theme.colors.success.main,
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
        marginBottom: theme.spacing.xl,
        textTransform: 'uppercase',
    },
    orderIdContainer: {
        alignItems: 'center',
        marginBottom: theme.spacing.lg,
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.white,
    },
    voucherContainer: {
        width: '100%',
        marginBottom: theme.spacing.xl,
        padding: theme.spacing.lg,
        backgroundColor: '#FFF7ED',
        borderRadius: theme.borderRadius.md,
        borderWidth: 2,
        borderColor: '#FDBA74',
    },
    voucherTitle: {
        fontSize: theme.typography.fontSize.lg,
        fontWeight: theme.typography.fontWeight.bold,
        color: '#C2410C',
        textAlign: 'center',
        marginBottom: theme.spacing.md,
    },
    voucherNumberContainer: {
        backgroundColor: theme.colors.white,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.md,
        marginBottom: theme.spacing.md,
        alignItems: 'center',
    },
    voucherNumberLabel: {
        fontSize: theme.typography.fontSize.xs,
        color: theme.colors.text.secondary,
        marginBottom: theme.spacing.xs,
    },
    voucherNumber: {
        fontSize: theme.typography.fontSize.xl,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.text.primary,
        letterSpacing: 2,
    },
    voucherExpiry: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.text.secondary,
        textAlign: 'center',
        marginBottom: theme.spacing.md,
    },
    voucherExpiryLabel: {
        fontWeight: theme.typography.fontWeight.semiBold,
    },
    voucherButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.spacing.sm,
        backgroundColor: theme.colors.primary[500],
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.lg,
        borderRadius: theme.borderRadius.md,
        marginBottom: theme.spacing.md,
    },
    voucherButtonText: {
        color: theme.colors.white,
        fontSize: theme.typography.fontSize.base,
        fontWeight: theme.typography.fontWeight.semiBold,
    },
    voucherInstruction: {
        fontSize: theme.typography.fontSize.xs,
        color: theme.colors.text.secondary,
        textAlign: 'center',
        lineHeight: 18,
    },
});

