import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    RefreshControl,
    Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { productsApi } from '@/services/api/products.api';
import { Product } from '@/features/product/types/product.types';
import { ProductCard } from '../components/ProductCard';
import { CategoryList } from '../components/CategoryList';
import { LoadingSpinner } from '@/shared/components/LoadingSpinner';
import { ErrorMessage } from '@/shared/components/ErrorMessage';
import { theme } from '@/theme';

export const HomeScreen: React.FC = () => {
    const router = useRouter();
    const [products, setProducts] = useState<Product[]>([]);
    const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setError(null);
            const [productsResponse, featured] = await Promise.all([
                productsApi.getProducts({ per_page: 20 }),
                productsApi.getFeaturedProducts(),
            ]);

            setProducts(productsResponse.data);
            setFeaturedProducts(featured);
        } catch (err: any) {
            setError(err.message || 'Failed to load products');
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setIsRefreshing(true);
        loadData();
    };

    const handleProductPress = (productId: number) => {
        router.push(`/product/${productId}`);
    };

    const handleSearchPress = () => {
        // Navigate to search screen (to be implemented)
        console.log('Search pressed');
    };

    if (isLoading) {
        return <LoadingSpinner />;
    }

    if (error) {
        return <ErrorMessage message={error} onRetry={loadData} />;
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.greeting}>Hello!</Text>
                    <Text style={styles.subtitle}>What are you looking for?</Text>
                </View>
                <TouchableOpacity style={styles.searchButton} onPress={handleSearchPress}>
                    <Ionicons name="search" size={24} color={theme.colors.text.primary} />
                </TouchableOpacity>
            </View>

            <FlatList
                data={products}
                keyExtractor={(item) => item.id.toString()}
                numColumns={2}
                columnWrapperStyle={styles.row}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
                }
                ListHeaderComponent={
                    <>
                        {/* Categories */}
                        <CategoryList />

                        {/* Featured Products */}
                        {featuredProducts.length > 0 && (
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Featured Products</Text>
                                <FlatList
                                    data={featuredProducts}
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    keyExtractor={(item) => `featured-${item.id}`}
                                    renderItem={({ item }) => (
                                        <View style={styles.featuredItem}>
                                            <ProductCard
                                                product={item}
                                                onPress={() => handleProductPress(item.id)}
                                            />
                                        </View>
                                    )}
                                />
                            </View>
                        )}

                        <Text style={styles.sectionTitle}>All Products</Text>
                    </>
                }
                renderItem={({ item }) => (
                    <View style={styles.productItem}>
                        <ProductCard
                            product={item}
                            onPress={() => handleProductPress(item.id)}
                        />
                    </View>
                )}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background.default,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: theme.spacing.lg,
        backgroundColor: theme.colors.white,
        ...theme.shadows.sm,
    },
    greeting: {
        fontSize: theme.typography.fontSize['2xl'],
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.text.primary,
    },
    subtitle: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.text.secondary,
        marginTop: theme.spacing.xs,
    },
    searchButton: {
        padding: theme.spacing.sm,
    },
    listContent: {
        padding: theme.spacing.md,
    },
    section: {
        marginBottom: theme.spacing.lg,
    },
    sectionTitle: {
        fontSize: theme.typography.fontSize.xl,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.md,
    },
    row: {
        justifyContent: 'space-between',
    },
    productItem: {
        width: '48%',
        marginBottom: theme.spacing.md,
    },
    featuredItem: {
        width: 200,
        marginRight: theme.spacing.md,
    },
});

export default HomeScreen;
