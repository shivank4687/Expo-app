import React, { useCallback } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { CategoryCarouselOptions } from '@/types/theme.types';
import { Category } from '@/services/api/categories.api';
import { useAppSelector } from '@/store/hooks';
import { theme } from '@/theme';
import { CategoryImage } from '@/shared/components/LazyImage';

interface CategoryCarouselCustomizationProps {
    options: CategoryCarouselOptions;
}


/**
 * CategoryCarouselCustomization Component
 * Displays a horizontal scrollable carousel of categories
 * Uses categories from Redux state
 */
export const CategoryCarouselCustomization: React.FC<CategoryCarouselCustomizationProps> = ({
    options,
}) => {
    const router = useRouter();
    const { categories, isLoading } = useAppSelector((state) => state.category);

    const handleCategoryPress = useCallback((categoryId: number, categoryName: string) => {
        router.push(`/category/${categoryId}?name=${encodeURIComponent(categoryName)}` as any);
    }, [router]);

    if (isLoading || categories.length === 0) {
        return null;
    }

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
                {categories.map((category) => (
                    <TouchableOpacity
                        key={category.id}
                        style={styles.categoryItem}
                        onPress={() => handleCategoryPress(category.id, category.name)}
                        activeOpacity={0.7}
                    >
                        <View style={styles.categoryImageContainer}>
                            <CategoryImage 
                                imageUrl={category.logo_path || category.image}
                                style={styles.categoryImage}
                            />
                        </View>
                        <Text style={styles.categoryName} numberOfLines={2}>
                            {category.name}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: theme.spacing.lg,
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
    categoryItem: {
        alignItems: 'center',
        marginRight: theme.spacing.md,
        width: 90,
    },
    categoryImageContainer: {
        width: 90,
        height: 90,
        borderRadius: 45,
        backgroundColor: theme.colors.gray[100],
        overflow: 'hidden',
        marginBottom: theme.spacing.sm,
        ...theme.shadows.sm,
    },
    categoryImage: {
        width: '100%',
        height: '100%',
    },
    categoryName: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.text.primary,
        textAlign: 'center',
        fontWeight: theme.typography.fontWeight.medium,
    },
});

