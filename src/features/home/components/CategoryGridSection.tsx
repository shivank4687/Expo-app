import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Product } from '@/features/product/types/product.types';
import { ProductCard } from './ProductCard';
import { FeatureSection } from './FeatureSection';
import { theme } from '@/theme';
import { useRouter } from 'expo-router';

import { DetailCard } from '@/shared/components/DetailCard';

interface CategoryGridSectionProps {
    title: string;
    products: Product[];
    onViewAll?: () => void;
}

export const CategoryGridSection: React.FC<CategoryGridSectionProps> = ({ title, products, onViewAll }) => {
    const router = useRouter();
    const displayProducts = products.slice(0, 8);

    if (products.length === 0) return null;

    return (
        <View style={styles.container}>
            <DetailCard
                title={title}
                badgeText="View All"
                onBadgePress={onViewAll}
            >
                <View style={styles.gridContainer}>
                    {displayProducts.map((product) => (
                        <View key={product.id} style={styles.gridItem}>
                            <ProductCard
                                product={product}
                                onPress={() => router.push(`/product/${product.id}`)}
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
        paddingHorizontal: theme.spacing.xs,
        marginBottom: theme.spacing.md,
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginTop: theme.spacing.sm,
    },
    gridItem: {
        width: '49%',
        marginBottom: theme.spacing.xs,
    },
});
