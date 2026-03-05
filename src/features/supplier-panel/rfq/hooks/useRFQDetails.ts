import { useCallback, useEffect, useState } from 'react';
import { getRFQDetails, RFQDetailsResponse } from '../api/rfq.api';

interface UseRFQDetailsResult {
    data: RFQDetailsResponse['data'] | null;
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

export function useRFQDetails(quoteId: number, productId: number): UseRFQDetailsResult {
    const [data, setData] = useState<RFQDetailsResponse['data'] | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const fetchDetails = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await getRFQDetails(quoteId, productId);
            setData(response.data);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch RFQ details');
        } finally {
            setLoading(false);
        }
    }, [quoteId, productId]);

    useEffect(() => {
        fetchDetails();
    }, [fetchDetails]);

    return { data, loading, error, refetch: fetchDetails };
}
