/**
 * CheckoutStepper Component
 * Visual stepper showing checkout progress
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { theme } from '@/theme';
import { CheckoutStep } from '../types/checkout.types';

interface CheckoutStepperProps {
    currentStep: CheckoutStep;
    completedSteps: CheckoutStep[];
}

const STEPS: CheckoutStep[] = ['address', 'shipping', 'payment', 'review'];

const STEP_ICONS: Record<CheckoutStep, string> = {
    address: 'location',
    shipping: 'car',
    payment: 'card',
    review: 'checkmark-circle',
};

const STEP_LABELS: Record<CheckoutStep, string> = {
    address: 'Address',
    shipping: 'Shipping',
    payment: 'Payment',
    review: 'Review',
};

export const CheckoutStepper: React.FC<CheckoutStepperProps> = ({ currentStep, completedSteps }) => {
    const { t } = useTranslation();
    
    const currentStepIndex = STEPS.indexOf(currentStep);

    const getStepStatus = (step: CheckoutStep, index: number) => {
        if (completedSteps.includes(step)) return 'completed';
        if (step === currentStep) return 'active';
        return 'inactive';
    };

    return (
        <View style={styles.container}>
            {STEPS.map((step, index) => {
                const status = getStepStatus(step, index);
                const isLast = index === STEPS.length - 1;

                return (
                    <React.Fragment key={step}>
                        <View style={styles.stepContainer}>
                            {/* Step Circle */}
                            <View
                                style={[
                                    styles.stepCircle,
                                    status === 'completed' && styles.stepCircleCompleted,
                                    status === 'active' && styles.stepCircleActive,
                                ]}
                            >
                                {status === 'completed' ? (
                                    <Ionicons
                                        name="checkmark"
                                        size={20}
                                        color={theme.colors.white}
                                    />
                                ) : (
                                    <Ionicons
                                        name={STEP_ICONS[step] as any}
                                        size={18}
                                        color={
                                            status === 'active'
                                                ? theme.colors.white
                                                : theme.colors.gray[400]
                                        }
                                    />
                                )}
                            </View>

                            {/* Step Label */}
                            <Text
                                style={[
                                    styles.stepLabel,
                                    status === 'active' && styles.stepLabelActive,
                                    status === 'completed' && styles.stepLabelCompleted,
                                ]}
                            >
                                {t(`checkout.steps.${step}`, STEP_LABELS[step])}
                            </Text>
                        </View>

                        {/* Connector Line */}
                        {!isLast && (
                            <View
                                style={[
                                    styles.connector,
                                    index < currentStepIndex && styles.connectorCompleted,
                                ]}
                            />
                        )}
                    </React.Fragment>
                );
            })}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.lg,
        backgroundColor: theme.colors.white,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.gray[200],
    },
    stepContainer: {
        alignItems: 'center',
        flex: 1,
    },
    stepCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: theme.colors.gray[200],
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: theme.spacing.xs,
    },
    stepCircleActive: {
        backgroundColor: theme.colors.primary[500],
    },
    stepCircleCompleted: {
        backgroundColor: theme.colors.success.main,
    },
    stepLabel: {
        fontSize: theme.typography.fontSize.xs,
        color: theme.colors.text.secondary,
        textAlign: 'center',
        fontWeight: theme.typography.fontWeight.medium,
    },
    stepLabelActive: {
        color: theme.colors.primary[500],
        fontWeight: theme.typography.fontWeight.bold,
    },
    stepLabelCompleted: {
        color: theme.colors.success.main,
    },
    connector: {
        width: 30,
        height: 2,
        backgroundColor: theme.colors.gray[200],
        marginBottom: 20,
    },
    connectorCompleted: {
        backgroundColor: theme.colors.success.main,
    },
});

