import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { productsApi } from '../../products/api/products.api';
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

    const quickUpdateProduct = useCallback(async (
        productId: number,
        updates: {
            status?: 'active' | 'inactive';
            price?: number;
            stock?: number;
        }
    ) => {
        // Optimistically update the UI
        const previousData = [...data];
        setData((prev) =>
            prev.map((product) =>
                (product.marketplace_product_id || product.id) === productId
                    ? {
                        ...product,
                        ...(updates.status !== undefined && { status: updates.status }),
                        ...(updates.price !== undefined && {
                            price: updates.price,
                            formatted_price: `$${updates.price.toFixed(2)}`
                        }),
                        ...(updates.stock !== undefined && { stock_qty: updates.stock }),
                    }
                    : product
            )
        );

        try {
            await productsApi.quickUpdateProduct(productId, updates);
            return { success: true };
        } catch (error) {
            // Revert on error
            setData(previousData);
            console.error('Error quick updating product:', error);
            return { success: false, error };
        }
    }, [data]);

    useFocusEffect(
        useCallback(() => {
            fetchProducts();
        }, [])
    );

    return {
        data,
        loading,
        error,
        quickUpdateProduct,
        refetch: fetchProducts,
    };
};
