import { useState, useEffect } from 'react';
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

    useEffect(() => {
        fetchProducts();
    }, []);

    return {
        data,
        loading,
        error,
        refetch: fetchProducts,
    };
};
