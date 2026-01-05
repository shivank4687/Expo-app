import { useState, useEffect } from 'react';
import { dashboardStatsApi } from '../api/dashboard-stats.api';
import { PendingOrdersStatsResponse } from '../types/dashboard.types';

interface UsePendingOrdersStatsReturn {
    data: PendingOrdersStatsResponse | null;
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

/**
 * Custom hook to fetch pending orders statistics
 * @returns Pending orders stats data, loading state, error state, and refetch function
 */
export const usePendingOrdersStats = (): UsePendingOrdersStatsReturn => {
    const [data, setData] = useState<PendingOrdersStatsResponse | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const fetchStats = async () => {
        try {
            setLoading(true);
            setError(null);
            const stats = await dashboardStatsApi.getPendingOrdersStats();
            setData(stats);
        } catch (err: any) {
            console.error('Error fetching pending orders stats:', err);
            setError(err?.message || 'Failed to load pending orders');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    return {
        data,
        loading,
        error,
        refetch: fetchStats,
    };
};
