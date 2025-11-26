import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/theme';

// Mock categories - replace with actual API call
const MOCK_CATEGORIES = [
    { id: 1, name: 'Electronics', icon: 'laptop' as const },
    { id: 2, name: 'Fashion', icon: 'shirt' as const },
    { id: 3, name: 'Home', icon: 'home' as const },
    { id: 4, name: 'Beauty', icon: 'sparkles' as const },
    { id: 5, name: 'Sports', icon: 'football' as const },
    { id: 6, name: 'Books', icon: 'book' as const },
];

interface Category {
    id: number;
    name: string;
    icon: keyof typeof Ionicons.glyphMap;
}

export const CategoryList: React.FC = () => {
    const handleCategoryPress = (categoryId: number) => {
        // Navigate to category products
        console.log('Category pressed:', categoryId);
    };

    const renderCategory = ({ item }: { item: Category }) => (
        <TouchableOpacity
            style={styles.categoryItem}
            onPress={() => handleCategoryPress(item.id)}
            activeOpacity={0.7}
        >
            <View style={styles.iconContainer}>
                <Ionicons name={item.icon} size={24} color={theme.colors.primary[500]} />
            </View>
            <Text style={styles.categoryName}>{item.name}</Text>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Categories</Text>
            <FlatList
                data={MOCK_CATEGORIES}
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
    },
    iconContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: theme.colors.primary[50],
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: theme.spacing.sm,
    },
    categoryName: {
        fontSize: theme.typography.fontSize.xs,
        color: theme.colors.text.primary,
        fontWeight: theme.typography.fontWeight.medium,
    },
});

export default CategoryList;
