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

interface MoreFromOtherSuppliersProps {
    product: Product;
}

export const MoreFromOtherSuppliers: React.FC<MoreFromOtherSuppliersProps> = ({ product }) => {
    const router = useRouter();
    const { t } = useTranslation();
    const { selectedLocale } = useAppSelector((state) => state.core);
    const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const childCategory = product.categories && product.categories.length > 0 
        ? product.categories[product.categories.length - 1] 
        : null;
    const categoryId = childCategory?.id || (product as any).category_id;
    const categoryName = childCategory?.name || 'Products';
    const currentSupplierId = product.supplier?.id;

    useEffect(() => {
        const fetchRelated = async () => {
            try {
                // Fetch up to 15 to increase the chance of finding different suppliers
                const options = { per_page: 15, page: 1, locale: selectedLocale?.code };
                const response = categoryId 
                    ? await productsApi.getProductsByCategory(categoryId, options)
                    : await productsApi.getProducts(options);
                
                // Exclude current product and entirely exclude the current supplier
                const filtered = response.data
                    .filter(p => p.id !== product.id && p.supplier?.id !== currentSupplierId)
                    .slice(0, 4);
                
                setRelatedProducts(filtered);
            } catch (error) {
                console.error('Failed to load related supplier products:', error);
            } finally {
                setIsLoading(false);
            }
        };

        if (categoryId) {
            fetchRelated();
        } else {
            setIsLoading(false);
        }
    }, [categoryId, product.id, currentSupplierId, selectedLocale?.code]);

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={theme.colors.primary[500]} />
            </View>
        );
    }

    if (relatedProducts.length === 0) {
        return null; // Empty component if no related items found from other suppliers
    }

    return (
        <View style={styles.container}>
            <DetailCard 
                title={`More from ${categoryName}`} 
                badgeText="View All" 
                onBadgePress={() => {
                    if (categoryId) {
                        router.push({
                            pathname: '/products' as any,
                            params: { 
                                id: categoryId.toString(),
                                title: categoryName
                            }
                        });
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
