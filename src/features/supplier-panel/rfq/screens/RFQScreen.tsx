import { Ionicons } from '@expo/vector-icons';
import React, { useState, useCallback, useRef } from 'react';
import { useFocusEffect } from 'expo-router';
import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    Text,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RFQStatus } from '../api/rfq.api';
import { RFQCard } from '../components/RFQCard';
import { RFQTabBar } from '../components/RFQTabBar';
import { useRFQ } from '../hooks/useRFQ';

export function RFQScreen() {
    const [selectedTab, setSelectedTab] = useState<RFQStatus>('new');
    const { quotes, meta, loading, refreshing, loadingMore, error, refresh, silentRefetch, loadMore } =
        useRFQ(selectedTab);

    const handleTabPress = (tab: RFQStatus) => {
        if (tab !== selectedTab) {
            setSelectedTab(tab);
        }
    };

    // Skip the very first focus — the hook already fetches on mount.
    // On every subsequent focus (back from details screen, tab switch, etc.)
    // silently re-fetch without triggering any spinner or layout jump.
    const hasMountedRef = useRef(false);
    useFocusEffect(
        useCallback(() => {
            if (!hasMountedRef.current) {
                hasMountedRef.current = true;
                return;
            }
            silentRefetch();
        }, [silentRefetch])
    );

    const renderEmpty = () => {
        if (loading) return null;
        return (
            <View style={styles.emptyState}>
                <Ionicons name="document-text-outline" size={56} color="#CCCCCC" />
                <Text style={styles.emptyTitle}>No quotes found</Text>
                <Text style={styles.emptySubtitle}>
                    There are no {selectedTab} quotes at the moment.
                </Text>
            </View>
        );
    };

    const renderFooter = () => {
        if (!loadingMore) return null;
        return (
            <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color="#00615E" />
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            {/* Header title – shown on cream background above the tab bar */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>RFQ</Text>
                {meta && (
                    <Text style={styles.headerCount}>
                        {meta.total} quote{meta.total !== 1 ? 's' : ''}
                    </Text>
                )}
            </View>

            {/* Tab bar – white background */}
            <RFQTabBar selectedTab={selectedTab} onTabPress={handleTabPress} />

            {/* Content — matches OrdersScreen: spinner when loading with no data */}
            {loading && quotes.length === 0 ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color="#00615E" />
                </View>
            ) : error ? (
                <View style={styles.centered}>
                    <Ionicons name="alert-circle-outline" size={48} color="#CC0000" />
                    <Text style={styles.errorText}>{error}</Text>
                </View>
            ) : (
                <FlatList
                    data={quotes}
                    keyExtractor={item => String(item.id)}
                    renderItem={({ item }) => <RFQCard item={item} />}
                    ListEmptyComponent={renderEmpty}
                    ListFooterComponent={renderFooter}
                    onRefresh={refresh}
                    refreshing={refreshing}
                    onEndReached={loadMore}
                    onEndReachedThreshold={0.3}
                    contentContainerStyle={[
                        styles.list,
                        quotes.length === 0 && styles.listEmpty,
                    ]}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FCF7EA',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 12,
    },
    headerTitle: {
        fontFamily: 'Inter',
        fontWeight: '700',
        fontSize: 24,
        color: '#000000',
    },
    headerCount: {
        fontFamily: 'Inter',
        fontWeight: '400',
        fontSize: 13,
        color: '#666666',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 32,
    },
    errorText: {
        fontFamily: 'Inter',
        fontSize: 14,
        color: '#CC0000',
        textAlign: 'center',
    },
    list: {
        paddingTop: 8,
        paddingBottom: 24,
    },
    listEmpty: {
        flex: 1,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
        paddingHorizontal: 32,
        paddingTop: 80,
    },
    emptyTitle: {
        fontFamily: 'Inter',
        fontWeight: '600',
        fontSize: 16,
        color: '#333333',
    },
    emptySubtitle: {
        fontFamily: 'Inter',
        fontSize: 14,
        color: '#888888',
        textAlign: 'center',
    },
    footerLoader: {
        paddingVertical: 16,
        alignItems: 'center',
    },
});
