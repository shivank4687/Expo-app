/**
 * PaymentStep Component
 * Checkout payment method selection step
 */

import { Card } from '@/shared/components/Card';
import { theme } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, Image } from 'react-native';

import { PaymentMethod } from '../types/checkout.types';

interface PaymentStepProps {
    paymentMethods: PaymentMethod[] | null;
    selectedMethod: string | null;
    onMethodSelect: (method: string) => void;
}

// ─── Brand icon tiles ─────────────────────────────────────────────────────────

/** Generic credit-card tile: orange base, two white stripe lines, red chip bar */
const CreditCardIcon: React.FC = () => (
    <View style={brandStyles.base}>
        {/* orange background */}
        <View style={[brandStyles.fill, { backgroundColor: '#EDA42D', borderRadius: 4 }]} />
        {/* white stripe top */}
        <View style={[brandStyles.stripe, { top: 17, borderTopWidth: 1, borderTopColor: '#FEFEFE' }]} />
        {/* white stripe bottom */}
        <View style={[brandStyles.stripe, { top: 32, borderTopWidth: 1.5, borderTopColor: '#FEFEFE' }]} />
        {/* red chip bar */}
        <View style={brandStyles.chipBar} />
    </View>
);

/** PayPal tile: light-blue border, "P P" wordmark composed of coloured shapes */
const PayPalIcon: React.FC = () => (
    <View style={brandStyles.base}>
        <View style={[brandStyles.fill, {
            backgroundColor: '#F3FBFF',
            borderRadius: 4,
            borderWidth: 1,
            borderColor: '#179BD7',
        }]} />
        {/* Dark-blue "P" left half */}
        <View style={[brandStyles.ppLeft, { backgroundColor: '#253B80' }]} />
        {/* Light-blue "P" right arc */}
        <View style={[brandStyles.ppRight, { backgroundColor: '#179BD7' }]} />
        {/* dark overlay to create letter shape */}
        <View style={[brandStyles.ppOverlay, { backgroundColor: '#222D65' }]} />
    </View>
);

/** Mastercard tile: cream background, overlapping circles (red + orange + blend) */
const MastercardIcon: React.FC = () => (
    <View style={brandStyles.base}>
        <View style={[brandStyles.fill, { backgroundColor: '#FFF4EE', borderRadius: 4 }]} />
        {/* red circle (left) */}
        <View style={[brandStyles.mcCircle, { left: 13, backgroundColor: '#ED0006' }]} />
        {/* orange circle (right) */}
        <View style={[brandStyles.mcCircle, { left: 29, backgroundColor: '#F9A000' }]} />
        {/* overlap blend in centre */}
        <View style={[brandStyles.mcMiddle, { backgroundColor: '#FF5E00' }]} />
    </View>
);

/** Cash icon for COD */
const CashIcon: React.FC = () => (
    <View style={[brandStyles.base, { backgroundColor: '#F0FDF4', borderRadius: 4, borderWidth: 1, borderColor: '#86EFAC', justifyContent: 'center', alignItems: 'center' }]}>
        <Ionicons name="cash-outline" size={26} color="#16A34A" />
    </View>
);

/** Fallback / generic card icon */
const GenericCardIcon: React.FC = () => (
    <View style={[brandStyles.base, { backgroundColor: '#F8F8F8', borderRadius: 4, borderWidth: 1, borderColor: '#E0E0E0', justifyContent: 'center', alignItems: 'center' }]}>
        <Ionicons name="card-outline" size={26} color="#555" />
    </View>
);

const getBrandIcon = (method: PaymentMethod): React.ReactElement => {
    // Prefer the icon URL returned by the API
    if (method.image) {
        return (
            <View style={brandStyles.base}>
                <Image
                    source={{ uri: method.image }}
                    style={brandStyles.apiImage}
                    resizeMode="cover"
                />
            </View>
        );
    }

    // Fallback to hand-crafted brand tiles
    const key = method.method.toLowerCase();
    if (key === 'paypal' || key === 'paypal_smart_button') return <PayPalIcon />;
    if (key === 'cashondelivery') return <CashIcon />;
    if (key === 'stripe' || key === 'stripeconnect' || key === 'razorpay' || key === 'moneytransfer') return <CreditCardIcon />;
    return <GenericCardIcon />;
};

