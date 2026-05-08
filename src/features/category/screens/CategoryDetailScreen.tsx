import { SORT_OPTIONS } from '@/constants/sortOptions';
import { Product } from '@/features/product/types/product.types';
import { categoriesApi, Category } from '@/services/api/categories.api';
import { productsApi } from '@/services/api/products.api';
import { ErrorMessage } from '@/shared/components/ErrorMessage';
import { FilterModal } from '@/shared/components/FilterModal';
import { BannerImage, CategoryImage } from '@/shared/components/LazyImage';
import { LoadingSpinner } from '@/shared/components/LoadingSpinner';
import { ProductFilterBar } from '@/shared/components/ProductFilterBar';
import { SortModal } from '@/shared/components/SortModal';
import { theme } from '@/theme';
import { FilterState } from '@/types/filters.types';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAppSelector } from '@/store/hooks';
import React, { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View, Keyboard, TextInput } from 'react-native';
import { SearchHeader } from '@/features/search/components/SearchHeader';
import { CategoryProductGrid } from '../components/CategoryProductGrid';
const PRODUCTS_PER_PAGE = 12; // Increased for grid view


export const CategoryDetailScreen: React.FC = () => {
    const { id, name } = useLocalSearchParams<{ id: string; name?: string }>();
    const router = useRouter();
    const { t } = useTranslation();
    const [category, setCategory] = useState<Category | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const { categories } = useAppSelector((state) => state.category);

    // Helper to recursively find a category within the nested categories tree
    const findCategoryById = (cats: Category[], targetId: number): Category | null => {
        for (const cat of cats) {
            if (cat.id === targetId) return cat;
            if (cat.children && cat.children.length > 0) {
                const found = findCategoryById(cat.children, targetId);
                if (found) return found;
            }
        }
        return null;
    };

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Filter and sort state
    const [sortBy, setSortBy] = useState<string>('');
    const [filters, setFilters] = useState<FilterState>({
        price: null,
        attributes: {},
    });
    const [isSortModalVisible, setIsSortModalVisible] = useState(false);
    const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);

    // Use the name from params if available, otherwise use loaded category name
    const displayName = category?.name || name || 'Category';

    // Search state
    const [searchQuery, setSearchQuery] = useState(displayName);
    const searchInputRef = useRef<TextInput>(null);

    // Use a ref to track the applied query for pagination and mode checks
    const appliedQueryRef = useRef(displayName);

    // Check if we are actively in global search mode based on the *applied* query
    const isSearchMode = appliedQueryRef.current.trim() !== '' && 
                         appliedQueryRef.current.trim().toLowerCase() !== displayName.toLowerCase();

    useEffect(() => {
        if (id) {
            loadCategoryData();
        }
    }, [id, sortBy, filters]);

    const loadCategoryData = async () => {
        try {
            setIsLoading(true);
            setError(null);

            // Build filter options
            const options: Record<string, any> = {
                per_page: PRODUCTS_PER_PAGE,
                page: 1,
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

            const parsedId = parseInt(id);

            // Try to find the category in the Redux store first
            let categoryData = findCategoryById(categories, parsedId);

            // Fetch products and (if needed) fallback category data in parallel
            let productsPromise;
            
            // Recalculate mode locally to avoid closure staleness immediately after ref mutation
            const currentAppliedQuery = appliedQueryRef.current.trim();
            const currentIsSearchMode = currentAppliedQuery !== '' && 
                                        currentAppliedQuery.toLowerCase() !== displayName.toLowerCase();

            if (currentIsSearchMode) {
                productsPromise = productsApi.searchProducts(currentAppliedQuery, options);
            } else {
                productsPromise = productsApi.getProductsByCategory(parsedId, options);
            }
            const categoryPromise = !categoryData ? categoriesApi.getCategoryById(parsedId) : Promise.resolve(null);

            const [productsData, fallbackCategoryData] = await Promise.all([
                productsPromise,
                categoryPromise,
            ]);

            if (fallbackCategoryData) {
                categoryData = fallbackCategoryData;
            }

            setCategory(categoryData);
            setProducts(productsData.data);
            const meta = productsData.meta;
            setCurrentPage(productsData.current_page || meta?.current_page || 1);
            setTotalPages(productsData.last_page || meta?.last_page || 1);
            // console.log('CategoryDetailScreen - Category loaded:', {
            //     id: categoryData.id,
            //     name: categoryData.name,
            //     hasChildren: !!categoryData.children,
            //     childrenCount: categoryData.children?.length || 0,
            //     children: categoryData.children,
            //     productsCount: productsData.data.length,
            //     totalPages: productsData.last_page
            // });
        } catch (err: any) {
            setError(err.message || 'Failed to load category');
        } finally {
            setIsLoading(false);
        }
    };

    const loadMoreProducts = async () => {
        if (isLoadingMore || currentPage >= totalPages) return;

        setIsLoadingMore(true);
        try {
            const nextPage = currentPage + 1;

            // Build filter options
            const options: Record<string, any> = {
                per_page: PRODUCTS_PER_PAGE,
                page: nextPage,
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

            // Recalculate mode locally
            const currentAppliedQuery = appliedQueryRef.current.trim();
            const currentIsSearchMode = currentAppliedQuery !== '' && 
                                        currentAppliedQuery.toLowerCase() !== displayName.toLowerCase();

            let productsData;
            if (currentIsSearchMode) {
                productsData = await productsApi.searchProducts(currentAppliedQuery, options);
            } else {
                productsData = await productsApi.getProductsByCategory(parseInt(id), options);
            }
            setProducts([...products, ...productsData.data]);
            const meta = productsData.meta;
            setCurrentPage(productsData.current_page || meta?.current_page || nextPage);
            setTotalPages(productsData.last_page || meta?.last_page || totalPages);
        } catch (err: any) {
            console.error('Failed to load more products:', err);
        } finally {
            setIsLoadingMore(false);
        }
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            const options = {
                per_page: PRODUCTS_PER_PAGE,
                page: 1,
            };
            // Recalculate mode locally
            const currentAppliedQuery = appliedQueryRef.current.trim();
            const currentIsSearchMode = currentAppliedQuery !== '' && 
                                        currentAppliedQuery.toLowerCase() !== displayName.toLowerCase();

            let productsData;
            if (currentIsSearchMode) {
                productsData = await productsApi.searchProducts(currentAppliedQuery, options);
            } else {
                productsData = await productsApi.getProductsByCategory(parseInt(id), options);
            }
            setProducts(productsData.data);
            const meta = productsData.meta;
            setCurrentPage(productsData.current_page || meta?.current_page || 1);
            setTotalPages(productsData.last_page || meta?.last_page || 1);
        } catch (err: any) {
            console.error('Failed to refresh products:', err);
        } finally {
            setIsRefreshing(false);
        }
    };

    const handleSearch = () => {
        Keyboard.dismiss();
        appliedQueryRef.current = searchQuery;
        setCurrentPage(1);
        setTotalPages(1);
        loadCategoryData();
    };

    const handleClearSearch = () => {
        setSearchQuery('');
        appliedQueryRef.current = '';
        Keyboard.dismiss();
        setCurrentPage(1);
        setTotalPages(1);
        loadCategoryData();
    };

    const handleVoiceSearch = () => {
        console.log('Voice search pressed');
    };

    const handleProductPress = (productId: number) => {
        router.push(`/product/${productId}`);
    };

    const handleChildCategoryPress = (categoryId: number, categoryName: string) => {
        router.push(`/category/${categoryId}?name=${encodeURIComponent(categoryName)}`);
    };

    const handleLoadMore = () => {
        if (!isLoadingMore && currentPage < totalPages) {
            loadMoreProducts();
        }
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

    // Check if category has no children (leaf category)
    const hasNoChildren = !category?.children || category.children.length === 0;

    const renderHeader = () => (
        <SearchHeader
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            handleSearch={handleSearch}
            handleClearSearch={handleClearSearch}
            handleVoiceSearch={handleVoiceSearch}
            searchInputRef={searchInputRef}
        />
    );

    if (isLoading) {
        return (
            <View style={styles.container}>
                {renderHeader()}
                <View style={styles.loadingContainer}>
                    <LoadingSpinner />
                </View>
            </View>
        );
    }

    if (error || !category) {
        return (
            <View style={styles.container}>
                {renderHeader()}
                <ErrorMessage message={error || 'Category not found'} onRetry={loadCategoryData} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {renderHeader()}
            <CategoryProductGrid
                category={category}
                products={products}
                isLoading={isLoading}
                isLoadingMore={isLoadingMore}
                isRefreshing={isRefreshing}
                showSubcategories={!isSearchMode}
                onProductPress={handleProductPress}
                onChildCategoryPress={handleChildCategoryPress}
                onLoadMore={handleLoadMore}
                onRefresh={handleRefresh}
                paddingBottom={80}
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
                categoryId={parseInt(id)}
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
    loadingContainer: {
        flex: 1,
        backgroundColor: theme.colors.background.default,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default CategoryDetailScreen;
