import { getTransactions, Transaction } from '@/features/supplier-panel/transactions/api/transactions.api';
import { TransactionCard } from '@/features/supplier-panel/transactions/components';
import { supplierTheme } from '@/theme';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TransactionsScreen() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [error, setError] = useState<string | null>(null);
    const insets = useSafeAreaInsets();

    const fetchTransactions = async (page: number = 1, isRefresh: boolean = false) => {
        try {
            if (page === 1 && !isRefresh) {
                setLoading(true);
            }

            const response = await getTransactions(page, 20);

            if (isRefresh || page === 1) {
                setTransactions(response.data);
            } else {
                setTransactions(prev => [...prev, ...response.data]);
            }

            setCurrentPage(response.meta.current_page);
            setLastPage(response.meta.last_page);
            setError(null);
        } catch (err) {
            console.error('Error fetching transactions:', err);
            setError('Failed to load transactions');
        } finally {
            setLoading(false);
            setRefreshing(false);
            setLoadingMore(false);
        }
    };

    useEffect(() => {
        fetchTransactions(1);
    }, []);

    const handleRefresh = useCallback(() => {
        setRefreshing(true);
        fetchTransactions(1, true);
    }, []);

    const handleLoadMore = useCallback(() => {
        if (!loadingMore && currentPage < lastPage) {
            setLoadingMore(true);
            fetchTransactions(currentPage + 1);
        }
    }, [loadingMore, currentPage, lastPage]);

    const formatCurrency = (amount: string) => {
        const num = parseFloat(amount);
        return `$${num.toFixed(2)}`;
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const dateStr = date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
        const timeStr = date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
        });
        return `${dateStr} at ${timeStr}`;
    };

    const renderHeader = () => (
        <View style={styles.header}>
            <Text style={styles.title}>Payouts</Text>
            {/* <Text style={styles.subtitle}>Your payout history</Text> */}
        </View>
    );

    const renderFooter = () => {
        if (!loadingMore) return null;
        return (
            <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color="#00615E" />
            </View>
        );
    };

    const renderEmpty = () => {
        if (loading) return null;
        return (
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                    {error || 'No transactions yet'}
                </Text>
            </View>
        );
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#00615E" />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
            <FlatList
                data={transactions}
                renderItem={({ item }) => (
                    <TransactionCard
                        transaction={{
                            id: item.id.toString(),
                            transaction_id: item.transaction_id,
                            comment: item.comment,
                            amount: formatCurrency(item.base_total),
                            date: formatDate(item.created_at),
                        }}
                    />
                )}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={[styles.container, { paddingBottom: insets.bottom }]}
                ListHeaderComponent={renderHeader}
                ListFooterComponent={renderFooter}
                ListEmptyComponent={renderEmpty}
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.5}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        tintColor="#00615E"
                    />
                }
                showsVerticalScrollIndicator={false}
                ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: supplierTheme.colors.background.default,
    },
    container: {
        paddingHorizontal: 16,
        paddingTop: 20,
        paddingBottom: 0,
        flexGrow: 1,
    },
    header: {
        gap: 8,
        marginBottom: 20,
    },
    title: {
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '700',
        fontSize: 24,
        lineHeight: 24,
        color: '#000000',
    },
    subtitle: {
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '500',
        fontSize: 14,
        lineHeight: 20,
        color: '#000000',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    footerLoader: {
        paddingVertical: 20,
        alignItems: 'center',
    },
    emptyContainer: {
        paddingVertical: 40,
        alignItems: 'center',
    },
    emptyText: {
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '500',
        fontSize: 16,
        lineHeight: 20,
        color: '#666666',
    },
});
