import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
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
            {options.title ? (
                <Text style={styles.title}>{options.title}</Text>
            ) : null}
            
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
    title: {
        fontSize: theme.typography.fontSize.xl,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.md,
        paddingHorizontal: theme.spacing.md,
    },
    scrollContent: {
        paddingHorizontal: theme.spacing.md,
    },
    productItem: {
        width: 180,
        marginRight: theme.spacing.md,
    },
});

