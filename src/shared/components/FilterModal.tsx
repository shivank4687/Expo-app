import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, ActivityIndicator, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/theme';
import { FilterAttribute, FilterState } from '@/types/filters.types';
import { FilterSection } from './FilterSection';
import { PriceRangeSlider } from './PriceRangeSlider';
import { Button } from './Button';
import { filtersApi } from '@/services/api/filters.api';

interface FilterModalProps {
    visible: boolean;
    onClose: () => void;
    categoryId?: number;
    currentFilters: FilterState;
    onApply: (filters: FilterState) => void;
}

export const FilterModal: React.FC<FilterModalProps> = ({
    visible,
    onClose,
    categoryId,
    currentFilters,
    onApply,
}) => {
    const [filters, setFilters] = useState<FilterState>(currentFilters);
    const [availableFilters, setAvailableFilters] = useState<FilterAttribute[]>([]);
    const [maxPrice, setMaxPrice] = useState(100);
    const [isLoading, setIsLoading] = useState(false);
    const [hasLoaded, setHasLoaded] = useState(false);

    useEffect(() => {
        // Only load filters once when modal first becomes visible
        // Don't reload on subsequent opens unless categoryId changes
        if (visible && !hasLoaded) {
            loadFilters();
        }
    }, [visible, hasLoaded]);

    // Reset hasLoaded when categoryId changes to reload filters for new category
    useEffect(() => {
        setHasLoaded(false);
    }, [categoryId]);

    const loadFilters = async () => {
        try {
            setIsLoading(true);
            const [filtersData, maxPriceData] = await Promise.all([
                filtersApi.getFilterAttributes(categoryId),
                filtersApi.getMaxPrice(categoryId),
            ]);
            setAvailableFilters(filtersData.data || []);
            setMaxPrice(maxPriceData);
            setHasLoaded(true); // Mark as loaded after successful fetch
        } catch (error) {
            console.error('Failed to load filters:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handlePriceChange = (min: number, max: number) => {
        setFilters({
            ...filters,
            price: `${min},${max}`,
        });
    };

    const handleAttributeChange = (code: string, selectedIds: number[]) => {
        const newAttributes = { ...filters.attributes };
        if (selectedIds.length > 0) {
            newAttributes[code] = selectedIds;
        } else {
            delete newAttributes[code];
        }
        setFilters({
            ...filters,
            attributes: newAttributes,
        });
    };

    const handleClearAll = () => {
        setFilters({
            price: null,
            attributes: {},
        });
    };

    const handleApply = () => {
        onApply(filters);
        onClose();
    };

    const getPriceRange = (): [number, number] => {
        if (filters.price) {
            const [min, max] = filters.price.split(',').map(Number);
            return [min, max];
        }
        return [0, maxPrice];
    };

    const [minPrice, maxPriceValue] = getPriceRange();

    return (
        <Modal
            visible={visible}
            animationType="slide"
            onRequestClose={onClose}
        >
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.container}>
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Ionicons name="close" size={24} color={theme.colors.text.primary} />
                        </TouchableOpacity>
                        <Text style={styles.title}>Filters</Text>
                        <TouchableOpacity onPress={handleClearAll}>
                            <Text style={styles.clearText}>Clear All</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Content */}
                    {isLoading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color={theme.colors.primary[500]} />
                        </View>
                    ) : (
                        <ScrollView style={styles.content}>
                            {/* Price Range Filter */}
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Price Range</Text>
                                <PriceRangeSlider
                                    minPrice={0}
                                    maxPrice={maxPrice}
                                    defaultMin={minPrice}
                                    defaultMax={maxPriceValue}
                                    onRangeChange={handlePriceChange}
                                />
                            </View>

                            {/* Attribute Filters */}
                            {availableFilters.map((filter) => {
                                if (filter.type === 'price' || !filter.options || filter.options.length === 0) {
                                    return null;
                                }
                                return (
                                    <FilterSection
                                        key={filter.code}
                                        title={filter.name}
                                        options={filter.options}
                                        selectedIds={filters.attributes[filter.code] || []}
                                        onSelectionChange={(selectedIds) =>
                                            handleAttributeChange(filter.code, selectedIds)
                                        }
                                    />
                                );
                            })}
                        </ScrollView>
                    )}

                    {/* Apply Button */}
                    <View style={styles.footer}>
                        <Button
                            title="Apply Filters"
                            onPress={handleApply}
                            disabled={isLoading}
                        />
                    </View>
                </View>
            </SafeAreaView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: theme.colors.white,
        marginTop: 40, // Add top margin to prevent touching the top
        marginBottom: 20, // Add bottom margin for spacing
    },
    container: {
        flex: 1,
        backgroundColor: theme.colors.white,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: theme.spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.gray[200],
    },
    closeButton: {
        padding: theme.spacing.xs,
    },
    title: {
        fontSize: theme.typography.fontSize.lg,
        fontWeight: theme.typography.fontWeight.semiBold,
        color: theme.colors.text.primary,
    },
    clearText: {
        fontSize: theme.typography.fontSize.sm,
        fontWeight: theme.typography.fontWeight.medium,
        color: theme.colors.primary[500],
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        flex: 1,
        padding: theme.spacing.lg,
    },
    section: {
        marginBottom: theme.spacing.xl,
    },
    sectionTitle: {
        fontSize: theme.typography.fontSize.base,
        fontWeight: theme.typography.fontWeight.semiBold,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.md,
    },
    footer: {
        padding: theme.spacing.lg,
        borderTopWidth: 1,
        borderTopColor: theme.colors.gray[200],
    },
});
