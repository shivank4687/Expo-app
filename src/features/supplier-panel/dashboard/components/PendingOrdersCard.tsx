import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { usePendingOrdersStats } from '../hooks/usePendingOrdersStats';

export const PendingOrdersCard: React.FC = () => {
    const { data, loading, error, refetch } = usePendingOrdersStats();

    // Loading state
    if (loading && !data) {
        return (
            <View style={styles.metricCard}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color="#00615E" />
                    <Text style={styles.loadingText}>Loading...</Text>
                </View>
            </View>
        );
    }

    // Error state
    if (error) {
        return (
            <View style={styles.metricCard}>
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>Failed to load</Text>
                    <TouchableOpacity onPress={refetch} style={styles.retryButton}>
                        <Text style={styles.retryButtonText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    const pendingCount = data?.pending_count ?? 0;

    return (
        <View style={styles.metricCard}>
            <View style={styles.metricHeader}>
                <Text style={styles.metricLabel}>Pending orders</Text>
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>SLA</Text>
                </View>
            </View>
            <View style={styles.metricContent}>
                <Text style={styles.metricValue}>{pendingCount}</Text>
                <Text style={styles.metricSubtext}>Upload tracking before the deadline</Text>
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
