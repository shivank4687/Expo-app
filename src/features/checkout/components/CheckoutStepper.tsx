/**
 * CheckoutStepper Component
 * Vertical stepper showing checkout progress with accordion-style step content
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
    children: React.ReactNode;
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

export const CheckoutStepper: React.FC<CheckoutStepperProps> = ({
    currentStep,
    completedSteps,
    children,
}) => {
    const { t } = useTranslation();

    const childArray = React.Children.toArray(children);

    const shouldHideIntermediateSteps = currentStep === 'review';

    const getStepStatus = (step: CheckoutStep) => {
        if (completedSteps.includes(step)) return 'completed';
        if (step === currentStep) return 'active';
        return 'inactive';
    };

    return (
        <View style={styles.container}>
            {STEPS.map((step, index) => {
                if (shouldHideIntermediateSteps && step !== 'review') {
                    return null;
                }

                const status = getStepStatus(step);
                const isLast = index === STEPS.length - 1;
                const isActive = status === 'active';
                const isCompleted = status === 'completed';

                return (
                    <View key={step} style={styles.stepWrapper}>
                        {/* Step Header Row — commented out to hide stepper indicators */}
                        {/* <View style={styles.stepHeader}>
                            <View style={styles.indicatorColumn}>
                                <View
                                    style={[
                                        styles.stepCircle,
                                        isCompleted && styles.stepCircleCompleted,
                                        isActive && styles.stepCircleActive,
                                    ]}
                                >
                                    {isCompleted ? (
                                        <Ionicons
                                            name="checkmark"
                                            size={18}
                                            color={theme.colors.white}
                                        />
                                    ) : (
                                        <Ionicons
                                            name={STEP_ICONS[step] as any}
                                            size={16}
                                            color={
                                                isActive
                                                    ? theme.colors.white
                                                    : theme.colors.gray[400]
                                            }
                                        />
                                    )}
                                </View>
                                {!isLast && (
                                    <View
                                        style={[
                                            styles.verticalLine,
                                            isCompleted && styles.verticalLineCompleted,
                                        ]}
                                    />
                                )}
                            </View>
                            <View style={styles.labelColumn}>
                                <View style={styles.labelRow}>
                                    <Text
                                        style={[
                                            styles.stepLabel,
                                            isActive && styles.stepLabelActive,
                                            isCompleted && styles.stepLabelCompleted,
                                        ]}
                                    >
                                        {t(`checkout.steps.${step}`, STEP_LABELS[step])}
                                    </Text>
                                    {isCompleted && (
                                        <View style={styles.completedBadge}>
                                            <Text style={styles.completedBadgeText}>
                                                {t('checkout.steps.done', 'Done')}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            </View>
                        </View> */}

                        {/* Step Content — shown for active and completed steps */}
                        {(isActive || isCompleted) && (
                            <View style={styles.stepContent}>
                                {childArray[index]}
                            </View>
                        )}
                    </View>
                );
            })}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: theme.spacing.md,
        paddingTop: theme.spacing.md,
        paddingBottom: theme.spacing.lg,
        backgroundColor: theme.colors.background.default,
    },
    stepWrapper: {
        // Each step row
    },
    stepHeader: {
        flexDirection: 'row',
    },
    indicatorColumn: {
        alignItems: 'center',
        width: 40,
    },
    stepCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: theme.colors.gray[200],
        justifyContent: 'center',
        alignItems: 'center',
    },
    stepCircleActive: {
        backgroundColor: theme.colors.primary[500],
    },
    stepCircleCompleted: {
        backgroundColor: theme.colors.success.main,
    },
    verticalLine: {
        width: 2,
        flex: 1,
        minHeight: 24,
        backgroundColor: theme.colors.gray[200],
        marginTop: 4,
        marginBottom: 4,
    },
    verticalLineCompleted: {
        backgroundColor: theme.colors.success.main,
    },
    labelColumn: {
        flex: 1,
        paddingLeft: theme.spacing.sm,
    },
    labelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 36,
    },
    stepLabel: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.text.secondary,
        fontWeight: theme.typography.fontWeight.medium,
    },
    stepLabelActive: {
        color: theme.colors.primary[500],
        fontWeight: theme.typography.fontWeight.bold,
        fontSize: theme.typography.fontSize.base,
    },
    stepLabelCompleted: {
        color: theme.colors.success.main,
    },
    completedBadge: {
        marginLeft: theme.spacing.sm,
        backgroundColor: theme.colors.success.light ?? '#dcfce7',
        borderRadius: 99,
        paddingHorizontal: 8,
        paddingVertical: 2,
    },
    completedBadgeText: {
        fontSize: theme.typography.fontSize.xs,
        color: theme.colors.success.main,
        fontWeight: theme.typography.fontWeight.medium,
    },
    stepContent: {
        paddingBottom: theme.spacing.sm,
    },
    labelSpacer: {
        height: 12,
    },
});
