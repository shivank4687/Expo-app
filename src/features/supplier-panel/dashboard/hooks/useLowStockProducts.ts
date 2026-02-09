import { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { getLowStockProducts, LowStockProduct } from '../api/low-stock-products.api';

export const useLowStockProducts = () => {
    const [data, setData] = useState<LowStockProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await getLowStockProducts();
            setData(response.products);
        } catch (err: any) {
            console.error('Error fetching low stock products:', err);
            setError(err?.response?.data?.message || err?.message || 'Failed to load products');
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchProducts();
        }, [])
    );

    return {
        data,
        loading,
        error,
        refetch: fetchProducts,
    };
};
