import { useCallback, useEffect, useState } from 'react';
import { getRFQQuotes, RFQSupplierQuotesResponse } from '../api/rfq.api';

interface UseRFQQuotesResult {
    data: RFQSupplierQuotesResponse['data'] | null;
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

export function useRFQQuotes(quoteId: number, productId: number): UseRFQQuotesResult {
    const [data, setData] = useState<RFQSupplierQuotesResponse['data'] | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const fetchQuotes = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await getRFQQuotes(quoteId, productId);
            setData(response.data);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch RFQ quotes');
        } finally {
            setLoading(false);
        }
    }, [quoteId, productId]);

    useEffect(() => {
        fetchQuotes();
    }, [fetchQuotes]);

    return { data, loading, error, refetch: fetchQuotes };
}
