import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { supplierTheme } from '@/theme';
import { useDashboardStats } from '../hooks/useDashboardStats';

export const SalesStatsCard: React.FC = () => {
    const { data, loading, error, refetch } = useDashboardStats();

    // Loading state
    if (loading && !data) {
        return (
            <View style={styles.metricCard}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color="#00615E" />
                    <Text style={styles.loadingText}>Loading sales data...</Text>
                </View>
            </View>
        );
    }

    // Error state
    if (error) {
        return (
            <View style={styles.metricCard}>
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>Failed to load sales data</Text>
                    <TouchableOpacity onPress={refetch} style={styles.retryButton}>
                        <Text style={styles.retryButtonText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    // No data state
    if (!data) {
        return (
            <View style={styles.metricCard}>
                <View style={styles.metricHeader}>
                    <Text style={styles.metricLabel}>Sales (7 days)</Text>
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>MX$</Text>
                    </View>
                </View>
                <View style={styles.metricContent}>
                    <Text style={styles.metricValue}>0</Text>
                    <Text style={styles.metricSubtext}>No data available</Text>
                </View>
            </View>
        );
    }

    // Format percentage change
    const percentageChange = data.percentage_change;
    const isPositive = percentageChange >= 0;
    const percentageText = `${isPositive ? '+' : ''}${percentageChange.toFixed(0)}% vs. last week`;

    return (
        <View style={styles.metricCard}>
            <View style={styles.metricHeader}>
                <Text style={styles.metricLabel}>Sales (7 days)</Text>
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>MX$</Text>
                </View>
            </View>
            <View style={styles.metricContent}>
                <Text style={styles.metricValue}>{data.formatted_total}</Text>
                <Text style={[
                    styles.metricSubtext,
                    isPositive ? styles.positiveChange : styles.negativeChange
                ]}>
                    {percentageText}
                </Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    metricCard: {
        flexDirection: 'column',
        alignItems: 'flex-start',
        padding: 8,
        gap: 8,
        width: '48%',
        height: 106,
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        shadowColor: '#000000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 3,
    },
    metricHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 0,
        gap: 8,
        alignSelf: 'stretch',
    },
    metricLabel: {
        fontFamily: 'Inter',
        fontWeight: '500',
        fontSize: 14,
        lineHeight: 17,
        color: '#000000',
        flex: 1,
    },
    badge: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 4,
        paddingHorizontal: 8,
        backgroundColor: '#E0FFFE',
        borderRadius: 50,
    },
    badgeText: {
        fontFamily: 'Inter',
        fontWeight: '600',
        fontSize: 12,
        lineHeight: 17,
        color: '#00615E',
    },
    metricContent: {
        flexDirection: 'column',
        alignItems: 'flex-start',
        padding: 0,
        gap: 4,
        alignSelf: 'stretch',
    },
    metricValue: {
        fontFamily: 'Inter',
        fontWeight: '700',
        fontSize: 16,
        lineHeight: 19,
        color: '#000000',
        alignSelf: 'stretch',
    },
    metricSubtext: {
        fontFamily: 'Inter',
        fontWeight: '400',
        fontSize: 12,
        lineHeight: 17,
        color: '#666666',
        alignSelf: 'stretch',
    },
    positiveChange: {
        color: '#00AA00',
    },
    negativeChange: {
        color: '#CC0000',
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
        color: '#666666',
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
        color: '#CC0000',
        textAlign: 'center',
    },
    retryButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: '#E0FFFE',
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#00615E',
    },
    retryButtonText: {
        fontFamily: 'Inter',
        fontWeight: '500',
        fontSize: 12,
        color: '#00615E',
    },
});
