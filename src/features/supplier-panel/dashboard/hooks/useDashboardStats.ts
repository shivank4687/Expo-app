import { useState, useEffect } from 'react';
import { dashboardStatsApi } from '../api/dashboard-stats.api';
import { SalesStatsResponse } from '../types/dashboard.types';

interface UseDashboardStatsReturn {
    data: SalesStatsResponse | null;
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

/**
 * Custom hook to fetch dashboard sales statistics
 * @returns Dashboard stats data, loading state, error state, and refetch function
 */
export const useDashboardStats = (): UseDashboardStatsReturn => {
    const [data, setData] = useState<SalesStatsResponse | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const fetchStats = async () => {
        try {
            setLoading(true);
            setError(null);
            const stats = await dashboardStatsApi.getSalesStats();
            setData(stats);
        } catch (err: any) {
            console.error('Error fetching dashboard stats:', err);
            setError(err?.message || 'Failed to load sales statistics');
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
