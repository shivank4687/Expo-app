import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { productsApi } from '@/services/api/products.api';
import { Product } from '@/features/product/types/product.types';
import { ProductCard } from '@/features/home/components/ProductCard';
import { LoadingSpinner } from '@/shared/components/LoadingSpinner';
import { ErrorMessage } from '@/shared/components/ErrorMessage';
import { theme } from '@/theme';
import { useAppSelector } from '@/store/hooks';

const PRODUCTS_PER_PAGE = 20;

export const ProductListScreen: React.FC = () => {
    const params = useLocalSearchParams<{
        id?: string;
        title?: string;
        featured?: string;
        new?: string;
    }>();
    const router = useRouter();
    const { selectedLocale } = useAppSelector((state) => state.core);
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    // Use refs to track loading state to prevent duplicate requests
    const isLoadingRef = useRef(false);
    const isLoadingMoreRef = useRef(false);

    useEffect(() => {
        loadProducts(1, true);
    }, [params.id, params.featured, params.new, selectedLocale?.code]);

    const loadProducts = async (page: number, reset: boolean = false, isRefresh: boolean = false) => {
        // Prevent duplicate requests
        if (reset && isLoadingRef.current && !isRefresh) return;
        if (!reset && isLoadingMoreRef.current) return;

        try {
            if (isRefresh) {
                setIsRefreshing(true);
            } else if (reset) {
                setIsLoading(true);
                isLoadingRef.current = true;
            } else {
                setIsLoadingMore(true);
                isLoadingMoreRef.current = true;
            }
            setError(null);

            let response;

            // Check if ID is a valid number (category ID)
            const categoryId = params.id ? parseInt(params.id) : NaN;
            const isCategoryFilter = !isNaN(categoryId);

            const options = {
                page,
                per_page: PRODUCTS_PER_PAGE,
                locale: selectedLocale?.code,
            };

            if (isCategoryFilter) {
                // Get products by category
                response = await productsApi.getProductsByCategory(categoryId, options);
            } else {
                // Use filters (featured, new, etc.)
                const filters: Record<string, any> = {
                    ...options,
                };

                if (params.featured === '1') {
                    filters.featured = 1;
                }
                if (params.new === '1') {
                    filters.new = 1;
                }

                response = await productsApi.getProducts(filters);
            }

            const newProducts = response.data || [];

            if (reset) {
                setProducts(newProducts);
            } else {
                setProducts((prev) => [...prev, ...newProducts]);
            }

            // Update pagination state
            // Use direct properties from PaginatedResponse (current_page, last_page)
            // instead of nested meta object as per global.types.ts
            if (response.current_page && response.last_page) {
                const newCurrentPage = response.current_page;
                const newTotalPages = response.last_page;
                const newHasMore = newCurrentPage < newTotalPages;

                setCurrentPage(newCurrentPage);
                setHasMore(newHasMore);
            } else {
                // Fallback attempt: check if meta exists (in case type def is mismatched)
                const meta = (response as any).meta;
                if (meta) {
                    const newCurrentPage = meta.current_page;
                    const newTotalPages = meta.last_page;
                    const newHasMore = newCurrentPage < newTotalPages;
                    setCurrentPage(newCurrentPage);
                    setHasMore(newHasMore);
                } else {
                    // Final fallback based on returned count
                    setHasMore(newProducts.length === PRODUCTS_PER_PAGE);
                    setCurrentPage(page);
                }
            }

        } catch (err: any) {
            setError(err.message || 'Failed to load products');
        } finally {
            setIsLoading(false);
            setIsLoadingMore(false);
            setIsRefreshing(false);
            isLoadingRef.current = false;
            isLoadingMoreRef.current = false;
        }
    };

    const handleLoadMore = () => {
        if (!isLoadingMore && hasMore && !isLoading) {
            loadProducts(currentPage + 1, false);
        }
    };

    const handleRefresh = () => {
        loadProducts(1, true, true);
    };

    const handleProductPress = (productId: number) => {
        router.push(`/product/${productId}`);
    };

    if (isLoading) {
        return <LoadingSpinner />;
    }

    if (error && products.length === 0) {
        return <ErrorMessage message={error} onRetry={() => loadProducts(1, true)} />;
    }

    // Determine the screen title
    const screenTitle = params.title || 'Products';

    return (
        <>
            <Stack.Screen options={{ title: screenTitle, headerBackTitle: 'Back' }} />
            <FlatList
                style={styles.container}
                data={products}
                numColumns={2}
                keyExtractor={(item) => item.id.toString()}
                columnWrapperStyle={styles.row}
                contentContainerStyle={styles.listContent}
                renderItem={({ item }) => (
                    <View style={styles.productItem}>
                        <ProductCard
                            product={item}
                            onPress={() => handleProductPress(item.id)}
                        />
                    </View>
                )}
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.5}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={handleRefresh}
                        colors={[theme.colors.primary[500]]}
                        tintColor={theme.colors.primary[500]}
                    />
                }
                ListFooterComponent={
                    isLoadingMore ? (
                        <View style={styles.loadingMore}>
                            <ActivityIndicator size="small" color={theme.colors.primary[500]} />
                            <Text style={styles.loadingText}>Loading more products...</Text>
                        </View>
                    ) : null
                }
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>No products found</Text>
                    </View>
                }
            />
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background.default,
    },
    listContent: {
        padding: theme.spacing.md,
    },
    row: {
        justifyContent: 'space-between',
    },
    productItem: {
        width: '48%',
        marginBottom: theme.spacing.md,
    },
    loadingMore: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: theme.spacing.lg,
    },
    loadingText: {
        marginLeft: theme.spacing.sm,
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.text.secondary,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: theme.spacing['3xl'],
    },
    emptyText: {
        fontSize: theme.typography.fontSize.lg,
        color: theme.colors.text.secondary,
    },
});

export default ProductListScreen;
