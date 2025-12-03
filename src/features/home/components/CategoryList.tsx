import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { theme } from '@/theme';
import { Category } from '@/services/api/categories.api';
import { useTranslation } from 'react-i18next';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { fetchCategories } from '@/store/slices/categorySlice';

const CATEGORY_ICON_SIZE = 24;

/**
 * CategoryImageComponent
 * Displays category image or fallback icon on error
 */
const CategoryImageComponent: React.FC<{ imageUrl?: string }> = ({ imageUrl }) => {
    const [imageError, setImageError] = useState(false);

    if (imageUrl && !imageError) {
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
        <Ionicons 
            name="grid-outline" 
            size={CATEGORY_ICON_SIZE} 
            color={theme.colors.primary[500]} 
        />
    );
};

/**
 * CategoryList Component
 * Displays a vertical list of categories
 * Automatically reloads when locale changes
 */
export const CategoryList: React.FC = () => {
    const { t } = useTranslation();
    const router = useRouter();
    const dispatch = useAppDispatch();
    const { selectedLocale } = useAppSelector((state) => state.core);
    const { categories, isLoading } = useAppSelector((state) => state.category);

    useEffect(() => {
        if (selectedLocale?.code) {
            dispatch(fetchCategories({ locale: selectedLocale.code }));
        }
    }, [selectedLocale?.code, dispatch]);

    const handleCategoryPress = useCallback((categoryId: number) => {
        router.push(`/category/${categoryId}` as any);
    }, [router]);

    const renderCategory = useCallback(({ item }: { item: Category }) => (
        <TouchableOpacity
            style={styles.categoryItem}
            onPress={() => handleCategoryPress(item.id)}
            activeOpacity={0.7}
        >
            <View style={styles.iconContainer}>
                <CategoryImageComponent imageUrl={item.image} />
            </View>
            <Text style={styles.categoryName} numberOfLines={2}>
                {item.name}
            </Text>
        </TouchableOpacity>
    ), [handleCategoryPress]);

    if (isLoading) {
        return (
            <View style={styles.container}>
                <Text style={styles.title}>{t('category.categories')}</Text>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color={theme.colors.primary[500]} />
                </View>
            </View>
        );
    }

    if (categories.length === 0) {
        return null; // Don't show section if no categories
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>{t('category.categories')}</Text>
            <FlatList
                data={categories}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderCategory}
                contentContainerStyle={styles.listContent}
            />
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
    },
    listContent: {
        paddingRight: theme.spacing.md,
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
        marginBottom: theme.spacing.sm,
        overflow: 'hidden',
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
    loadingContainer: {
        height: 80,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default CategoryList;