// ─── Main component ───────────────────────────────────────────────────────────

export const PaymentStep: React.FC<PaymentStepProps> = ({
    paymentMethods,
    selectedMethod,
    onMethodSelect,
}) => {
    const { t } = useTranslation();

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

    return (
        <View style={styles.container}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* ── Payment card matching Figma spec ── */}
                <View style={styles.paymentCard}>
                    {/* Title */}
                    <Text style={styles.paymentTitle}>
                        {t('checkout.paymentMethods', 'Payment methods')}
                    </Text>

                    {/* Horizontal row of brand icon tiles */}
                    <View style={styles.tilesRow}>
                        {paymentMethods.map((method) => {
                            const isSelected = selectedMethod === method.method;
                            return (
                                <TouchableOpacity
                                    key={method.method}
                                    style={[
                                        styles.tileWrapper,
                                        isSelected && styles.tileWrapperSelected,
                                    ]}
                                    onPress={() => onMethodSelect(method.method)}
                                    activeOpacity={0.75}
                                >
                                    {getBrandIcon(method)}
                                    {isSelected && (
                                        <View style={styles.tileCheckBadge}>
                                            <Ionicons name="checkmark-circle" size={14} color={theme.colors.success.main} />
                                        </View>
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {/* Selected method name */}
                    {/* {selectedMethod && (
                        <Text style={styles.selectedLabel}>
                            {paymentMethods.find(m => m.method === selectedMethod)?.method_title ?? selectedMethod}
                        </Text>
                    )} */}
                </View>
            </ScrollView>
        </View>
    );
};

// ─── Brand icon styles ────────────────────────────────────────────────────────

const brandStyles = StyleSheet.create({
    base: {
        width: 70,
        height: 48,
        borderRadius: 4,
        overflow: 'hidden',
        backgroundColor: '#F8F8F8',
        justifyContent: 'center',
        alignItems: 'center',
    },
    apiImage: {
        width: '100%',
        height: '100%',
    },
    fill: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    stripe: {
        position: 'absolute',
        left: 0,
        right: 0,
        height: 0,
    },
    // Red chip bar centred vertically in 48px tile: top = (48 - 15) / 2 = 16.5
    chipBar: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 16,
        height: 15,
        backgroundColor: '#ED1C24',
    },
    // PayPal shapes (container 70 × 48)
    ppLeft: {
        position: 'absolute',
        left: 15,   // ~22% of 70
        top: 10,    // ~22% of 48
        width: 18,
        height: 26,
        borderRadius: 9,
    },
    ppRight: {
        position: 'absolute',
        left: 24,   // ~34% of 70
        top: 14,    // ~30% of 48
        width: 18,
        height: 22,
        borderRadius: 9,
    },
    ppOverlay: {
        position: 'absolute',
        left: 21,   // ~30% of 70
        top: 10,    // ~22% of 48
        width: 12,
        height: 14,
        borderRadius: 4,
    },
    // Mastercard shapes (container 70 × 48)
    mcCircle: {
        position: 'absolute',
        top: 10,    // ~20% of 48
        width: 28,
        height: 28,
        borderRadius: 14,
    },
    mcMiddle: {
        position: 'absolute',
        left: 31,   // ~44% of 70
        top: 13,    // ~27% of 48
        width: 10,
        height: 20,
        borderRadius: 2,
    },
});

// ─── Screen styles ─────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: theme.spacing.xs,
    },
    // Figma card
    paymentCard: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E9E3D3',
        borderRadius: 8,
        padding: 8,
        gap: 12,
    },
    paymentTitle: {
        fontFamily: 'Inter',
        fontSize: 20,
        fontWeight: '500',
        lineHeight: 24,
        color: '#000000',
    },
    tilesRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 20,
        flexWrap: 'wrap',
    },
    tileWrapper: {
        position: 'relative',
        borderRadius: 4,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    tileWrapperSelected: {
        borderColor: theme.colors.primary[500],
        borderRadius: 6,
    },
    tileCheckBadge: {
        position: 'absolute',
        bottom: -6,
        right: -6,
        backgroundColor: '#fff',
        borderRadius: 8,
    },
    selectedLabel: {
        fontSize: 13,
        color: theme.colors.text.secondary,
        marginTop: 4,
    },
    // Empty state
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

