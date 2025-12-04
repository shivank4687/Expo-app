import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    ActivityIndicator,
    TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ProductCarouselOptions } from '@/types/theme.types';
import { productsApi } from '@/services/api/products.api';
import { Product } from '@/features/product/types/product.types';
import { ProductCard } from './ProductCard';
import { theme } from '@/theme';
import { useAppSelector } from '@/store/hooks';

interface ProductCarouselCustomizationProps {
    options: ProductCarouselOptions;
}

const PRODUCTS_PER_PAGE = 10;

/**
 * ProductCarouselCustomization Component
 * Displays a horizontal scrollable carousel of products
 * Automatically reloads when locale changes
 */
export const ProductCarouselCustomization: React.FC<ProductCarouselCustomizationProps> = ({
    options,
}) => {
    const router = useRouter();
    const { selectedLocale } = useAppSelector((state) => state.core);
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadProducts = useCallback(async () => {
        if (!selectedLocale?.code) return;

        try {
            setIsLoading(true);
            const response = await productsApi.getProducts({
                ...options.filters,
                per_page: PRODUCTS_PER_PAGE,
                locale: selectedLocale.code,
            });
            setProducts(response.data || []);
        } catch (error) {
            console.error('[ProductCarousel] Error loading products:', error);
            setProducts([]);
        } finally {
            setIsLoading(false);
        }
    }, [selectedLocale?.code, options.filters]);

    useEffect(() => {
        loadProducts();
    }, [loadProducts]);

    const handleProductPress = useCallback((productId: number) => {
        router.push(`/product/${productId}`);
    }, [router]);

    const handleViewAll = useCallback(() => {
        // Build the query params based on the filters
        const queryParams = new URLSearchParams();
        
        if (options.title) {
            queryParams.append('title', options.title);
        }
        
        if (options.filters) {
            Object.entries(options.filters).forEach(([key, value]) => {
                if (key !== 'per_page' && key !== 'locale' && value !== undefined) {
                    queryParams.append(key, String(value));
                }
            });
        }
        
        router.push(`/product-list/all?${queryParams.toString()}` as any);
    }, [router, options.title, options.filters]);

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={theme.colors.primary[500]} />
            </View>
        );
    }

    if (products.length === 0) return null;

    return (
        <View style={styles.container}>
            {/* Header with Title and View All Button */}
            <View style={styles.header}>
                {options.title ? (
                    <Text style={styles.title}>{options.title}</Text>
                ) : (
                    <View />
                )}
                
                {products.length >= PRODUCTS_PER_PAGE && (
                    <TouchableOpacity 
                        onPress={handleViewAll}
                        style={styles.viewAllButton}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.viewAllText}>View All</Text>
                        <Ionicons 
                            name="arrow-forward" 
                            size={16} 
                            color={theme.colors.primary[500]} 
                        />
                    </TouchableOpacity>
                )}
            </View>
            
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {products.map((product) => (
                    <View key={product.id} style={styles.productItem}>
                        <ProductCard
                            product={product}
                            onPress={() => handleProductPress(product.id)}
                        />
                    </View>
                ))}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: theme.spacing.lg,
    },
    loadingContainer: {
        padding: theme.spacing.lg,
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.md,
        paddingHorizontal: theme.spacing.md,
    },
    title: {
        fontSize: theme.typography.fontSize.xl,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.text.primary,
        flex: 1,
    },
    viewAllButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: theme.spacing.xs,
        paddingHorizontal: theme.spacing.sm,
        gap: 4,
    },
    viewAllText: {
        fontSize: theme.typography.fontSize.sm,
        fontWeight: theme.typography.fontWeight.semiBold,
        color: theme.colors.primary[500],
    },
    scrollContent: {
        paddingHorizontal: theme.spacing.md,
    },
    productItem: {
        width: 180,
        marginRight: theme.spacing.md,
    },
});

