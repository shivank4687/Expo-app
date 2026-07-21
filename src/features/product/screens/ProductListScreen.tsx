import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { productsApi } from '@/services/api/products.api';
import { Product } from '@/features/product/types/product.types';
import { ProductCard } from '@/features/home/components/ProductCard';
import { LoadingSpinner } from '@/shared/components/LoadingSpinner';
import { ErrorMessage } from '@/shared/components/ErrorMessage';
import { ProductFilterBar } from '@/shared/components/ProductFilterBar';
import { SortModal } from '@/shared/components/SortModal';
import { FilterModal } from '@/shared/components/FilterModal';
import { TopHeader } from '@/shared/components/TopHeader';
import { theme } from '@/theme';
import { useAppSelector } from '@/store/hooks';
import { FilterState } from '@/types/filters.types';
import { SORT_OPTIONS } from '@/constants/sortOptions';
import { Ionicons } from '@expo/vector-icons';

const PRODUCTS_PER_PAGE = 20;

export const ProductListScreen: React.FC = () => {
    const params = useLocalSearchParams<{
        id?: string;
        title?: string;
        featured?: string;
        new?: string;
        on_sale?: string;
    }>();
    const router = useRouter();
    const { selectedLocale } = useAppSelector((state) => state.core);
    const cartItemsCount = useAppSelector((state) => state.cart.cart?.items_count || 0);
    const { user } = useAppSelector((state) => state.auth);

    const cartRightContent = (
        <TouchableOpacity
            onPress={() => router.push('/(drawer)/(tabs)/cart')}
            style={styles.cartButton}
            activeOpacity={0.7}
        >
            <View style={styles.cartIconWrapper}>
                <Ionicons name="cart-outline" size={22} color="#000000" />
                {cartItemsCount > 0 && (
                    <View style={styles.cartBadge}>
                        <Text style={styles.cartBadgeText}>
                            {cartItemsCount > 99 ? '99+' : cartItemsCount}
                        </Text>
                    </View>
                )}
            </View>
        </TouchableOpacity>
    );
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    // Filter and sort state
    const [sortBy, setSortBy] = useState<string>('');
    const [filters, setFilters] = useState<FilterState>({
        price: null,
        attributes: {},
    });
    const [isSortModalVisible, setIsSortModalVisible] = useState(false);
    const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);

    // Use refs to track loading state to prevent duplicate requests
    const isLoadingRef = useRef(false);
    const isLoadingMoreRef = useRef(false);

    useEffect(() => {
        loadProducts(1, true);
    }, [params.id, params.featured, params.new, selectedLocale?.code, sortBy, filters, user?.customer_group_id]);

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

            const options: Record<string, any> = {
                page,
                per_page: PRODUCTS_PER_PAGE,
                locale: selectedLocale?.code,
            };

            // Add sort parameter
            if (sortBy) {
                options.sort = sortBy;
            }

            // Add price filter
            if (filters.price) {
                options.price = filters.price;
            }

            // Add attribute filters
            Object.keys(filters.attributes).forEach((key) => {
                const values = filters.attributes[key];
                if (values && values.length > 0) {
                    options[key] = values.join(',');
                }
            });

            if (isCategoryFilter) {
                // Get products by category
                response = await productsApi.getProductsByCategory(categoryId, options);
            } else {
                // Use filters (featured, new, etc.)
                const productFilters: Record<string, any> = {
                    ...options,
                };

                if (params.featured === '1') {
                    productFilters.featured = 1;
                }
                if (params.new === '1') {
                    productFilters.new = 1;
                }
                if (params.on_sale === '1') {
                    productFilters.on_sale = 1;
                }

                // Ensure visibility and status filters are applied
                productFilters.status = 1;
                productFilters.visible_individually = 1;

                response = await productsApi.getProducts(productFilters);
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

    const handleSortSelect = (value: string) => {
        setSortBy(value);
    };

    const handleFilterApply = (newFilters: FilterState) => {
        setFilters(newFilters);
    };

    const getActiveFilterCount = (): number => {
        let count = 0;
        if (filters.price) count++;
        count += Object.keys(filters.attributes).length;
        return count;
    };

    // Get category ID for filter modal
    const categoryId = params.id ? parseInt(params.id) : undefined;

    // Determine the screen title early to avoid flickering
    const screenTitle = params.title || 'Products';

    if (isLoading && products.length === 0) {
        return (
            <View style={styles.container}>
                <Stack.Screen options={{ headerShown: false }} />
                <TopHeader title={screenTitle} onBack={() => router.back()} rightContent={cartRightContent} />
                <LoadingSpinner />
            </View>
        );
    }

    if (error && products.length === 0) {
        return (
            <View style={styles.container}>
                <Stack.Screen options={{ headerShown: false }} />
                <TopHeader title={screenTitle} onBack={() => router.back()} rightContent={cartRightContent} />
                <ErrorMessage message={error} onRetry={() => loadProducts(1, true)} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />
            <TopHeader title={screenTitle} onBack={() => router.back()} rightContent={cartRightContent} />
            <FlatList
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

            {/* Filter Bar */}
            <ProductFilterBar
                onSortPress={() => setIsSortModalVisible(true)}
                onFilterPress={() => setIsFilterModalVisible(true)}
                filterCount={getActiveFilterCount()}
            />

            {/* Sort Modal */}
            <SortModal
                visible={isSortModalVisible}
                onClose={() => setIsSortModalVisible(false)}
                options={SORT_OPTIONS}
                selectedValue={sortBy}
                onSelect={handleSortSelect}
            />

            {/* Filter Modal */}
            <FilterModal
                visible={isFilterModalVisible}
                onClose={() => setIsFilterModalVisible(false)}
                categoryId={categoryId}
                currentFilters={filters}
                onApply={handleFilterApply}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background.default,
    },
    listContent: {
        padding: theme.spacing.md,
        paddingBottom: 80, // Add padding for fixed filter bar
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
    cartButton: {
        padding: 4,
    },
    cartIconWrapper: {
        position: 'relative',
        justifyContent: 'center',
        alignItems: 'center',
    },
    cartBadge: {
        position: 'absolute',
        top: -4,
        right: -10,
        minWidth: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: theme.colors.error.main,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 3,
    },
    cartBadgeText: {
        color: theme.colors.white,
        fontSize: 9,
        fontWeight: '700',
        lineHeight: 12,
    },
});

export default ProductListScreen;
