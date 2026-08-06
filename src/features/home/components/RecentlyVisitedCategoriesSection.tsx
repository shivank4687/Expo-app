import React from 'react';
import { View, StyleSheet, ScrollView, Text, TouchableOpacity } from 'react-native';
import { useAppSelector } from '@/store/hooks';
import { useRouter } from 'expo-router';
import { DetailCard } from '@/shared/components/DetailCard';
import { CategoryImage } from '@/shared/components/LazyImage';
import { theme } from '@/theme';

export const RecentlyVisitedCategoriesSection: React.FC = () => {
    const router = useRouter();
    const { items } = useAppSelector((state) => state.recentlyVisitedCategories);

    if (items.length === 0) return null;

    const handleCategoryPress = (categoryId: number, categoryName: string) => {
        router.push(`/category/${categoryId}?name=${encodeURIComponent(categoryName)}` as any);
    };

    return (
        <View style={styles.container}>
            <DetailCard
                title="Recently Visited Categories"
                showBadge={false}
                noPadding={true}
            >
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                >
                    {items.map((category) => (
                        <TouchableOpacity
                            key={category.id}
                            style={styles.categoryItem}
                            onPress={() => handleCategoryPress(category.id, category.name)}
                            activeOpacity={0.7}
                        >
                            <View style={styles.iconContainer}>
                                <CategoryImage
                                    imageUrl={category.logo_url || category.logo?.large_image_url || category.image}
                                    style={styles.categoryImage}
                                    recyclingKey={category.id?.toString()}
                                    priority="low"
                                />
                            </View>
                            <Text style={styles.categoryName} numberOfLines={2}>
                                {category.name}
                            </Text>
                        </TouchableOpacity>
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
    categoryItem: {
        alignItems: 'center',
        marginRight: theme.spacing.lg,
        width: 70,
    },
    iconContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: theme.colors.primary[50],
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: theme.spacing.xs,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: theme.colors.border.main,
    },
    categoryImage: {
        width: '100%',
        height: '100%',
    },
    categoryName: {
        fontSize: theme.typography.fontSize.xs,
        color: theme.colors.text.primary,
        fontWeight: theme.typography.fontWeight.medium,
        textAlign: 'center',
    },
});
