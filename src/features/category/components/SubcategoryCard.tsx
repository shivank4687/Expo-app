import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Category } from '@/services/api/categories.api';
import { CategoryImage } from '@/shared/components/LazyImage';
import { theme } from '@/theme';

interface SubcategoryCardProps {
    category: Category;
    onPress: () => void;
}

export const SubcategoryCard: React.FC<SubcategoryCardProps> = ({ category, onPress }) => {
    const imageUrl = category.logo?.large_image_url || category.image;

    return (
        <TouchableOpacity
            style={styles.childCategoryCard}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View style={styles.childCategoryImageContainer}>
                <CategoryImage
                    imageUrl={imageUrl}
                    style={styles.childCategoryImage}
                    priority="normal"
                />
            </View>
            <Text style={styles.childCategoryName} numberOfLines={2}>
                {category.name}
            </Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    childCategoryCard: {
        width: 90,
        marginHorizontal: theme.spacing.sm,
        alignItems: 'center',
    },
    childCategoryImageContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        marginBottom: theme.spacing.sm,
        overflow: 'hidden',
        ...theme.shadows.sm,
    },
    childCategoryImage: {
        width: '100%',
        height: '100%',
    },
    childCategoryName: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.text.primary,
        textAlign: 'center',
        fontWeight: theme.typography.fontWeight.medium,
        lineHeight: 18,
        paddingHorizontal: theme.spacing.xs,
    },
});
