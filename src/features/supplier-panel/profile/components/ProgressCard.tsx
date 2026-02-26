import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Text, TextStyle, View, ViewStyle } from 'react-native';

interface ProgressCardStyles {
    progressCard: ViewStyle;
    cardInner: ViewStyle;
    progressLabel: TextStyle;
    statusMessage: TextStyle;
    progressBarBackground: ViewStyle;
    progressBarFill: ViewStyle;
    tipText: TextStyle;
    actionBadge: ViewStyle;
    badgeDot: ViewStyle;
    badgeText: TextStyle;
    progressCardLoading: ViewStyle;
    placeholderBase: ViewStyle;
    placeholderLine: ViewStyle;
    placeholderLineShort: ViewStyle;
    placeholderBar: ViewStyle;
    placeholderTip: ViewStyle;
    placeholderShimmer: ViewStyle;
}

interface ProgressCardProps {
    styles: ProgressCardStyles;
    percent: number;
    completedSteps?: number;
    totalSteps?: number;
    progressLabel?: string;
    statusMessage?: string;
    tipText?: string;
    actionBadgeText?: string;
    showActionBadge?: boolean;
    isLoading?: boolean;
}

export default function ProgressCard({
    styles,
    percent,
    completedSteps,
    totalSteps,
    progressLabel,
    statusMessage,
    tipText = 'Tip: Add identity + payments to free up automatic collections.',
    actionBadgeText = 'Action Required',
    showActionBadge = true,
    isLoading = false,
}: ProgressCardProps) {
    const clampedPercent = useMemo(
        () => Math.round(Math.max(0, Math.min(percent, 100))),
        [percent]
    );
    const blinkOpacity = useRef(new Animated.Value(0.45)).current;

    useEffect(() => {
        if (!isLoading) {
            blinkOpacity.stopAnimation();
            blinkOpacity.setValue(0.45);
            return;
        }

        const animation = Animated.loop(
            Animated.sequence([
                Animated.timing(blinkOpacity, {
                    toValue: 0.8,
                    duration: 650,
                    useNativeDriver: true,
                }),
                Animated.timing(blinkOpacity, {
                    toValue: 0.35,
                    duration: 650,
                    useNativeDriver: true,
                }),
            ])
        );

        animation.start();

        return () => animation.stop();
    }, [isLoading, blinkOpacity]);

    if (isLoading) {
        return (
            <View style={[styles.progressCard, styles.progressCardLoading]}>
                <View style={styles.cardInner}>
                    {renderPlaceholder(styles, blinkOpacity, styles.placeholderLine)}
                    {renderPlaceholder(styles, blinkOpacity, styles.placeholderLineShort)}
                    <View style={[styles.progressBarBackground, styles.placeholderBar]}>
                        <Animated.View
                            style={[
                                styles.placeholderShimmer,
                                { opacity: blinkOpacity },
                            ]}
                        />
                    </View>
                    {renderPlaceholder(styles, blinkOpacity, styles.placeholderTip)}
                </View>
            </View>
        );
    }

    return (
        <View style={styles.progressCard}>
            <View style={styles.cardInner}>
                <Text style={styles.progressLabel}>
                    {progressLabel ?? `Progress: ${clampedPercent}%`}
                </Text>
                <Text style={styles.statusMessage}>
                    {statusMessage ?? getStatusMessage(percent, completedSteps, totalSteps)}
                </Text>
                <View style={styles.progressBarBackground}>
                    <View
                        style={[
                            styles.progressBarFill,
                            { width: `${clampedPercent}%` },
                        ]}
                    />
                </View>
                <Text style={styles.tipText}>{tipText}</Text>
                {showActionBadge && (
                    <View style={styles.actionBadge}>
                        <View style={styles.badgeDot} />
                        <Text style={styles.badgeText}>{actionBadgeText}</Text>
                    </View>
                )}
            </View>
        </View>
    );
}

function renderPlaceholder(
    styles: ProgressCardStyles,
    blinkOpacity: Animated.Value,
    style: ViewStyle
) {
    return (
        <View style={[styles.placeholderBase, style]}>
            <Animated.View
                style={[
                    styles.placeholderShimmer,
                    { opacity: blinkOpacity },
                ]}
            />
        </View>
    );
}

function getStatusMessage(percent: number, completedSteps?: number, totalSteps?: number) {
    if (typeof completedSteps === 'number' && typeof totalSteps === 'number' && totalSteps > 0) {
        const remaining = totalSteps - completedSteps;
        if (remaining <= 0) {
            return 'All steps complete';
        }

        return `Complete ${remaining} more step${remaining === 1 ? '' : 's'} to activate automatic payouts`;
    }

    if (percent >= 100) {
        return 'All steps complete';
    }

    return 'Complete a few steps to activate automatic payouts';
}
