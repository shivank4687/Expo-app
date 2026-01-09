import { useState, useEffect, useCallback } from 'react';
import { getOrders, Order, OrdersResponse } from '../api/orders.api';

interface UseOrdersListResult {
    orders: Order[];
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
    loadMore: () => Promise<void>;
    hasMore: boolean;
    currentPage: number;
    totalPages: number;
    total: number;
}

/**
 * Hook to fetch and manage orders list
 * @param filter - 'pending' | 'shipped' | 'issues'
 */
export const useOrdersList = (
    filter: 'pending' | 'shipped' | 'issues' = 'pending'
): UseOrdersListResult => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [totalPages, setTotalPages] = useState<number>(1);
    const [total, setTotal] = useState<number>(0);
    const [hasMore, setHasMore] = useState<boolean>(false);

    const fetchOrders = useCallback(
        async (page: number = 1, append: boolean = false) => {
            try {
                setLoading(true);
                setError(null);

                const response: OrdersResponse = await getOrders(filter, page, 20);

                if (append) {
                    setOrders((prev) => [...prev, ...response.data]);
                } else {
                    setOrders(response.data);
                }

                setCurrentPage(response.meta.current_page);
                setTotalPages(response.meta.last_page);
                setTotal(response.meta.total);
                setHasMore(response.meta.current_page < response.meta.last_page);
            } catch (err: any) {
                setError(err.message || 'Failed to fetch orders');
                console.error('Error fetching orders:', err);
            } finally {
                setLoading(false);
            }
        },
        [filter]
    );

    // Initial fetch when filter changes
    useEffect(() => {
        setCurrentPage(1);
        fetchOrders(1, false);
    }, [filter, fetchOrders]);

    // Refetch from the beginning
    const refetch = useCallback(async () => {
        setCurrentPage(1);
        await fetchOrders(1, false);
    }, [fetchOrders]);

    // Load more (pagination)
    const loadMore = useCallback(async () => {
        if (hasMore && !loading) {
            const nextPage = currentPage + 1;
            await fetchOrders(nextPage, true);
        }
    }, [hasMore, loading, currentPage, fetchOrders]);

    return {
        orders,
        loading,
        error,
        refetch,
        loadMore,
        hasMore,
        currentPage,
        totalPages,
        total,
    };
};
