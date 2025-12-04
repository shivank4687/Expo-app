import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
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
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    useEffect(() => {
        loadProducts(1, true);
    }, [params.id, params.featured, params.new, selectedLocale?.code]);

    const loadProducts = async (page: number, reset: boolean = false) => {
        try {
            if (reset) {
                setIsLoading(true);
            } else {
                setIsLoadingMore(true);
            }
            setError(null);

            let response;
            
            // Check if ID is a valid number (category ID)
            const categoryId = params.id ? parseInt(params.id) : NaN;
            const isCategoryFilter = !isNaN(categoryId);
            
            if (isCategoryFilter) {
                // Get products by category
                response = await productsApi.getProductsByCategory(categoryId, {
                    page,
                    per_page: PRODUCTS_PER_PAGE,
                    locale: selectedLocale?.code,
                });
            } else {
                // Use filters (featured, new, etc.)
                const filters: Record<string, any> = {
                    page,
                    per_page: PRODUCTS_PER_PAGE,
                    locale: selectedLocale?.code,
                };

                if (params.featured === '1') {
                    filters.featured = 1;
                }
                if (params.new === '1') {
                    filters.new = 1;
                }

                response = await productsApi.getProducts(filters);
            }

            if (reset) {
                setProducts(response.data);
            } else {
                setProducts((prev) => [...prev, ...response.data]);
            }

            // Check if there are more products
            setHasMore(response.data.length === PRODUCTS_PER_PAGE);
            setCurrentPage(page);
        } catch (err: any) {
            setError(err.message || 'Failed to load products');
        } finally {
            setIsLoading(false);
            setIsLoadingMore(false);
        }
    };

    const handleLoadMore = () => {
        if (!isLoadingMore && hasMore) {
            loadProducts(currentPage + 1);
        }
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
