import React from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Product } from '@/features/product/types/product.types';
import { Category } from '@/services/api/categories.api';
import { ProductCard } from '@/features/home/components/ProductCard';
import { SubcategoryCard } from './SubcategoryCard';
import { theme } from '@/theme';

interface CategoryProductGridProps {
    category: Category;
    products: Product[];
    isLoading: boolean;
    isLoadingMore: boolean;
    isRefreshing: boolean;
    showSubcategories: boolean;
    onProductPress: (id: number) => void;
    onChildCategoryPress: (id: number, name: string) => void;
    onLoadMore: () => void;
    onRefresh: () => void;
}

export const CategoryProductGrid: React.FC<CategoryProductGridProps> = ({
    category,
    products,
    isLoading,
    isLoadingMore,
    isRefreshing,
    showSubcategories,
    onProductPress,
    onChildCategoryPress,
    onLoadMore,
    onRefresh,
}) => {
    const { t } = useTranslation();

    return (
        <FlatList
            style={styles.flatList}
            data={products}
            numColumns={2}
            key="grid"
            keyExtractor={(item) => item.id.toString()}
            columnWrapperStyle={styles.row}
            contentContainerStyle={styles.gridContent}
            renderItem={({ item }) => (
                <View style={styles.productItem}>
                    <ProductCard
                        product={item}
                        onPress={() => onProductPress(item.id)}
                    />
                </View>
            )}
            onEndReached={onLoadMore}
            onEndReachedThreshold={0.5}
            refreshControl={
                <RefreshControl
                    refreshing={isRefreshing}
                    onRefresh={onRefresh}
                    colors={[theme.colors.primary[500]]}
                    tintColor={theme.colors.primary[500]}
                />
            }
            ListHeaderComponent={
                <>
                    {/* Child Categories Carousel */}
                    {showSubcategories && category.children && category.children.length > 0 && (
                        <View style={styles.childCategoriesSection}>
                            <FlatList
                                data={category.children}
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                keyExtractor={(item) => item.id.toString()}
                                contentContainerStyle={styles.childCategoriesContent}
                                renderItem={({ item }) => (
                                    <SubcategoryCard
                                        category={item}
                                        onPress={() => onChildCategoryPress(item.id, item.name)}
                                    />
                                )}
                            />
                        </View>
                    )}

                    {/* Section header for grid view */}
                    {products.length > 0 && (
                        <View style={styles.gridSectionHeader}>
                            <Text style={styles.sectionTitle}>Products</Text>
                        </View>
                    )}
                </>
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
                !isLoading ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>{t('category.noProducts', 'No products found in this category')}</Text>
                    </View>
                ) : null
            }
        />
    );
};

const styles = StyleSheet.create({
    flatList: {
        flex: 1,
    },
    childCategoriesSection: {
        paddingVertical: theme.spacing.xxs,
        backgroundColor: theme.colors.background.default,
        marginTop: theme.spacing.xxs,
    },
    childCategoriesContent: {
        paddingHorizontal: theme.spacing.xxs,
    },
    sectionTitle: {
        fontSize: theme.typography.fontSize.lg,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.text.primary,
    },
    gridSectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.sm,
        paddingTop: theme.spacing.xs,
        paddingBottom: theme.spacing.md,
        backgroundColor: theme.colors.background.default,
        marginTop: theme.spacing.sm,
    },
    gridContent: {
        paddingHorizontal: theme.spacing.sm,
        paddingBottom: 80, // Add padding for fixed filter bar
    },
    row: {
        justifyContent: 'space-between',
        paddingHorizontal: theme.spacing.sm,
        marginBottom: theme.spacing.md,
    },
    productItem: {
        width: '48%',
    },
    loadingMore: {
        paddingVertical: theme.spacing.lg,
        alignItems: 'center',
        gap: theme.spacing.sm,
    },
    loadingText: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.text.secondary,
    },
    emptyState: {
        paddingVertical: theme.spacing.xl * 2,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: theme.typography.fontSize.base,
        color: theme.colors.text.secondary,
    },
});
