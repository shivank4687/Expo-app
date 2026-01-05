import { useState, useEffect } from 'react';
import { dashboardStatsApi } from '../api/dashboard-stats.api';
import { QuotesStatsResponse } from '../types/dashboard.types';

interface UseQuotesStatsReturn {
    data: QuotesStatsResponse | null;
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

/**
 * Custom hook to fetch new quotes statistics
 * @returns Quotes stats data, loading state, error state, and refetch function
 */
export const useQuotesStats = (): UseQuotesStatsReturn => {
    const [data, setData] = useState<QuotesStatsResponse | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const fetchStats = async () => {
        try {
            setLoading(true);
            setError(null);
            const stats = await dashboardStatsApi.getQuotesStats();
            setData(stats);
        } catch (err: any) {
            console.error('Error fetching quotes stats:', err);
            setError(err?.message || 'Failed to load quotes data');
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
