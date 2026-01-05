import { useState, useEffect } from 'react';
import { dashboardStatsApi } from '../api/dashboard-stats.api';
import { PendingOrdersListResponse } from '../types/dashboard.types';

interface UsePendingOrdersListReturn {
    data: PendingOrdersListResponse | null;
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

/**
 * Custom hook to fetch pending orders list
 * @returns Pending orders list data, loading state, error state, and refetch function
 */
export const usePendingOrdersList = (): UsePendingOrdersListReturn => {
    const [data, setData] = useState<PendingOrdersListResponse | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            setError(null);
            const orders = await dashboardStatsApi.getPendingOrdersList();
            setData(orders);
        } catch (err: any) {
            console.error('Error fetching pending orders list:', err);
            setError(err?.message || 'Failed to load pending orders');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    return {
        data,
        loading,
        error,
        refetch: fetchOrders,
    };
};
