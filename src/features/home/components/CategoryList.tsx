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
 * SubcategoryItem
 * A single tappable item inside the horizontal carousel
 */
const SubcategoryItem: React.FC<{
    item: Category;
    onPress: (id: number, name: string) => void;
}> = ({ item, onPress }) => (
    <TouchableOpacity
        style={styles.categoryItem}
        onPress={() => onPress(item.id, item.name)}
        activeOpacity={0.7}
    >
        <View style={styles.iconContainer}>
            <CategoryImageComponent imageUrl={item.image} />
        </View>
        <Text style={styles.categoryName} numberOfLines={2}>
            {item.name}
        </Text>
    </TouchableOpacity>
);

/**
 * CategorySection
 * One parent category row: heading + horizontal subcategory carousel
 */
const CategorySection: React.FC<{
    parent: Category;
    onPress: (id: number, name: string) => void;
}> = ({ parent, onPress }) => {
    // If no children, show the parent itself as the sole carousel item
    const items: Category[] = parent.children && parent.children.length > 0
        ? parent.children
        : [parent];

    return (
        <View style={styles.section}>
            {/* Section heading — tapping navigates to the parent category */}
            <TouchableOpacity
                style={styles.sectionHeader}
                onPress={() => onPress(parent.id, parent.name)}
                activeOpacity={0.7}
            >
                <Text style={styles.sectionTitle}>{parent.name}</Text>
                <Ionicons
                    name="chevron-forward"
                    size={16}
                    color={theme.colors.text.secondary}
                />
            </TouchableOpacity>

            {/* Horizontal subcategory carousel */}
            <FlatList
                data={items}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                    <SubcategoryItem item={item} onPress={onPress} />
                )}
                contentContainerStyle={styles.listContent}
            />
        </View>
    );
};

/**
 * CategoryList Component
 * Displays a vertical list of parent categories, each with a
 * horizontal subcategory carousel beneath it.
 * Automatically reloads when locale changes.
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

    const handleCategoryPress = useCallback((categoryId: number, categoryName: string) => {
        router.push(`/category/${categoryId}?name=${encodeURIComponent(categoryName)}` as any);
    }, [router]);

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={theme.colors.primary[500]} />
            </View>
        );
    }

    if (categories.length === 0) {
        return null;
    }

    return (
        <View>
            {categories.map((parent) => (
                <CategorySection
                    key={parent.id}
                    parent={parent}
                    onPress={handleCategoryPress}
                />
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    loadingContainer: {
        height: 120,
        justifyContent: 'center',
        alignItems: 'center',
    },
    section: {
        marginBottom: theme.spacing.xl,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: theme.spacing.md,
        paddingHorizontal: theme.spacing.xs,
    },
    sectionTitle: {
        fontSize: theme.typography.fontSize.lg,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.text.primary,
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
});

export default CategoryList;
