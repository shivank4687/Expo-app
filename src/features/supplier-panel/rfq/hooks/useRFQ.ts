import { useCallback, useEffect, useRef, useState } from 'react';
import { getQuotes, QuoteItem, RFQMeta, RFQStatus } from '../api/rfq.api';

interface CacheData {
    quotes: QuoteItem[];
    meta: RFQMeta | null;
}

interface UseRFQState {
    cache: Partial<Record<RFQStatus, CacheData>>;
    loading: boolean;
    refreshing: boolean;
    loadingMore: boolean;
    error: string | null;
}

export function useRFQ(status: RFQStatus) {
    const [state, setState] = useState<UseRFQState>({
        cache: {},
        loading: true,
        refreshing: false,
        loadingMore: false,
        error: null,
    });

    const currentPage = useRef(1);
    const isMounted = useRef(true);

    const quotes = state.cache[status]?.quotes || [];
    const meta = state.cache[status]?.meta || null;

    const fetch = useCallback(
        async (page: number = 1, isRefresh: boolean = false) => {
            if (!isMounted.current) return;

            setState(prev => {
                const hasData = !!prev.cache[status]?.quotes?.length;
                return {
                    ...prev,
                    loading: page === 1 && !isRefresh && !hasData,
                    refreshing: isRefresh,
                    loadingMore: page > 1,
                    error: null,
                };
            });

            try {
                const res = await getQuotes(status, page);
                if (!isMounted.current) return;

                setState(prev => {
                    const existingQuotes = prev.cache[status]?.quotes || [];
                    return {
                        ...prev,
                        cache: {
                            ...prev.cache,
                            [status]: {
                                quotes: page === 1 ? res.data : [...existingQuotes, ...res.data],
                                meta: res.meta,
                            }
                        },
                        loading: false,
                        refreshing: false,
                        loadingMore: false,
                    };
                });
                currentPage.current = page;
            } catch (err) {
                if (!isMounted.current) return;
                setState(prev => ({
                    ...prev,
                    loading: false,
                    refreshing: false,
                    loadingMore: false,
                    error: 'Failed to load quotes. Please try again.',
                }));
            }
        },
        [status]
    );

    // Fetch on status change
    useEffect(() => {
        currentPage.current = 1;
        fetch(1);
    }, [fetch]);

    // Handle unmount appropriately
    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
        };
    }, []);

    const refresh = useCallback(() => {
        currentPage.current = 1;
        fetch(1, true);
    }, [fetch]);

    // Silent refresh: re-fetches page 1 in background without showing any spinner.
    // hasData will be true so `loading` stays false; isRefresh=false so `refreshing` stays false.
    const silentRefetch = useCallback(() => {
        currentPage.current = 1;
        fetch(1, false);
    }, [fetch]);

    const loadMore = useCallback(() => {
        if (meta && currentPage.current < meta.last_page && !state.loadingMore) {
            fetch(currentPage.current + 1);
        }
    }, [fetch, meta, state.loadingMore]);

    return {
        quotes,
        meta,
        loading: state.loading,
        refreshing: state.refreshing,
        loadingMore: state.loadingMore,
        error: state.error,
        refresh,
        silentRefetch,
        loadMore
    };
}
