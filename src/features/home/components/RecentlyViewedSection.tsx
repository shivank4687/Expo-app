import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useAppSelector } from '@/store/hooks';
import { useRouter } from 'expo-router';
import { DetailCard } from '@/shared/components/DetailCard';
import { MiniProductCard } from './MiniProductCard';
import { theme } from '@/theme';

export const RecentlyViewedSection: React.FC = () => {
    const router = useRouter();
    const { items } = useAppSelector((state) => state.recentlyViewed);

    if (items.length === 0) return null;

    return (
        <View style={styles.container}>
            <DetailCard
                title="Recently Viewed"
                showBadge={false}
                noPadding={true}
            >
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                >
                    {items.map((product) => (
                        <View key={product.id} style={styles.cardWrapper}>
                            <MiniProductCard
                                product={product}
                                onPress={() => router.push(`/product/${product.id}`)}
                                showPrice={false}
                            />
                        </View>
                    ))}
                </ScrollView>
            </DetailCard>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: theme.spacing.xs,
        marginBottom: theme.spacing.xs,
    },
    scrollContent: {
        paddingVertical: theme.spacing.xs,
        paddingHorizontal: theme.spacing.xs,
    },
    cardWrapper: {
        marginRight: theme.spacing.sm,
    },
});

// Explicitly adding showBadge support to DetailCard if it doesn't have it, or just use it as is.
// Actually DetailCard has onBadgePress as optional.
