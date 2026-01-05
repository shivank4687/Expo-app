/**
 * Custom hook to fetch products list for supplier panel
 */

import { useState, useEffect, useCallback } from 'react';
import { productsApi } from '../api/products.api';
import type { ProductsListResponse } from '../types/products.types';

export const useProductsList = () => {
    const [data, setData] = useState<ProductsListResponse | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const fetchProducts = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await productsApi.getProductsList();
            setData(response);
        } catch (err) {
            console.error('Error in useProductsList:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch products');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    const refetch = useCallback(() => {
        fetchProducts();
    }, [fetchProducts]);

    return {
        data,
        loading,
        error,
        refetch,
    };
};
