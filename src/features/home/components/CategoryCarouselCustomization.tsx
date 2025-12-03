import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Image,
    StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { CategoryCarouselOptions } from '@/types/theme.types';
import { Category } from '@/services/api/categories.api';
import { useAppSelector } from '@/store/hooks';
import { theme } from '@/theme';
import { getAbsoluteImageUrl } from '@/shared/utils/imageUtils';

interface CategoryCarouselCustomizationProps {
    options: CategoryCarouselOptions;
}

interface CategoryImageProps {
    category: Category;
}

const CATEGORY_ICON_SIZE = 32;

/**
 * CategoryImage Component
 * Displays category image or placeholder icon on error
 */
const CategoryImage: React.FC<CategoryImageProps> = ({ category }) => {
    const [imageError, setImageError] = useState(false);
    
    const rawImageUrl = category.logo?.large_image_url || category.image;
    const imageUrl = getAbsoluteImageUrl(rawImageUrl);
    const hasValidImage = 
        imageUrl && 
        typeof imageUrl === 'string' && 
        imageUrl.trim().length > 0 &&
        !imageError;

    if (hasValidImage) {
        return (
            <Image
                source={{ uri: imageUrl }}
                style={styles.categoryImage}
                resizeMode="cover"
                onError={() => setImageError(true)}
            />
        );
    }

    return (
        <View style={styles.categoryImagePlaceholder}>
            <Ionicons 
                name="grid-outline" 
                size={CATEGORY_ICON_SIZE} 
                color={theme.colors.gray[400]} 
            />
        </View>
    );
};

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

    const handleCategoryPress = useCallback((categoryId: number) => {
        router.push(`/category/${categoryId}` as any);
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
                        onPress={() => handleCategoryPress(category.id)}
                        activeOpacity={0.7}
                    >
                        <View style={styles.categoryImageContainer}>
                            <CategoryImage category={category} />
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
    categoryImagePlaceholder: {
        width: '100%',
        height: '100%',
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    categoryName: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.text.primary,
        textAlign: 'center',
        fontWeight: theme.typography.fontWeight.medium,
    },
});

