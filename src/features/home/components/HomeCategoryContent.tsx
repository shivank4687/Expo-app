import { SORT_OPTIONS } from '@/constants/sortOptions';
import { Product } from '@/features/product/types/product.types';
import { categoriesApi, Category } from '@/services/api/categories.api';
import { productsApi } from '@/services/api/products.api';
import { ErrorMessage } from '@/shared/components/ErrorMessage';
import { FilterModal } from '@/shared/components/FilterModal';
import { LoadingSpinner } from '@/shared/components/LoadingSpinner';
import { ProductFilterBar } from '@/shared/components/ProductFilterBar';
import { SortModal } from '@/shared/components/SortModal';
import { theme } from '@/theme';
import { FilterState } from '@/types/filters.types';
import { useAppSelector } from '@/store/hooks';
import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { CategoryProductGrid } from '@/features/category/components/CategoryProductGrid';
import { useRouter } from 'expo-router';

interface HomeCategoryContentProps {
    categoryId: number;
}

const PRODUCTS_PER_PAGE = 12;

export const HomeCategoryContent: React.FC<HomeCategoryContentProps> = ({ categoryId }) => {
    const router = useRouter();
    const { t } = useTranslation();
    const [category, setCategory] = useState<Category | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const { categories } = useAppSelector((state) => state.category);
    const { user } = useAppSelector((state) => state.auth);

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

    const loadCategoryData = useCallback(async (isRefresh = false) => {
        try {
            if (!isRefresh) setIsLoading(true);
            setError(null);

            const options: Record<string, any> = {
                per_page: PRODUCTS_PER_PAGE,
                page: 1,
            };

            if (sortBy) options.sort = sortBy;
            if (filters.price) options.price = filters.price;
            Object.keys(filters.attributes).forEach((key) => {
                const values = filters.attributes[key];
                if (values && values.length > 0) options[key] = values.join(',');
            });

            // Try to find in Redux first
            let categoryData = findCategoryById(categories, categoryId);
            
            const productsPromise = productsApi.getProductsByCategory(categoryId, options);
            const categoryPromise = !categoryData ? categoriesApi.getCategoryById(categoryId) : Promise.resolve(null);

            const [productsData, fallbackCategoryData] = await Promise.all([
                productsPromise,
                categoryPromise,
            ]);

            if (fallbackCategoryData) categoryData = fallbackCategoryData;

            setCategory(categoryData);
            setProducts(productsData.data);
            const meta = productsData.meta;
            setCurrentPage(productsData.current_page || meta?.current_page || 1);
            setTotalPages(productsData.last_page || meta?.last_page || 1);
        } catch (err: any) {
            setError(err.message || 'Failed to load category content');
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [categoryId, sortBy, filters, categories]);

    useEffect(() => {
        loadCategoryData();
    }, [loadCategoryData, user?.customer_group_id]);

    const loadMoreProducts = async () => {
        if (isLoadingMore || currentPage >= totalPages) return;

        setIsLoadingMore(true);
        try {
            const nextPage = currentPage + 1;
            const options: Record<string, any> = {
                per_page: PRODUCTS_PER_PAGE,
                page: nextPage,
            };

            if (sortBy) options.sort = sortBy;
            if (filters.price) options.price = filters.price;
            Object.keys(filters.attributes).forEach((key) => {
                const values = filters.attributes[key];
                if (values && values.length > 0) options[key] = values.join(',');
            });

            const productsData = await productsApi.getProductsByCategory(categoryId, options);
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

    const handleRefresh = () => {
        setIsRefreshing(true);
        loadCategoryData(true);
    };

    const handleProductPress = (productId: number) => {
        router.push(`/product/${productId}`);
    };

    const handleChildCategoryPress = (childId: number, childName: string) => {
        router.push(`/category/${childId}?name=${encodeURIComponent(childName)}`);
    };

    const handleLoadMore = () => {
        if (!isLoadingMore && currentPage < totalPages) {
            loadMoreProducts();
        }
    };

    const getActiveFilterCount = (): number => {
        let count = 0;
        if (filters.price) count++;
        count += Object.keys(filters.attributes).length;
        return count;
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <LoadingSpinner />
            </View>
        );
    }

    if (error || !category) {
        return (
            <View style={styles.container}>
                <ErrorMessage message={error || 'Category not found'} onRetry={() => loadCategoryData()} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <CategoryProductGrid
                category={category}
                products={products}
                isLoading={isLoading}
                isLoadingMore={isLoadingMore}
                isRefreshing={isRefreshing}
                showSubcategories={true}
                onProductPress={handleProductPress}
                onChildCategoryPress={handleChildCategoryPress}
                onLoadMore={handleLoadMore}
                onRefresh={handleRefresh}
                paddingBottom={60}
            />

            <ProductFilterBar
                onSortPress={() => setIsSortModalVisible(true)}
                onFilterPress={() => setIsFilterModalVisible(true)}
                filterCount={getActiveFilterCount()}
                bottom={0}
                style={{ paddingBottom: theme.spacing.xs }}
            />

            <SortModal
                visible={isSortModalVisible}
                onClose={() => setIsSortModalVisible(false)}
                options={SORT_OPTIONS}
                selectedValue={sortBy}
                onSelect={(val) => setSortBy(val)}
            />

            <FilterModal
                visible={isFilterModalVisible}
                onClose={() => setIsFilterModalVisible(false)}
                categoryId={categoryId}
                currentFilters={filters}
                onApply={(newFilters) => setFilters(newFilters)}
                isHome={true}
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
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 400,
    },
});
