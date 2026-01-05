import React, { ReactNode } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, ViewStyle } from 'react-native';
import { COLORS } from '../../styles';

export interface MetricCardProps {
    title: string;
    value: string | number;
    badge?: string;
    subtitle?: string;
    subtitleColor?: string;
    loading?: boolean;
    error?: string;
    onRetry?: () => void;
    height?: number;
    style?: ViewStyle;
}

export const MetricCard: React.FC<MetricCardProps> = ({
    title,
    value,
    badge,
    subtitle,
    subtitleColor,
    loading = false,
    error,
    onRetry,
    height = 106,
    style,
}) => {
    // Loading state
    if (loading) {
        return (
            <View style={[styles.card, { height }, style]}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color={COLORS.primary} />
                    <Text style={styles.loadingText}>Loading...</Text>
                </View>
            </View>
        );
    }

    // Error state
    if (error) {
        return (
            <View style={[styles.card, { height }, style]}>
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                    {onRetry && (
                        <TouchableOpacity onPress={onRetry} style={styles.retryButton}>
                            <Text style={styles.retryButtonText}>Retry</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        );
    }

    // Success state
    return (
        <View style={[styles.card, { height }, style]}>
            <View style={styles.header}>
                <Text style={styles.title} numberOfLines={1}>{title}</Text>
                {badge && (
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>{badge}</Text>
                    </View>
                )}
            </View>
            <View style={styles.content}>
                <Text style={styles.value} numberOfLines={1}>{value}</Text>
                {subtitle && (
                    <Text
                        style={[
                            styles.subtitle,
                            subtitleColor && { color: subtitleColor }
                        ]}
                        numberOfLines={1}
                    >
                        {subtitle}
                    </Text>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        flexDirection: 'column',
        alignItems: 'flex-start',
        padding: 8,
        gap: 8,
        width: '48%',
        backgroundColor: COLORS.white,
        borderRadius: 8,
        shadowColor: COLORS.shadow,
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 3,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 0,
        gap: 8,
        alignSelf: 'stretch',
    },
    title: {
        fontFamily: 'Inter',
        fontWeight: '500',
        fontSize: 14,
        lineHeight: 17,
        color: COLORS.textPrimary,
        flex: 1,
    },
    badge: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 4,
        paddingHorizontal: 8,
        backgroundColor: COLORS.primaryLight,
        borderRadius: 50,
    },
    badgeText: {
        fontFamily: 'Inter',
        fontWeight: '600',
        fontSize: 12,
        lineHeight: 17,
        color: COLORS.primary,
    },
    content: {
        flexDirection: 'column',
        alignItems: 'flex-start',
        padding: 0,
        gap: 4,
        alignSelf: 'stretch',
    },
    value: {
        fontFamily: 'Inter',
        fontWeight: '700',
        fontSize: 16,
        lineHeight: 19,
        color: COLORS.textPrimary,
        alignSelf: 'stretch',
    },
    subtitle: {
        fontFamily: 'Inter',
        fontWeight: '400',
        fontSize: 12,
        lineHeight: 17,
        color: COLORS.textSecondary,
        alignSelf: 'stretch',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'stretch',
        gap: 8,
    },
    loadingText: {
        fontFamily: 'Inter',
        fontWeight: '400',
        fontSize: 12,
        color: COLORS.textSecondary,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'stretch',
        gap: 8,
    },
    errorText: {
        fontFamily: 'Inter',
        fontWeight: '400',
        fontSize: 12,
        color: COLORS.error,
        textAlign: 'center',
    },
    retryButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: COLORS.primaryLight,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: COLORS.primary,
    },
    retryButtonText: {
        fontFamily: 'Inter',
        fontWeight: '500',
        fontSize: 12,
        color: COLORS.primary,
    },
});
