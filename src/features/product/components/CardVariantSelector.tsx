import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/theme';
import { ProductImage } from '@/shared/components/LazyImage';
import { AttributeState, VariantOption, UseProductVariantsReturn } from '../hooks/useProductVariants';

interface CardVariantSelectorProps {
    /** Full return value of useProductVariants – passed in so the parent card
     *  owns the hook and can read selectedVariantId, displayPrice, etc. */
    variantState: UseProductVariantsReturn;
}

/**
 * CardVariantSelector
 *
 * Compact variant-picker designed to expand inline inside a ProductCard.
 * Renders one labelled row per configurable attribute using:
 *   – circular colour swatches  (swatch_type === 'color')
 *   – small image thumbnails    (swatch_type === 'image')
 *   – horizontal scrolling chips (text / no swatch_type)
 */
export const CardVariantSelector: React.FC<CardVariantSelectorProps> = ({ variantState }) => {
    const {
        attributes,
        isLoading,
        error,
        handleOptionSelect,
        getAvailableOptions,
    } = variantState;

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={theme.colors.primary[500]} />
                <Text style={styles.loadingText}>Loading options…</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.errorContainer}>
                <Ionicons name="alert-circle-outline" size={14} color={theme.colors.error.main} />
                <Text style={styles.errorText}>Could not load options</Text>
            </View>
        );
    }

    if (attributes.length === 0) return null;

    return (
        <View style={styles.container}>
            {attributes.map((attribute, index) => {
                const availableOptions = getAvailableOptions(attribute, index);
                const isDisabled = index > 0 && !attributes[index - 1]?.selectedValue;

                return (
                    <View key={attribute.id} style={styles.attributeRow}>
                        {/* Label row */}
                        <View style={styles.labelRow}>
                            <Text style={styles.attributeLabel}>{attribute.label}</Text>
                            {attribute.selectedValue ? (
                                <Text style={styles.selectedValueBadge}>
                                    {attribute.selectedValue}
                                </Text>
                            ) : null}
                        </View>

                        {/* Options */}
                        {isDisabled ? (
                            <Text style={styles.disabledHint}>
                                Select {attributes[index - 1]?.label?.toLowerCase() || 'previous option'} first
                            </Text>
                        ) : (
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={styles.optionsScroll}
                                nestedScrollEnabled
                            >
                                {availableOptions.map((option: VariantOption) => {
                                    const isActive = attribute.selectedValue === option.label;

                                    // Determine if this attribute should be treated as a color
                                    const isColorAttr =
                                        attribute.swatch_type === 'color' ||
                                        attribute.code?.toLowerCase().includes('color') ||
                                        attribute.label?.toLowerCase().includes('color');

                                    const swatchValue = option.swatch_value || (isColorAttr ? option.label.trim() : null);

                                    // Simple check to ensure we only treat single-word labels or hex as colors
                                    const isValidColorValue = swatchValue && (
                                        swatchValue.startsWith('#') ||
                                        /^[a-zA-Z]+$/.test(swatchValue)
                                    );

                                    /* ── Colour swatch ── */
                                    if (isColorAttr && isValidColorValue) {
                                        return (
                                            <TouchableOpacity
                                                key={option.id}
                                                style={[
                                                    styles.colorSwatchOuter,
                                                    isActive && styles.colorSwatchOuterActive,
                                                ]}
                                                onPress={() =>
                                                    handleOptionSelect(attribute.id, option.label)
                                                }
                                                activeOpacity={0.7}
                                            >
                                                <View
                                                    style={[
                                                        styles.colorSwatch,
                                                        { backgroundColor: swatchValue.toLowerCase() },
                                                    ]}
                                                />
                                            </TouchableOpacity>
                                        );
                                    }

                                    /* ── Image swatch ── */
                                    if (attribute.swatch_type === 'image') {
                                        return (
                                            <TouchableOpacity
                                                key={option.id}
                                                style={[
                                                    styles.imageSwatchOuter,
                                                    isActive && styles.imageSwatchOuterActive,
                                                ]}
                                                onPress={() =>
                                                    handleOptionSelect(attribute.id, option.label)
                                                }
                                                activeOpacity={0.7}
                                            >
                                                {option.swatch_value ? (
                                                    <ProductImage
                                                        imageUrl={option.swatch_value}
                                                        style={styles.imageSwatch}
                                                        recyclingKey={`card-swatch-${option.id}`}
                                                        priority="normal"
                                                        contentFit="cover"
                                                    />
                                                ) : (
                                                    <View style={styles.imageSwatch}>
                                                        <Text style={styles.imageSwatchFallback}>
                                                            {option.label.charAt(0)}
                                                        </Text>
                                                    </View>
                                                )}
                                            </TouchableOpacity>
                                        );
                                    }

                                    /* ── Text chip (default) ── */
                                    return (
                                        <TouchableOpacity
                                            key={option.id}
                                            style={[
                                                styles.textChip,
                                                isActive && styles.textChipActive,
                                            ]}
                                            onPress={() =>
                                                handleOptionSelect(attribute.id, option.label)
                                            }
                                            activeOpacity={0.7}
                                        >
                                            <Text
                                                style={[
                                                    styles.textChipLabel,
                                                    isActive && styles.textChipLabelActive,
                                                ]}
                                            >
                                                {option.label}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}

                                {availableOptions.length === 0 && (
                                    <Text style={styles.noOptionsText}>No options available</Text>
                                )}
                            </ScrollView>
                        )}
                    </View>
                );
            })}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: theme.spacing.xs,
        paddingVertical: theme.spacing.xs,
        gap: theme.spacing.sm,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border.card_light,
        backgroundColor: theme.colors.background.paper,
    },

    // Loading / error
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.xs,
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: theme.spacing.md,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border.card_light,
        backgroundColor: theme.colors.background.paper,
    },
    loadingText: {
        fontSize: theme.typography.fontSize.xs,
        color: theme.colors.text.secondary,
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.xs,
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: theme.spacing.sm,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border.card_light,
        backgroundColor: theme.colors.background.paper,
    },
    errorText: {
        fontSize: theme.typography.fontSize.xs,
        color: theme.colors.error.main,
    },

    // Per-attribute row
    attributeRow: {
        gap: 4,
    },
    labelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    attributeLabel: {
        fontSize: theme.typography.fontSize.xs,
        fontWeight: theme.typography.fontWeight.semiBold,
        color: theme.colors.text.primary,
        textTransform: 'uppercase',
        letterSpacing: 0.3,
    },
    selectedValueBadge: {
        fontSize: theme.typography.fontSize.xs,
        fontWeight: theme.typography.fontWeight.medium,
        color: theme.colors.primary[500],
    },
    disabledHint: {
        fontSize: theme.typography.fontSize.xs,
        color: theme.colors.text.secondary,
        fontStyle: 'italic',
    },
    optionsScroll: {
        flexDirection: 'row',
        gap: 6,
        alignItems: 'center',
        paddingVertical: 2,
    },
    noOptionsText: {
        fontSize: theme.typography.fontSize.xs,
        color: theme.colors.text.secondary,
        fontStyle: 'italic',
    },

    // Colour swatch
    colorSwatchOuter: {
        width: 26,
        height: 26,
        borderRadius: theme.borderRadius.sm,
        padding: 2,
        borderWidth: 1.5,
        borderColor: theme.colors.border.card_light,
        position: 'relative',
    },
    colorSwatchOuterActive: {
        borderColor: theme.colors.primary[500],
        borderWidth: 2,
        backgroundColor: theme.colors.primary[50],
    },
    colorSwatch: {
        flex: 1,
        borderRadius: 2,
        borderWidth: 0.5,
        borderColor: 'rgba(0,0,0,0.1)',
    },
    colorCheckmark: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: [{ translateX: -5 }, { translateY: -5 }],
        width: 10,
        height: 10,
        backgroundColor: 'rgba(0,0,0,0.55)',
        borderRadius: 5,
        justifyContent: 'center',
        alignItems: 'center',
    },

    // Image swatch
    imageSwatchOuter: {
        width: 32,
        height: 32,
        borderRadius: theme.borderRadius.sm,
        borderWidth: 1.5,
        borderColor: theme.colors.border.card_light,
        overflow: 'hidden',
    },
    imageSwatchOuterActive: {
        borderColor: theme.colors.primary[500],
        borderWidth: 2,
    },
    imageSwatch: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.background.paper,
    },
    imageSwatchFallback: {
        fontSize: 10,
        color: theme.colors.text.secondary,
        fontWeight: theme.typography.fontWeight.bold,
    },

    // Text chip
    textChip: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: theme.borderRadius.full,
        borderWidth: 1,
        borderColor: theme.colors.border.card_light,
        backgroundColor: theme.colors.background.default,
        minWidth: 30,
        alignItems: 'center',
    },
    textChipActive: {
        backgroundColor: theme.colors.primary[50],
        borderColor: theme.colors.primary[500],
        borderWidth: 1.5,
    },
    textChipLabel: {
        fontSize: theme.typography.fontSize.xs,
        fontWeight: theme.typography.fontWeight.semiBold,
        color: theme.colors.text.primary,
        textTransform: 'uppercase',
    },
    textChipLabelActive: {
        color: theme.colors.primary[500],
    },
});

export default CardVariantSelector;
