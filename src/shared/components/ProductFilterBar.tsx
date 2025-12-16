import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '@/theme';

interface ProductFilterBarProps {
    onSortPress: () => void;
    onFilterPress: () => void;
    filterCount?: number;
}

export const ProductFilterBar: React.FC<ProductFilterBarProps> = ({
    onSortPress,
    onFilterPress,
    filterCount = 0,
}) => {
    const insets = useSafeAreaInsets();

    return (
        <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, theme.spacing.sm) }]}>
            {/* Filter Button */}
            <TouchableOpacity
                style={styles.button}
                onPress={onFilterPress}
                activeOpacity={0.7}
            >
                <Ionicons name="funnel-outline" size={20} color={theme.colors.text.primary} />
                <Text style={styles.buttonText}>Filter</Text>
                {filterCount > 0 && (
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>{filterCount}</Text>
                    </View>
                )}
            </TouchableOpacity>

            {/* Separator */}
            <View style={styles.separator} />

            {/* Sort Button */}
            <TouchableOpacity
                style={styles.button}
                onPress={onSortPress}
                activeOpacity={0.7}
            >
                <Ionicons name="swap-vertical-outline" size={20} color={theme.colors.text.primary} />
                <Text style={styles.buttonText}>Sort</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        backgroundColor: theme.colors.white,
        borderTopWidth: 1,
        borderTopColor: theme.colors.gray[200],
        paddingVertical: theme.spacing.sm,
        paddingHorizontal: theme.spacing.md,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 5,
    },
    button: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: theme.spacing.sm,
        position: 'relative',
    },
    buttonText: {
        fontSize: theme.typography.fontSize.base,
        fontWeight: theme.typography.fontWeight.medium,
        color: theme.colors.text.primary,
        marginLeft: theme.spacing.sm,
        textTransform: 'uppercase',
    },
    separator: {
        width: 1,
        height: '100%',
        backgroundColor: theme.colors.gray[200],
        marginHorizontal: theme.spacing.xs,
    },
    badge: {
        position: 'absolute',
        top: 0,
        right: '30%',
        backgroundColor: theme.colors.primary[500],
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.xs,
    },
    badgeText: {
        color: theme.colors.white,
        fontSize: theme.typography.fontSize.xs,
        fontWeight: theme.typography.fontWeight.bold,
    },
});
