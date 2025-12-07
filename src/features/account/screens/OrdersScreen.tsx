/**
 * OrdersScreen Component
 * Displays list of customer orders with infinite scroll pagination
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { theme } from '@/theme';
import { useRequireAuth } from '@/shared/hooks/useRequireAuth';
import { ordersApi, Order } from '@/services/api/orders.api';
import { OrderCard } from '../components/OrderCard';
import { useToast } from '@/shared/components/Toast';

const ORDERS_PER_PAGE = 10;

export const OrdersScreen: React.FC = () => {
    const { t } = useTranslation();
    const { isLoading: isAuthLoading } = useRequireAuth();
    const { showToast } = useToast();
    
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [totalPages, setTotalPages] = useState(1);
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    
    // Use refs to track loading state without causing re-renders
    const isLoadingRef = useRef(false);
    const isLoadingMoreRef = useRef(false);
    const isInitialLoadRef = useRef(true);

    /**
     * Load orders with pagination
     * @param page - Page number to load
     * @param append - Whether to append to existing orders or replace
     * @param showRefreshing - Whether to show refresh indicator
     */
    const loadOrders = useCallback(async (
        page: number = 1,
        append: boolean = false,
        showRefreshing: boolean = false
    ) => {
        // Prevent duplicate requests using refs
        if (append && isLoadingMoreRef.current) {
            console.log('[OrdersScreen] Skipping - already loading more');
            return;
        }
        if (!append && !showRefreshing && isLoadingRef.current && !isInitialLoadRef.current) {
            console.log('[OrdersScreen] Skipping - already loading');
            return;
        }

        try {
            // Update refs and state
            if (showRefreshing) {
                setIsRefreshing(true);
            } else if (append) {
                setIsLoadingMore(true);
                isLoadingMoreRef.current = true;
            } else {
                setIsLoading(true);
                isLoadingRef.current = true;
            }
            
            if (!append && !showRefreshing) {
                setIsInitialLoad(false);
                isInitialLoadRef.current = false;
            }
            
            setError(null);

            const response = await ordersApi.getOrders({
                page,
                limit: ORDERS_PER_PAGE,
                sort: 'id',
                order: 'desc',
            });

            const newOrders = response.data || [];
            const meta = response.meta;

            if (append) {
                // Append new orders to existing list
                setOrders(prevOrders => [...prevOrders, ...newOrders]);
            } else {
                // Replace orders (initial load or refresh)
                setOrders(newOrders);
            }

            // Update pagination state
            if (meta) {
                const newCurrentPage = meta.current_page;
                const newTotalPages = meta.last_page;
                const newHasMore = newCurrentPage < newTotalPages;
                
                console.log('[OrdersScreen] Pagination meta:', {
                    currentPage: newCurrentPage,
                    totalPages: newTotalPages,
                    hasMore: newHasMore,
                    ordersReceived: newOrders.length,
                });
                
                setCurrentPage(newCurrentPage);
                setTotalPages(newTotalPages);
                setHasMore(newHasMore);
            } else {
                // Fallback: if no meta, check if we got less than requested
                const newHasMore = newOrders.length === ORDERS_PER_PAGE;
                console.log('[OrdersScreen] No meta, fallback pagination:', {
                    ordersReceived: newOrders.length,
                    expected: ORDERS_PER_PAGE,
                    hasMore: newHasMore,
                });
                
                setHasMore(newHasMore);
                if (newOrders.length === ORDERS_PER_PAGE) {
                    setCurrentPage(page);
                } else {
                    // If we got fewer orders than requested, we're at the last page
                    setCurrentPage(page);
                    setHasMore(false);
                }
            }
        } catch (err: any) {
            console.error('Error loading orders:', err);
            setError(err.message || t('orders.loadError', 'Failed to load orders'));
            
            // Only show toast for initial load or refresh, not for pagination
            if (!append) {
                showToast({
                    message: err.message || t('orders.loadError', 'Failed to load orders'),
                    type: 'error',
                });
            }
        } finally {
            setIsLoading(false);
            setIsLoadingMore(false);
            setIsRefreshing(false);
            isLoadingRef.current = false;
            isLoadingMoreRef.current = false;
        }
    }, [t, showToast]);

    /**
     * Initial load - fetch first page
     */
    useEffect(() => {
        if (!isAuthLoading && isInitialLoadRef.current) {
            console.log('[OrdersScreen] Initial load triggered');
            loadOrders(1, false, false);
        }
    }, [isAuthLoading, loadOrders]);

    /**
     * Handle pull-to-refresh
     */
    const handleRefresh = useCallback(() => {
        setCurrentPage(1);
        setHasMore(true);
        setIsInitialLoad(false);
        loadOrders(1, false, true);
    }, [loadOrders]);

    /**
     * Handle scroll to end - load next page
     */
    const handleLoadMore = useCallback(() => {
        console.log('[OrdersScreen] handleLoadMore called', {
            isLoadingMore,
            hasMore,
            isLoading,
            currentPage,
            ordersCount: orders.length,
        });

        if (isLoadingMore || isLoading || !hasMore) {
            console.log('[OrdersScreen] Skipping load more:', {
                isLoadingMore,
                isLoading,
                hasMore,
            });
            return;
        }

        const nextPage = currentPage + 1;
        console.log('[OrdersScreen] Loading page:', nextPage);
        loadOrders(nextPage, true, false);
    }, [isLoadingMore, hasMore, isLoading, currentPage, orders.length, loadOrders]);

    /**
     * Render footer with loading indicator
     */
    const renderFooter = () => {
        if (!isLoadingMore) return null;

        return (
            <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color={theme.colors.primary[500]} />
                <Text style={styles.footerText}>
                    {t('orders.loadingMore', 'Loading more orders...')}
                </Text>
            </View>
        );
    };

    /**
     * Render empty state
     */
    const renderEmpty = () => {
        if (isLoading) return null;

        return (
            <View style={styles.emptyState}>
                <Text style={styles.emptyText}>
                    {t('orders.empty', 'No orders yet')}
                </Text>
                <Text style={styles.emptySubtext}>
                    {t('orders.emptySubtext', 'Start shopping to see your orders here')}
                </Text>
            </View>
        );
    };

    if (isAuthLoading || (isInitialLoad && isLoading)) {
        return (
            <>
                <Stack.Screen options={{ title: t('orders.title', 'My Orders'), headerBackTitle: t('common.back', 'Back') }} />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.colors.primary[500]} />
                </View>
            </>
        );
    }

    return (
        <>
            <Stack.Screen 
                options={{ 
                    title: t('orders.title', 'My Orders'), 
                    headerBackTitle: t('common.back', 'Back') 
                }} 
            />
            <View style={styles.container}>
                {error && !orders.length ? (
                    <View style={styles.errorContainer}>
                        <Text style={styles.errorText}>{error}</Text>
                        <Text 
                            style={styles.retryText}
                            onPress={() => loadOrders(1, false, false)}
                        >
                            {t('orders.retry', 'Tap to retry')}
                        </Text>
                    </View>
                ) : (
                    <FlatList
                        data={orders}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={({ item }) => <OrderCard order={item} />}
                        contentContainerStyle={[
                            styles.listContent,
                            orders.length === 0 && styles.emptyContent
                        ]}
                        ListEmptyComponent={renderEmpty}
                        ListFooterComponent={renderFooter}
                        refreshControl={
                            <RefreshControl
                                refreshing={isRefreshing}
                                onRefresh={handleRefresh}
                                colors={[theme.colors.primary[500]]}
                                tintColor={theme.colors.primary[500]}
                            />
                        }
                        onEndReached={handleLoadMore}
                        onEndReachedThreshold={0.2}
                        removeClippedSubviews={false}
                        maxToRenderPerBatch={10}
                        updateCellsBatchingPeriod={50}
                        initialNumToRender={10}
                        windowSize={21}
                        maintainVisibleContentPosition={null}
                    />
                )}
            </View>
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background.default,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.background.default,
    },
    listContent: {
        paddingVertical: theme.spacing.sm,
    },
    emptyContent: {
        flexGrow: 1,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: theme.spacing.xl,
    },
    footerLoader: {
        paddingVertical: theme.spacing.lg,
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.spacing.sm,
    },
    footerText: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.text.secondary,
        marginTop: theme.spacing.xs,
    },
    emptyText: {
        fontSize: theme.typography.fontSize.xl,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.sm,
        textAlign: 'center',
    },
    emptySubtext: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.text.secondary,
        textAlign: 'center',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: theme.spacing.xl,
    },
    errorText: {
        fontSize: theme.typography.fontSize.md,
        color: theme.colors.error.main,
        marginBottom: theme.spacing.md,
        textAlign: 'center',
    },
    retryText: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.primary[500],
        textDecorationLine: 'underline',
    },
});

export default OrdersScreen;
