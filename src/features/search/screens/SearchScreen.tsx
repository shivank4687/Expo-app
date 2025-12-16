import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    FlatList,
    ActivityIndicator,
    Platform,
    Keyboard,
    ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { productsApi } from '@/services/api/products.api';
import { categoriesApi, Category } from '@/services/api/categories.api';
import { Product } from '@/features/product/types/product.types';
import { ProductCard } from '@/features/home/components/ProductCard';
import { ProductFilterBar } from '@/shared/components/ProductFilterBar';
import { SortModal } from '@/shared/components/SortModal';
import { FilterModal } from '@/shared/components/FilterModal';
import { theme } from '@/theme';
import { FilterState } from '@/types/filters.types';
import { SORT_OPTIONS } from '@/constants/sortOptions';

/**
 * SearchScreen Component
 * Provides a dedicated search interface with:
 * - Custom header with back button, search input, and mic icon
 * - Real-time product search
 * - Product grid display
 * - Empty states for no query and no results
 */
export const SearchScreen: React.FC = () => {
    const router = useRouter();
    const { t } = useTranslation();
    const searchInputRef = useRef<TextInput>(null);

    // Pagination constants
    const PRODUCTS_PER_PAGE = 20;

    const [searchQuery, setSearchQuery] = useState('');
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [isCategoriesLoading, setIsCategoriesLoading] = useState(true);
    const [hasSearched, setHasSearched] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Pagination state
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

    // Refs for safe async handling
    const isLoadingRef = useRef(false);
    const isLoadingMoreRef = useRef(false);
    const searchQueryRef = useRef('');

    /**
     * Load parent categories on mount
     */
    useEffect(() => {
        const loadCategories = async () => {
            try {
                setIsCategoriesLoading(true);
                const response = await categoriesApi.getCategories();
                // Only get parent categories (those with parent_id === 1 or top-level categories)
                const parentCategories = response.data || [];
                setCategories(parentCategories);
            } catch (err) {
                console.error('[SearchScreen] Error loading categories:', err);
            } finally {
                setIsCategoriesLoading(false);
            }
        };

        loadCategories();
    }, []);

    /**
     * Perform search API call with pagination
     */
    const performSearch = useCallback(async (query: string, page: number = 1, append: boolean = false) => {
        const trimmedQuery = query.trim();

        if (!trimmedQuery) {
            setProducts([]);
            setHasSearched(false);
            return;
        }

        // Prevent duplicate requests
        if (append && isLoadingMoreRef.current) return;
        if (!append && isLoadingRef.current) return;

        try {
            if (append) {
                setIsLoadingMore(true);
                isLoadingMoreRef.current = true;
            } else {
                setIsLoading(true);
                isLoadingRef.current = true;
                setHasSearched(true);
            }

            setError(null);

            // Keep query ref in sync
            searchQueryRef.current = trimmedQuery;

            // Build filter options
            const options: Record<string, any> = {
                page,
                per_page: PRODUCTS_PER_PAGE,
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

            const response = await productsApi.searchProducts(trimmedQuery, options);

            const newProducts = response.data || [];

            if (append) {
                setProducts(prev => [...prev, ...newProducts]);
            } else {
                setProducts(newProducts);
            }

            // Update pagination state
            if (response.current_page && response.last_page) {
                const newCurrentPage = response.current_page;
                const newTotalPages = response.last_page;

                setCurrentPage(newCurrentPage);
                setHasMore(newCurrentPage < newTotalPages);
            } else {
                // Fallback / legacy meta check
                const meta = (response as any).meta;
                if (meta) {
                    setCurrentPage(meta.current_page);
                    setHasMore(meta.current_page < meta.last_page);
                } else {
                    // Primitive fallback
                    setHasMore(newProducts.length === PRODUCTS_PER_PAGE);
                    setCurrentPage(page);
                }
            }

        } catch (err: any) {
            console.error('[SearchScreen] Search error:', err);
            if (!append) {
                setError(err.message || 'Failed to search products');
                setProducts([]);
            }
        } finally {
            setIsLoading(false);
            setIsLoadingMore(false);
            isLoadingRef.current = false;
            isLoadingMoreRef.current = false;
        }
    }, [sortBy, filters]); // Add filters and sortBy to dependencies

    /**
     * Handle search submission (new search)
     */
    const handleSearch = useCallback(() => {
        Keyboard.dismiss();
        setCurrentPage(1);
        setHasMore(true);
        performSearch(searchQuery, 1, false);
    }, [searchQuery, performSearch]);

    /**
     * Handle load more (infinite scroll)
     */
    const handleLoadMore = useCallback(() => {
        if (!isLoadingMore && hasMore && !isLoading && searchQueryRef.current) {
            performSearch(searchQueryRef.current, currentPage + 1, true);
        }
    }, [isLoadingMore, hasMore, isLoading, currentPage, performSearch]);

    /**
     * Handle category chip press - navigate to category detail
     */
    const handleCategoryPress = useCallback((categoryId: number, categoryName: string) => {
        router.push(`/category/${categoryId}?name=${encodeURIComponent(categoryName)}`);
    }, [router]);

    /**
     * Handle voice search (placeholder for now)
     */
    const handleVoiceSearch = useCallback(() => {
        // TODO: Implement voice search functionality
        console.log('Voice search pressed');
    }, []);

    /**
     * Clear search and reset state
     */
    const handleClearSearch = useCallback(() => {
        setSearchQuery('');
        searchQueryRef.current = '';
        setProducts([]);
        setHasSearched(false);
        setError(null);
        setCurrentPage(1);
        setHasMore(true);
        searchInputRef.current?.focus();
    }, []);

    /**
     * Navigate to product detail
     */
    const handleProductPress = useCallback((product: Product) => {
        router.push(`/product/${product.id}`);
    }, [router]);

    const handleSortSelect = (value: string) => {
        setSortBy(value);
        // Re-trigger search with new sort
        if (searchQuery.trim()) {
            setCurrentPage(1);
            setHasMore(true);
            performSearch(searchQuery, 1, false);
        }
    };

    const handleFilterApply = (newFilters: FilterState) => {
        setFilters(newFilters);
        // Re-trigger search with new filters
        if (searchQuery.trim()) {
            setCurrentPage(1);
            setHasMore(true);
            performSearch(searchQuery, 1, false);
        }
    };

    const getActiveFilterCount = (): number => {
        let count = 0;
        if (filters.price) count++;
        count += Object.keys(filters.attributes).length;
        return count;
    };

    /**
     * Render product item in grid
     */
    const renderProductItem = useCallback(({ item }: { item: Product }) => (
        <View style={styles.productItem}>
            <ProductCard
                product={item}
                onPress={() => handleProductPress(item)}
            />
        </View>
    ), [handleProductPress]);

    /**
     * Render empty state based on search status
     */
    const renderEmptyState = () => {
        if (isLoading) {
            return null;
        }

        if (error) {
            return (
                <View style={styles.emptyContainer}>
                    <Ionicons
                        name="alert-circle-outline"
                        size={64}
                        color={theme.colors.error.main}
                    />
                    <Text style={styles.emptyTitle}>{t('search.oopsSomethingWrong')}</Text>
                    <Text style={styles.emptyMessage}>{error}</Text>
                    <TouchableOpacity
                        style={styles.retryButton}
                        onPress={handleSearch}
                    >
                        <Text style={styles.retryButtonText}>{t('search.tryAgain')}</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        if (!hasSearched) {
            return (
                <View style={styles.emptyContainer}>
                    <Ionicons
                        name="search-outline"
                        size={64}
                        color={theme.colors.gray[400]}
                    />
                    <Text style={styles.emptyTitle}>{t('search.searchForProducts')}</Text>
                    <Text style={styles.emptyMessage}>
                        {t('search.searchPlaceholder')}
                    </Text>
                </View>
            );
        }

        if (hasSearched && products.length === 0) {
            return (
                <View style={styles.emptyContainer}>
                    <Ionicons
                        name="file-tray-outline"
                        size={64}
                        color={theme.colors.gray[400]}
                    />
                    <Text style={styles.emptyTitle}>{t('search.noProductsFound')}</Text>
                    <Text style={styles.emptyMessage}>
                        {t('search.noProductsMessage', { query: searchQuery })}
                    </Text>
                    <Text style={styles.emptySubMessage}>
                        {t('search.tryDifferentKeywords')}
                    </Text>
                    <TouchableOpacity
                        style={styles.clearButton}
                        onPress={handleClearSearch}
                    >
                        <Text style={styles.clearButtonText}>{t('search.clearSearch')}</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        return null;
    };

    /**
     * Render loading indicator
     */
    const renderFooter = () => {
        if (isLoadingMore) {
            return (
                <View style={[styles.loadingContainer, { paddingVertical: theme.spacing.lg }]}>
                    <ActivityIndicator size="small" color={theme.colors.primary[500]} />
                    <Text style={styles.loadingText}>{t('search.loadingMore')}</Text>
                </View>
            );
        }

        if (isLoading) {
            return (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.colors.primary[500]} />
                    <Text style={styles.loadingText}>{t('search.searching')}</Text>
                </View>
            );
        }

        return null;
    };

    /**
     * Render category chips carousel
     */
    const renderCategoryChips = () => {
        // Only show when there are no products or before searching
        if (hasSearched && products.length > 0) {
            return null;
        }

        if (isCategoriesLoading) {
            return (
                <View style={styles.categoriesContainer}>
                    <ActivityIndicator size="small" color={theme.colors.primary[500]} />
                </View>
            );
        }

        if (categories.length === 0) {
            return null;
        }

        return (
            <View style={styles.categoriesContainer}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.categoriesScrollContent}
                >
                    {categories.map((category) => (
                        <TouchableOpacity
                            key={category.id}
                            style={styles.categoryChip}
                            onPress={() => handleCategoryPress(category.id, category.name)}
                            activeOpacity={0.7}
                        >
                            <Text
                                style={styles.categoryChipText}
                                numberOfLines={1}
                            >
                                {category.name}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>
        );
    };

    /**
     * Render results count
     */
    const renderResultsHeader = () => {
        if (!hasSearched || products.length === 0 || isLoading) {
            return null;
        }

        return (
            <View style={styles.resultsHeader}>
                <Text style={styles.resultsText}>
                    {t('search.foundProducts', { count: products.length })}
                    {/* Ideally API returns total count for accurate "Found X products", currently usually just getting local count or page meta total */}
                </Text>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            {/* Custom Search Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={styles.backButton}
                >
                    <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
                </TouchableOpacity>

                <View style={styles.searchInputContainer}>
                    <Ionicons
                        name="search-outline"
                        size={20}
                        color={theme.colors.text.secondary}
                    />
                    <TextInput
                        ref={searchInputRef}
                        style={styles.searchInput}
                        placeholder={t('search.searchProducts')}
                        placeholderTextColor={theme.colors.text.secondary}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        onSubmitEditing={handleSearch}
                        returnKeyType="search"
                        autoFocus
                        autoCorrect={false}
                        autoCapitalize="none"
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity
                            onPress={handleClearSearch}
                            style={styles.clearIcon}
                        >
                            <Ionicons
                                name="close-circle"
                                size={20}
                                color={theme.colors.text.secondary}
                            />
                        </TouchableOpacity>
                    )}
                </View>

                <TouchableOpacity
                    onPress={handleVoiceSearch}
                    style={styles.micButton}
                >
                    <Ionicons name="mic-outline" size={24} color={theme.colors.text.primary} />
                </TouchableOpacity>
            </View>

            {/* Category Chips Carousel */}
            {renderCategoryChips()}

            {/* Results Header */}
            {renderResultsHeader()}

            {/* Product Grid */}
            <FlatList
                data={products}
                renderItem={renderProductItem}
                keyExtractor={(item) => item.id.toString()}
                numColumns={2}
                contentContainerStyle={styles.productList}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={renderEmptyState}
                ListFooterComponent={renderFooter}
                keyboardShouldPersistTaps="handled"
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.5}
            />

            {/* Filter Bar - Only show when there are search results */}
            {hasSearched && products.length > 0 && (
                <>
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
                        currentFilters={filters}
                        onApply={handleFilterApply}
                    />
                </>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.white,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingBottom: theme.spacing.md,
        paddingHorizontal: theme.spacing.md,
        backgroundColor: theme.colors.white,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.gray[200],
        ...theme.shadows.sm,
    },
    backButton: {
        padding: theme.spacing.xs,
        marginRight: theme.spacing.sm,
    },
    searchInputContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.gray[100],
        borderRadius: theme.borderRadius.full,
        paddingHorizontal: theme.spacing.md,
        height: 44,
    },
    searchInput: {
        flex: 1,
        marginLeft: theme.spacing.sm,
        fontSize: theme.typography.fontSize.md,
        color: theme.colors.text.primary,
        paddingVertical: 0, // Remove default padding for better alignment
    },
    clearIcon: {
        padding: theme.spacing.xs,
    },
    micButton: {
        padding: theme.spacing.xs,
        marginLeft: theme.spacing.sm,
    },
    categoriesContainer: {
        backgroundColor: theme.colors.white,
        paddingVertical: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.gray[200],
        minHeight: 60,
    },
    categoriesScrollContent: {
        paddingHorizontal: theme.spacing.md,
        gap: theme.spacing.sm,
    },
    categoryChip: {
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.sm,
        borderRadius: theme.borderRadius.full,
        backgroundColor: theme.colors.gray[100],
        borderWidth: 1,
        borderColor: theme.colors.gray[200],
        marginRight: theme.spacing.sm,
    },
    categoryChipText: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.text.primary,
        fontWeight: theme.typography.fontWeight.medium,
    },
    resultsHeader: {
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.md,
        backgroundColor: theme.colors.gray[50],
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.gray[200],
    },
    resultsText: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.text.secondary,
        fontWeight: theme.typography.fontWeight.medium,
    },
    productList: {
        padding: theme.spacing.sm,
        paddingBottom: 100, // Add padding for fixed filter bar
    },
    productItem: {
        width: '50%',
        padding: theme.spacing.sm,
    },
    loadingContainer: {
        paddingVertical: theme.spacing.xl,
        alignItems: 'center',
    },
    loadingText: {
        marginTop: theme.spacing.md,
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.text.secondary,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.xl * 2,
        paddingVertical: theme.spacing.xl * 3,
    },
    emptyTitle: {
        fontSize: theme.typography.fontSize.xl,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.text.primary,
        marginTop: theme.spacing.lg,
        marginBottom: theme.spacing.sm,
        textAlign: 'center',
    },
    emptyMessage: {
        fontSize: theme.typography.fontSize.md,
        color: theme.colors.text.secondary,
        textAlign: 'center',
        lineHeight: 22,
    },
    emptySubMessage: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.text.secondary,
        textAlign: 'center',
        marginTop: theme.spacing.sm,
        lineHeight: 20,
    },
    retryButton: {
        marginTop: theme.spacing.xl,
        paddingHorizontal: theme.spacing.xl,
        paddingVertical: theme.spacing.md,
        backgroundColor: theme.colors.primary[500],
        borderRadius: theme.borderRadius.md,
    },
    retryButtonText: {
        color: theme.colors.white,
        fontSize: theme.typography.fontSize.md,
        fontWeight: theme.typography.fontWeight.semiBold,
    },
    clearButton: {
        marginTop: theme.spacing.xl,
        paddingHorizontal: theme.spacing.xl,
        paddingVertical: theme.spacing.md,
        backgroundColor: theme.colors.white,
        borderWidth: 1,
        borderColor: theme.colors.primary[500],
        borderRadius: theme.borderRadius.md,
    },
    clearButtonText: {
        color: theme.colors.primary[500],
        fontSize: theme.typography.fontSize.md,
        fontWeight: theme.typography.fontWeight.semiBold,
    },
});

export default SearchScreen;

