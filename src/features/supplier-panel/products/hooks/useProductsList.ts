/**
 * Custom hook to fetch products list for supplier panel with infinite scroll and search
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { productsApi } from '../api/products.api';
import type { Product } from '../types/products.types';

const PRODUCTS_PER_PAGE = 20;

export interface ProductsSearchParams {
    search?: string;
    status?: string;
}

export const useProductsList = (searchParams?: ProductsSearchParams) => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
    const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [hasMore, setHasMore] = useState<boolean>(true);
    const [refreshKey, setRefreshKey] = useState<number>(0);

    // Use refs to track loading state to prevent duplicate requests
    const isLoadingRef = useRef(false);
    const isLoadingMoreRef = useRef(false);

    const loadProducts = useCallback(async (page: number, reset: boolean = false, isRefresh: boolean = false) => {
        // Prevent duplicate requests
        if (reset && isLoadingRef.current && !isRefresh) return;
        if (!reset && isLoadingMoreRef.current) return;

        try {
            if (isRefresh) {
                setIsRefreshing(true);
            } else if (reset) {
                setLoading(true);
                isLoadingRef.current = true;
            } else {
                setIsLoadingMore(true);
                isLoadingMoreRef.current = true;
            }
            setError(null);

            const response = await productsApi.getProductsList({
                page,
                per_page: PRODUCTS_PER_PAGE,
                // Pass search params — backend ignores undefined values
                ...(searchParams?.search ? { search: searchParams.search } : {}),
                ...(searchParams?.status ? { status: searchParams.status } : {}),
            });

            const newProducts = response.products || [];

            if (reset) {
                setProducts(newProducts);
            } else {
                setProducts((prev) => [...prev, ...newProducts]);
            }

            // Update pagination state
            if (response.current_page && response.last_page) {
                const newCurrentPage = response.current_page;
                const newTotalPages = response.last_page;
                const newHasMore = newCurrentPage < newTotalPages;

                setCurrentPage(newCurrentPage);
                setHasMore(newHasMore);
            } else {
                // Fallback based on returned count
                const fallbackHasMore = newProducts.length === PRODUCTS_PER_PAGE;
                setHasMore(fallbackHasMore);
                setCurrentPage(page);
            }

        } catch (err) {
            console.error('Error in useProductsList:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch products');
        } finally {
            setLoading(false);
            setIsLoadingMore(false);
            setIsRefreshing(false);
            isLoadingRef.current = false;
            isLoadingMoreRef.current = false;
        }
    }, [searchParams?.search, searchParams?.status]);

    // Initial load + re-load when search params change
    useEffect(() => {
        loadProducts(1, true);
    }, [loadProducts]);

    const loadMore = useCallback(() => {
        if (!isLoadingMore && hasMore && !loading) {
            loadProducts(currentPage + 1, false);
        }
    }, [isLoadingMore, hasMore, loading, currentPage, loadProducts]);

    const refresh = useCallback(() => {
        setRefreshKey(prev => prev + 1);
        loadProducts(1, true, true);
    }, [loadProducts]);

    const reloadWithLoading = useCallback(() => {
        loadProducts(1, true, false);
    }, [loadProducts]);

    const quickUpdateProduct = useCallback(async (
        productId: number,
        updates: {
            status?: 'active' | 'inactive';
            price?: number;
            stock?: number;
        }
    ) => {
        // Optimistically update the UI
        const previousProducts = [...products];
        setProducts((prev) =>
            prev.map((product) =>
                product.id === productId
                    ? {
                        ...product,
                        ...(updates.status !== undefined && { status: updates.status }),
                        ...(updates.price !== undefined && {
                            price: updates.price,
                            formatted_price: `$${updates.price.toFixed(2)}`
                        }),
                        ...(updates.stock !== undefined && { stock: updates.stock }),
                    }
                    : product
            )
        );

        try {
            await productsApi.quickUpdateProduct(productId, updates);
            return { success: true };
        } catch (error) {
            // Revert on error
            setProducts(previousProducts);
            console.error('Error quick updating product:', error);
            return { success: false, error };
        }
    }, [products]);

    return {
        products,
        loading,
        isLoadingMore,
        isRefreshing,
        error,
        hasMore,
        loadMore,
        refresh,
        reloadWithLoading,
        quickUpdateProduct,
        refreshKey,
    };
};
