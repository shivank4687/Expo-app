/**
 * ShippingStep Component
 * Checkout shipping method selection step
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Card } from '@/shared/components/Card';
import { Button } from '@/shared/components/Button';
import { theme } from '@/theme';
import { ShippingMethod } from '../types/checkout.types';

interface ShippingStepProps {
    shippingMethods: Record<string, ShippingMethod> | null;
    selectedMethod: string | null;
    onMethodSelect: (method: string) => void;
    onProceed: () => void;
    isProcessing?: boolean;
}

export const ShippingStep: React.FC<ShippingStepProps> = ({
    shippingMethods,
    selectedMethod,
    onMethodSelect,
    onProceed,
    isProcessing = false,
}) => {
    const { t } = useTranslation();
    // Expand all carriers by default
    const [expandedCarriers, setExpandedCarriers] = useState<Set<string>>(
        new Set(shippingMethods ? Object.keys(shippingMethods) : [])
    );

    if (!shippingMethods || Object.keys(shippingMethods).length === 0) {
        return (
            <View style={styles.container}>
                <Card style={styles.messageCard}>
                    <Text style={styles.messageText}>
                        {t('checkout.noShippingMethods', 'No shipping methods available')}
                    </Text>
                </Card>
            </View>
        );
    }

    const toggleCarrier = (carrier: string) => {
        setExpandedCarriers((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(carrier)) {
                newSet.delete(carrier);
            } else {
                newSet.add(carrier);
            }
            return newSet;
        });
    };

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
                    {t('checkout.selectShippingMethod', 'Select Shipping Method')}
                </Text>

                {/* Shipping Method Carriers */}
                {Object.entries(shippingMethods).map(([carrierCode, carrier]) => {
                    const isExpanded = expandedCarriers.has(carrierCode);

                    return (
                        <Card key={carrierCode} style={styles.carrierCard}>
                            {/* Carrier Header */}
                            <TouchableOpacity
                                style={styles.carrierHeader}
                                onPress={() => toggleCarrier(carrierCode)}
                                activeOpacity={0.7}
                            >
                                <View style={styles.carrierTitleContainer}>
                                    <Ionicons
                                        name="cube-outline"
                                        size={20}
                                        color={theme.colors.primary[500]}
                                    />
                                    <Text style={styles.carrierTitle}>
                                        {carrier.carrier_title}
                                    </Text>
                                </View>
                                <Ionicons
                                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                                    size={24}
                                    color={theme.colors.text.secondary}
                                />
                            </TouchableOpacity>

                            {/* Carrier Rates */}
                            {isExpanded && (
                                <View style={styles.ratesContainer}>
                                    {carrier.rates.map((rate) => {
                                        const methodKey = `${carrierCode}_${rate.method}`;
                                        const isSelected = selectedMethod === methodKey;

                                        return (
                                            <TouchableOpacity
                                                key={rate.method}
                                                style={[
                                                    styles.rateItem,
                                                    isSelected && styles.rateItemSelected,
                                                ]}
                                                onPress={() => onMethodSelect(methodKey)}
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

                                                {/* Method Details */}
                                                <View style={styles.rateDetails}>
                                                    <Text style={styles.rateTitle}>
                                                        {rate.method_title}
                                                    </Text>
                                                    {rate.method_description && (
                                                        <Text style={styles.rateDescription}>
                                                            {rate.method_description}
                                                        </Text>
                                                    )}
                                                </View>

                                                {/* Price */}
                                                <Text style={styles.ratePrice}>
                                                    {rate.formatted_price || rate.base_formatted_price}
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            )}
                        </Card>
                    );
                })}
            </ScrollView>

            {/* Fixed Button at Bottom */}
            <View style={styles.buttonContainer}>
                <Button
                    title={t('checkout.proceedToPayment', 'Proceed to Payment')}
                    onPress={onProceed}
                    disabled={!canProceed || isProcessing}
                    loading={isProcessing}
                />
            </View>
        </View>
    );
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
    carrierCard: {
        marginBottom: theme.spacing.md,
        padding: 0,
        overflow: 'hidden',
    },
    carrierHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: theme.spacing.md,
        backgroundColor: theme.colors.white,
    },
    carrierTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
    },
    carrierTitle: {
        fontSize: theme.typography.fontSize.md,
        fontWeight: theme.typography.fontWeight.semiBold,
        color: theme.colors.text.primary,
    },
    ratesContainer: {
        backgroundColor: theme.colors.gray[50],
    },
    rateItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: theme.spacing.md,
        borderTopWidth: 1,
        borderTopColor: theme.colors.gray[200],
    },
    rateItemSelected: {
        backgroundColor: theme.colors.primary[50],
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
    rateDetails: {
        flex: 1,
    },
    rateTitle: {
        fontSize: theme.typography.fontSize.md,
        fontWeight: theme.typography.fontWeight.medium,
        color: theme.colors.text.primary,
        marginBottom: 2,
    },
    rateDescription: {
        fontSize: theme.typography.fontSize.xs,
        color: theme.colors.text.secondary,
    },
    ratePrice: {
        fontSize: theme.typography.fontSize.md,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.primary[500],
    },
    addressCard: {
        marginBottom: theme.spacing.md,
        padding: 0,
        overflow: 'hidden',
    },
    addressHeader: {
        padding: theme.spacing.md,
        backgroundColor: theme.colors.gray[50],
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.gray[200],
    },
    addressTitle: {
        fontSize: theme.typography.fontSize.md,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.text.primary,
    },
    addressContent: {
        padding: theme.spacing.md,
    },
    addressName: {
        fontSize: theme.typography.fontSize.md,
        fontWeight: theme.typography.fontWeight.semiBold,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.xs,
    },
    addressText: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.text.secondary,
        marginBottom: 2,
    },
    addressActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        padding: theme.spacing.md,
        paddingTop: theme.spacing.sm,
        borderTopWidth: 1,
        borderTopColor: theme.colors.gray[200],
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.xs,
    },
    actionButtonText: {
        fontSize: theme.typography.fontSize.sm,
        fontWeight: theme.typography.fontWeight.semiBold,
        color: theme.colors.primary[500],
    },
    addAddressButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.spacing.sm,
        padding: theme.spacing.xl,
        borderWidth: 2,
        borderStyle: 'dashed',
        borderColor: theme.colors.gray[300],
        borderRadius: theme.borderRadius.md,
        margin: theme.spacing.md,
    },
    addAddressText: {
        fontSize: theme.typography.fontSize.md,
        fontWeight: theme.typography.fontWeight.semiBold,
        color: theme.colors.primary[500],
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: theme.spacing.md,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 4,
        borderWidth: 2,
        borderColor: theme.colors.gray[400],
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: theme.spacing.sm,
    },
    checkboxChecked: {
        backgroundColor: theme.colors.primary[500],
        borderColor: theme.colors.primary[500],
    },
    checkboxLabel: {
        fontSize: theme.typography.fontSize.md,
        color: theme.colors.text.primary,
    },
    divider: {
        height: 1,
        backgroundColor: theme.colors.gray[200],
        marginVertical: theme.spacing.md,
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

