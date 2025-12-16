/**
 * PaymentStep Component
 * Checkout payment method selection step
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Card } from '@/shared/components/Card';
import { Button } from '@/shared/components/Button';
import { theme } from '@/theme';
import { PaymentMethod } from '../types/checkout.types';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface PaymentStepProps {
    paymentMethods: PaymentMethod[] | null;
    selectedMethod: string | null;
    onMethodSelect: (method: string) => void;
    onProceed: () => void;
    isProcessing?: boolean;
}

export const PaymentStep: React.FC<PaymentStepProps> = ({
    paymentMethods,
    selectedMethod,
    onMethodSelect,
    onProceed,
    isProcessing = false,
}) => {
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();
    if (!paymentMethods || paymentMethods.length === 0) {
        return (
            <View style={styles.container}>
                <Card style={styles.messageCard}>
                    <Text style={styles.messageText}>
                        {t('checkout.noPaymentMethods', 'No payment methods available')}
                    </Text>
                </Card>
            </View>
        );
    }

    const canProceed = selectedMethod !== null;

    return (
        <View style={styles.container}>
            {/* Scrollable Content */}
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <Text style={styles.sectionTitle}>
                    {t('checkout.selectPaymentMethod', 'Select Payment Method')}
                </Text>

                <Card style={styles.methodsCard}>
                    {paymentMethods.map((method, index) => {
                        const isSelected = selectedMethod === method.method;
                        const isLast = index === paymentMethods.length - 1;

                        return (
                            <TouchableOpacity
                                key={method.method}
                                style={[
                                    styles.methodItem,
                                    isSelected && styles.methodItemSelected,
                                    !isLast && styles.methodItemBorder,
                                ]}
                                onPress={() => onMethodSelect(method.method)}
                                activeOpacity={0.7}
                            >
                                {/* Radio Button */}
                                <View
                                    style={[
                                        styles.radio,
                                        isSelected && styles.radioSelected,
                                    ]}
                                >
                                    {isSelected && (
                                        <View style={styles.radioInner} />
                                    )}
                                </View>

                                {/* Method Icon */}
                                <View style={styles.methodIconContainer}>
                                    <Ionicons
                                        name={getPaymentIcon(method.method)}
                                        size={24}
                                        color={isSelected ? theme.colors.primary[500] : theme.colors.text.secondary}
                                    />
                                </View>

                                {/* Method Details */}
                                <View style={styles.methodDetails}>
                                    <Text
                                        style={[
                                            styles.methodTitle,
                                            isSelected && styles.methodTitleSelected,
                                        ]}
                                    >
                                        {method.method_title}
                                    </Text>
                                    {method.description && (
                                        <Text style={styles.methodDescription}>
                                            {method.description}
                                        </Text>
                                    )}
                                </View>

                                {/* Selected Indicator */}
                                {isSelected && (
                                    <Ionicons
                                        name="checkmark-circle"
                                        size={24}
                                        color={theme.colors.success.main}
                                    />
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </Card>
            </ScrollView>

            {/* Fixed Button at Bottom */}
            <View style={[styles.buttonContainer, { paddingBottom: Math.max(insets.bottom, theme.spacing.md) }]}>
                <Button
                    title={t('checkout.proceedToReview', 'Proceed to Review')}
                    onPress={onProceed}
                    disabled={!canProceed || isProcessing}
                    loading={isProcessing}
                />
            </View>
        </View>
    );
};

// Helper function to get payment icon
const getPaymentIcon = (method: string): any => {
    const iconMap: Record<string, string> = {
        cashondelivery: 'cash-outline',
        moneytransfer: 'arrow-forward-circle-outline',
        paypal: 'logo-paypal',
        stripe: 'card-outline',
        stripeconnect: 'card-outline',
        razorpay: 'card-outline',
    };

    return iconMap[method] || 'card-outline';
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: theme.spacing.md,
        paddingBottom: theme.spacing.xl,
    },
    buttonContainer: {
        padding: theme.spacing.md,
        paddingTop: theme.spacing.sm,
        backgroundColor: theme.colors.white,
        borderTopWidth: 1,
        borderTopColor: theme.colors.gray[200],
        shadowColor: theme.colors.black,
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 5,
    },
    sectionTitle: {
        fontSize: theme.typography.fontSize.lg,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.md,
    },
    methodsCard: {
        padding: 0,
        overflow: 'hidden',
        marginBottom: theme.spacing.md,
    },
    methodItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: theme.spacing.md,
        backgroundColor: theme.colors.white,
    },
    methodItemSelected: {
        backgroundColor: theme.colors.primary[50],
    },
    methodItemBorder: {
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.gray[200],
    },
    radio: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: theme.colors.gray[400],
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: theme.spacing.md,
    },
    radioSelected: {
        borderColor: theme.colors.primary[500],
    },
    radioInner: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: theme.colors.primary[500],
    },
    methodIconContainer: {
        marginRight: theme.spacing.md,
    },
    methodDetails: {
        flex: 1,
    },
    methodTitle: {
        fontSize: theme.typography.fontSize.md,
        fontWeight: theme.typography.fontWeight.medium,
        color: theme.colors.text.primary,
    },
    methodTitleSelected: {
        fontWeight: theme.typography.fontWeight.bold,
    },
    methodDescription: {
        fontSize: theme.typography.fontSize.xs,
        color: theme.colors.text.secondary,
        marginTop: 2,
    },
    messageCard: {
        padding: theme.spacing.lg,
        alignItems: 'center',
    },
    messageText: {
        fontSize: theme.typography.fontSize.md,
        color: theme.colors.text.secondary,
        textAlign: 'center',
    },
});

