import React, { useState, useEffect } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { Product } from '@/features/product/types/product.types';
import { ProductCard } from './ProductCard';
import { FeatureSection } from './FeatureSection';
import { theme } from '@/theme';
import { useRouter } from 'expo-router';

import { DetailCard } from '@/shared/components/DetailCard';

interface DiscountSectionProps {
    products: Product[];
    onViewAll?: () => void;
}

export const DiscountSection: React.FC<DiscountSectionProps> = ({ products, onViewAll }) => {
    const router = useRouter();
    const [timeLeft, setTimeLeft] = useState('');

    useEffect(() => {
        const timer = setInterval(() => {
            const now = new Date();
            const end = new Date();
            end.setHours(23, 59, 59, 999);
            const diff = end.getTime() - now.getTime();

            const hours = Math.floor(diff / (1000 * 60 * 60));
            const mins = Math.floor((diff / (1000 * 60)) % 60);
            const secs = Math.floor((diff / 1000) % 60);

            setTimeLeft(`${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    if (products.length === 0) return null;

    return (
        <View style={styles.container}>
            <DetailCard
                title={`Daily Deals - Ends in ${timeLeft}`}
                badgeText="View All"
                onBadgePress={onViewAll}
            >
                <View style={styles.gridContainer}>
                    {products.slice(0, 8).map((item) => (
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
        paddingHorizontal: theme.spacing.xs,
        marginBottom: theme.spacing.md,
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginTop: theme.spacing.sm,
    },
    cardWrapper: {
        width: '49%',
        marginBottom: theme.spacing.xs,
    },
});
