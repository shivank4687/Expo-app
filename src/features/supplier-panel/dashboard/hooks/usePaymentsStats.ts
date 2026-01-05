import { useState, useEffect } from 'react';
import { dashboardStatsApi } from '../api/dashboard-stats.api';
import { PaymentsStatsResponse } from '../types/dashboard.types';

interface UsePaymentsStatsReturn {
    data: PaymentsStatsResponse | null;
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

/**
 * Custom hook to fetch payments statistics (pending invoices)
 * @returns Payments stats data, loading state, error state, and refetch function
 */
export const usePaymentsStats = (): UsePaymentsStatsReturn => {
    const [data, setData] = useState<PaymentsStatsResponse | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const fetchStats = async () => {
        try {
            setLoading(true);
            setError(null);
            const stats = await dashboardStatsApi.getPaymentsStats();
            setData(stats);
        } catch (err: any) {
            console.error('Error fetching payments stats:', err);
            setError(err?.message || 'Failed to load payments data');
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
