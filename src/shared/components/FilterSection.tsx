import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/theme';
import { FilterOption } from '@/types/filters.types';

interface FilterSectionProps {
    title: string;
    options: FilterOption[];
    selectedIds: number[];
    onSelectionChange: (selectedIds: number[]) => void;
    defaultExpanded?: boolean;
}

export const FilterSection: React.FC<FilterSectionProps> = ({
    title,
    options,
    selectedIds,
    onSelectionChange,
    defaultExpanded = true,
}) => {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);

    const toggleOption = (optionId: number) => {
        const newSelection = selectedIds.includes(optionId)
            ? selectedIds.filter(id => id !== optionId)
            : [...selectedIds, optionId];
        onSelectionChange(newSelection);
    };

    return (
        <View style={styles.container}>
            <TouchableOpacity
                style={styles.header}
                onPress={() => setIsExpanded(!isExpanded)}
                activeOpacity={0.7}
            >
                <Text style={styles.title}>{title}</Text>
                <Ionicons
                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                    size={24}
                    color={theme.colors.text.secondary}
                />
            </TouchableOpacity>

            {isExpanded && (
                <View style={styles.content}>
                    {options.map((option) => {
                        const isSelected = selectedIds.includes(option.id);
                        return (
                            <TouchableOpacity
                                key={option.id}
                                style={styles.option}
                                onPress={() => toggleOption(option.id)}
                                activeOpacity={0.7}
                            >
                                <View style={styles.checkbox}>
                                    <Ionicons
                                        name={isSelected ? 'checkbox' : 'square-outline'}
                                        size={24}
                                        color={isSelected ? theme.colors.primary[500] : theme.colors.gray[400]}
                                    />
                                </View>
                                <Text style={styles.optionText}>{option.name}</Text>
                                {option.count !== undefined && (
                                    <Text style={styles.count}>({option.count})</Text>
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.gray[200],
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: theme.spacing.md,
    },
    title: {
        fontSize: theme.typography.fontSize.base,
        fontWeight: theme.typography.fontWeight.semiBold,
        color: theme.colors.text.primary,
    },
    content: {
        paddingBottom: theme.spacing.md,
    },
    option: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: theme.spacing.sm,
        paddingHorizontal: theme.spacing.xs,
    },
    checkbox: {
        marginRight: theme.spacing.sm,
    },
    optionText: {
        flex: 1,
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.text.primary,
    },
    count: {
        fontSize: theme.typography.fontSize.xs,
        color: theme.colors.text.secondary,
        marginLeft: theme.spacing.xs,
    },
});
