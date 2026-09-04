import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Product } from '@/features/product/types/product.types';
import { suppliersApi } from '@/services/api/suppliers.api';
import { DetailCard } from '@/shared/components/DetailCard';
import { ProductCard } from '@/features/home/components/ProductCard';
import { theme } from '@/theme';

interface TopFromShopProps {
    product: Product;
}

export const TopFromShop: React.FC<TopFromShopProps> = ({ product }) => {
    const router = useRouter();
    const [topProducts, setTopProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const supplierUrl = product.supplier?.url;
    const supplierName = product.supplier?.company_name || 'this shop';

    useEffect(() => {
        const fetchTopProducts = async () => {
            if (!supplierUrl) {
                setIsLoading(false);
                return;
            }

            try {
                const response = await suppliersApi.getSupplierTopProducts(supplierUrl);
                // Filter out the current product so it doesn't show in its own top products list
                const filtered = response.filter(p => p.id !== product.id).slice(0, 4);
                setTopProducts(filtered);
            } catch (error) {
                console.error('Failed to load top supplier products:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchTopProducts();
    }, [supplierUrl, product.id]);

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={theme.colors.primary[500]} />
            </View>
        );
    }

    if (topProducts.length === 0) {
        return null; // Hide the section entirely if no top products (e.g., new supplier with no sales)
    }

    return (
        <View style={styles.container}>
            <DetailCard
                title={`Top from ${supplierName}`}
                badgeText="View Shop"
                onBadgePress={() => {
                    if (supplierUrl) {
                        router.push(`/supplier/${supplierUrl}`);
                    }
                }}
            >
                <View style={styles.gridContainer}>
                    {topProducts.map(item => (
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
        marginTop: theme.spacing.xs,
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
    },
    cardWrapper: {
        width: '49%',
        marginBottom: theme.spacing.xs,
    }
});
