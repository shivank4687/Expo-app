import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { categoriesApi, Category } from '@/services/api/categories.api';
import { productsApi } from '@/services/api/products.api';
import { Product } from '@/features/product/types/product.types';
import { ProductCard } from '@/features/home/components/ProductCard';
import { LoadingSpinner } from '@/shared/components/LoadingSpinner';
import { ErrorMessage } from '@/shared/components/ErrorMessage';
import { Button } from '@/shared/components/Button';
import { theme } from '@/theme';

const PRODUCTS_PER_PAGE = 6;

export const CategoryDetailScreen: React.FC = () => {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const [category, setCategory] = useState<Category | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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

    const handleChildCategoryPress = (categoryId: number) => {
        router.push(`/category/${categoryId}`);
    };

    const handleViewAllProducts = () => {
        router.push(`/product-list/${id}`);
    };

    if (isLoading) {
        return <LoadingSpinner />;
    }

    if (error || !category) {
        return <ErrorMessage message={error || 'Category not found'} onRetry={loadCategoryData} />;
    }

    return (
        <>
            <Stack.Screen options={{ title: category.name, headerBackTitle: 'Back' }} />
            <FlatList
                style={styles.container}
                data={[]}
                renderItem={null}
                ListHeaderComponent={
                    <>
                        {/* Category Header */}
                        {category.image && (
                            <Image 
                                source={typeof category.image === 'string' ? { uri: category.image } : category.image} 
                                style={styles.headerImage} 
                            />
                        )}
                        <View style={styles.header}>
                            <Text style={styles.title}>{category.name}</Text>
                        </View>

                        {/* Child Categories Carousel - AT TOP */}
                        {category.children && category.children.length > 0 && (
                            <View style={styles.childCategoriesSection}>
                                <Text style={styles.sectionTitle}>Subcategories</Text>
                                <FlatList
                                    data={category.children}
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    keyExtractor={(item) => item.id.toString()}
                                    renderItem={({ item }) => {
                                        const imageSource = typeof item.image === 'string' 
                                            ? { uri: item.image } 
                                            : item.image;
                                        return (
                                            <TouchableOpacity
                                                style={styles.childCategoryCard}
                                                onPress={() => handleChildCategoryPress(item.id)}
                                            >
                                                <Image
                                                    source={imageSource}
                                                    style={styles.childCategoryImage}
                                                />
                                                <Text style={styles.childCategoryName}>{item.name}</Text>
                                            </TouchableOpacity>
                                        );
                                    }}
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
    header: {
        padding: theme.spacing.lg,
        backgroundColor: theme.colors.white,
    },
    title: {
        fontSize: theme.typography.fontSize['2xl'],
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.sm,
    },
    description: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.text.secondary,
        lineHeight: 20,
    },
    childCategoriesSection: {
        marginTop: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
        backgroundColor: theme.colors.white,
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
        width: 120,
        marginLeft: theme.spacing.lg,
        alignItems: 'center',
    },
    childCategoryImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: theme.colors.gray[200],
        marginBottom: theme.spacing.sm,
    },
    childCategoryName: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.text.primary,
        textAlign: 'center',
    },
    productsSection: {
        marginTop: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
        backgroundColor: theme.colors.white,
    },
    productCarouselItem: {
        width: 180,
        marginLeft: theme.spacing.lg,
    },
});

export default CategoryDetailScreen;
