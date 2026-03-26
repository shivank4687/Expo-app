import React, { useMemo, useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Text, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Product } from '@/features/product/types/product.types';
import { DetailCard } from '@/shared/components/DetailCard';
import { theme } from '@/theme';
import { useAppSelector } from '@/store/hooks';
import { Category } from '@/services/api/categories.api';

interface MoreCategoriesProps {
    product: Product;
}

const CATEGORY_ICON_SIZE = 24;

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

export const MoreCategories: React.FC<MoreCategoriesProps> = ({ product }) => {
    const router = useRouter();
    const { categories } = useAppSelector((state) => state.category);

    const categoryId = product.categories?.[0]?.id || (product as any).category_id;
    const categoryName = product.categories?.[0]?.name || 'Category';

    // Recursively find the exact category node anywhere in the depth tree
    const findCategory = (cats: Category[], id: number): Category | null => {
        for (const cat of cats) {
            if (cat.id === id) return cat;
            if (cat.children && cat.children.length > 0) {
                const found = findCategory(cat.children, id);
                if (found) return found;
            }
        }
        return null;
    };

    const currentCategory = useMemo(() => {
        if (!categoryId || !categories) return null;
        return findCategory(categories as unknown as Category[], categoryId);
    }, [categoryId, categories]);

    const childCategories = currentCategory?.children || [];

    // Hide component cleanly if it possesses no nested child-category carousels
    if (childCategories.length === 0) {
        return null; 
    }

    const handleCategoryPress = (id: number, name: string) => {
        router.push(`/category/${id}?name=${encodeURIComponent(name)}` as any);
    };

    return (
        <View style={styles.container}>
            <DetailCard 
                title={`More Category of ${categoryName}`} 
                badgeText="View All" 
                onBadgePress={() => {
                    if (categoryId) {
                        handleCategoryPress(categoryId, categoryName);
                    }
                }}
            >
                <FlatList
                    data={childCategories}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.carousel}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.listContent}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={styles.categoryItem}
                            onPress={() => handleCategoryPress(item.id, item.name)}
                            activeOpacity={0.7}
                        >
                            <View style={styles.iconContainer}>
                                <CategoryImageComponent imageUrl={item.image} />
                            </View>
                            <Text style={styles.categoryName} numberOfLines={2}>
                                {item.name}
                            </Text>
                        </TouchableOpacity>
                    )}
                />
            </DetailCard>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginTop: theme.spacing.lg,
    },
    carousel: {
        marginHorizontal: -12,
    },
    listContent: {
        paddingHorizontal: 12,
        paddingTop: theme.spacing.sm,
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

export default MoreCategories;
