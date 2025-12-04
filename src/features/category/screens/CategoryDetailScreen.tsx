import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { categoriesApi, Category } from '@/services/api/categories.api';
import { productsApi } from '@/services/api/products.api';
import { Product } from '@/features/product/types/product.types';
import { ProductCard } from '@/features/home/components/ProductCard';
import { LoadingSpinner } from '@/shared/components/LoadingSpinner';
import { ErrorMessage } from '@/shared/components/ErrorMessage';
import { Button } from '@/shared/components/Button';
import { CategoryImage, BannerImage } from '@/shared/components/LazyImage';
import { theme } from '@/theme';

const PRODUCTS_PER_PAGE = 6;

/**
 * SubcategoryCard Component
 * Displays subcategory image with lazy loading
 */
interface SubcategoryCardProps {
    category: Category;
    onPress: () => void;
}

const SubcategoryCard: React.FC<SubcategoryCardProps> = ({ category, onPress }) => {
    const imageUrl = category.logo?.large_image_url || category.image;

    return (
        <TouchableOpacity
            style={styles.childCategoryCard}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View style={styles.childCategoryImageContainer}>
                <CategoryImage
                    imageUrl={imageUrl}
                    style={styles.childCategoryImage}
                    priority="normal"
                />
            </View>
            <Text style={styles.childCategoryName} numberOfLines={2}>
                {category.name}
            </Text>
        </TouchableOpacity>
    );
};

export const CategoryDetailScreen: React.FC = () => {
    const { id, name } = useLocalSearchParams<{ id: string; name?: string }>();
    const router = useRouter();
    const [category, setCategory] = useState<Category | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Use the name from params if available, otherwise use loaded category name
    const displayName = category?.name || name || 'Category';

    useEffect(() => {
        if (id) {
            loadCategoryData();
        }
    }, [id]);

    const loadCategoryData = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const [categoryData, productsData] = await Promise.all([
                categoriesApi.getCategoryById(parseInt(id)),
                productsApi.getProductsByCategory(parseInt(id), { per_page: PRODUCTS_PER_PAGE }),
            ]);
            setCategory(categoryData);
            setProducts(productsData.data);
            console.log('CategoryDetailScreen - Category loaded:', {
                id: categoryData.id,
                name: categoryData.name,
                hasChildren: !!categoryData.children,
                childrenCount: categoryData.children?.length || 0,
                children: categoryData.children
            });
        } catch (err: any) {
            setError(err.message || 'Failed to load category');
        } finally {
            setIsLoading(false);
        }
    };

    const handleProductPress = (productId: number) => {
        router.push(`/product/${productId}`);
    };

    const handleChildCategoryPress = (categoryId: number, categoryName: string) => {
        router.push(`/category/${categoryId}?name=${encodeURIComponent(categoryName)}`);
    };

    const handleViewAllProducts = () => {
        router.push(`/product-list/${id}`);
    };

    if (isLoading) {
        return (
            <>
                <Stack.Screen options={{ title: displayName, headerBackTitle: 'Back' }} />
                <LoadingSpinner />
            </>
        );
    }

    if (error || !category) {
        return (
            <>
                <Stack.Screen options={{ title: displayName, headerBackTitle: 'Back' }} />
                <ErrorMessage message={error || 'Category not found'} onRetry={loadCategoryData} />
            </>
        );
    }

    return (
        <>
            <Stack.Screen options={{ title: displayName, headerBackTitle: 'Back' }} />
            <FlatList
                style={styles.container}
                data={[]}
                renderItem={null}
                ListHeaderComponent={
                    <>
                        {/* Category Header Image */}
                        {category.image && (
                            <BannerImage 
                                imageUrl={typeof category.image === 'string' ? category.image : undefined}
                                style={styles.headerImage}
                                priority="high"
                            />
                        )}

                        {/* Child Categories Carousel */}
                        {category.children && category.children.length > 0 && (
                            <View style={styles.childCategoriesSection}>
                                <View style={styles.sectionHeader}>
                                    <Text style={styles.sectionTitle}>Subcategories</Text>
                                </View>
                                <FlatList
                                    data={category.children}
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    keyExtractor={(item) => item.id.toString()}
                                    contentContainerStyle={styles.childCategoriesContent}
                                    renderItem={({ item }) => (
                                        <SubcategoryCard
                                            category={item}
                                            onPress={() => handleChildCategoryPress(item.id, item.name)}
                                        />
                                    )}
                                />
                            </View>
                        )}

                        {/* Products Carousel */}
                        <View style={styles.productsSection}>
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>Products</Text>
                                {products.length >= PRODUCTS_PER_PAGE && (
                                    <TouchableOpacity onPress={handleViewAllProducts}>
                                        <Text style={styles.viewAllText}>View All</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                            <FlatList
                                data={products}
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                keyExtractor={(item) => item.id.toString()}
                                renderItem={({ item }) => (
                                    <View style={styles.productCarouselItem}>
                                        <ProductCard
                                            product={item}
                                            onPress={() => handleProductPress(item.id)}
                                        />
                                    </View>
                                )}
                            />
                        </View>
                    </>
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
    headerImage: {
        width: '100%',
        height: 200,
        resizeMode: 'cover',
    },
    childCategoriesSection: {
        paddingVertical: theme.spacing.lg,
        backgroundColor: theme.colors.white,
        marginTop: theme.spacing.sm,
    },
    childCategoriesContent: {
        paddingHorizontal: theme.spacing.md,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.lg,
        marginBottom: theme.spacing.md,
    },
    sectionTitle: {
        fontSize: theme.typography.fontSize.lg,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.text.primary,
    },
    viewAllText: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.primary[500],
        fontWeight: theme.typography.fontWeight.semiBold,
    },
    childCategoryCard: {
        width: 110,
        marginHorizontal: theme.spacing.sm,
        alignItems: 'center',
    },
    childCategoryImageContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        marginBottom: theme.spacing.sm,
        overflow: 'hidden',
        ...theme.shadows.sm,
    },
    childCategoryImage: {
        width: '100%',
        height: '100%',
    },
    childCategoryName: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.text.primary,
        textAlign: 'center',
        fontWeight: theme.typography.fontWeight.medium,
        lineHeight: 18,
        paddingHorizontal: theme.spacing.xs,
    },
    productsSection: {
        marginTop: theme.spacing.sm,
        paddingVertical: theme.spacing.lg,
        backgroundColor: theme.colors.white,
    },
    productCarouselItem: {
        width: 180,
        marginLeft: theme.spacing.md,
    },
});

export default CategoryDetailScreen;
