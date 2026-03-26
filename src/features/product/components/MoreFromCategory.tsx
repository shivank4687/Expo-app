import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Product } from '@/features/product/types/product.types';
import { productsApi } from '@/services/api/products.api';
import { DetailCard } from '@/shared/components/DetailCard';
import { ProductCard } from '@/features/home/components/ProductCard';
import { theme } from '@/theme';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '@/store/hooks';

interface MoreFromCategoryProps {
    product: Product;
}

export const MoreFromCategory: React.FC<MoreFromCategoryProps> = ({ product }) => {
    const router = useRouter();
    const { t } = useTranslation();
    const { selectedLocale } = useAppSelector((state) => state.core);
    const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const categoryId = product.categories?.[0]?.id || (product as any).category_id;
    const categoryName = product.categories?.[0]?.name || 'Products';

    useEffect(() => {
        const fetchRelated = async () => {
            console.log('🔍 MoreFromCategory: categoryId resolved as', categoryId, 'Product categories:', product.categories);
            
            try {
                // Fetch up to 5 so we can filter out the current product and still have 4
                // Fallback to general products if no category is found on the product detail
                const options = { per_page: 5, page: 1, locale: selectedLocale?.code };
                const response = categoryId 
                    ? await productsApi.getProductsByCategory(categoryId, options)
                    : await productsApi.getProducts(options);
                
                const filtered = response.data.filter(p => p.id !== product.id).slice(0, 4);
                console.log(`📦 Loaded ${filtered.length} related products`);
                setRelatedProducts(filtered);
            } catch (error) {
                console.error('Failed to load related products:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchRelated();
    }, [categoryId, product.id]);

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={theme.colors.primary[500]} />
            </View>
        );
    }

    if (relatedProducts.length === 0) {
        return null; // Empty component if no related items found
    }

    return (
        <View style={styles.container}>
            <DetailCard 
                title={categoryId ? `More from ${categoryName}` : "You may also like"} 
                badgeText="View All" 
                onBadgePress={() => {
                    if (categoryId) {
                        router.push(`/category/${categoryId}?name=${encodeURIComponent(categoryName)}`);
                    } else {
                        router.push('/products' as any);
                    }
                }}
            >
                <View style={styles.gridContainer}>
                    {relatedProducts.map(item => (
                        <View key={item.id} style={styles.cardWrapper}>
                            <ProductCard 
                                product={item} 
                                onPress={() => router.push(`/product/${item.id}`)} 
                            />
                        </View>
                    ))}
                </View>
            </DetailCard>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginTop: theme.spacing.lg,
    },
    loadingContainer: {
        padding: theme.spacing.xl,
        justifyContent: 'center',
        alignItems: 'center',
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginTop: theme.spacing.md,
    },
    cardWrapper: {
        width: '48%',
        marginBottom: theme.spacing.md,
    }
});
