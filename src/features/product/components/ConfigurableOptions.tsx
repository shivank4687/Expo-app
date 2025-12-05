import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/theme';
import { ConfigurableAttribute, Product, ProductVariant } from '../types/product.types';
import { ProductImage } from '@/shared/components/LazyImage';
import { formatters } from '@/shared/utils/formatters';

interface ConfigurableOptionsProps {
    product: Product;
    configurableConfig?: any; // From API endpoint /products/{id}/configurable-config
    superAttributes?: ConfigurableAttribute[];
    variants?: ProductVariant[];
    onVariantChange: (variantId: number | null, variant?: ProductVariant) => void;
    onPriceChange?: (price: number, regularPrice?: number) => void;
    onImagesChange?: (images: any[]) => void;
}

interface AttributeState {
    id: number;
    code: string;
    label: string;
    swatch_type?: string;
    options: any[];
    selectedValue: string | null;
}

/**
 * ConfigurableOptions Component
 * Displays product configuration options using the configurable-config API data
 * Matches web application behavior exactly
 */
export const ConfigurableOptions: React.FC<ConfigurableOptionsProps> = ({
    product,
    configurableConfig,
    superAttributes,
    variants,
    onVariantChange,
    onPriceChange,
    onImagesChange,
}) => {
    const [attributes, setAttributes] = useState<AttributeState[]>([]);
    const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);

    // Initialize attributes from config
    useEffect(() => {
        if (configurableConfig && configurableConfig.attributes) {
            console.log('✅ Using configurable config data');
            const initialAttributes = configurableConfig.attributes.map((attr: any) => ({
                id: attr.id,
                code: attr.code,
                label: attr.label,
                swatch_type: attr.swatch_type,
                options: attr.options || [],
                selectedValue: null,
            }));
            setAttributes(initialAttributes);
        } else if (superAttributes && superAttributes.length > 0) {
            console.log('⚠️ Using super_attributes fallback');
            const initialAttributes = superAttributes.map((attr) => ({
                id: attr.id,
                code: attr.code,
                label: attr.label,
                swatch_type: attr.swatch_type,
                options: attr.options || [],
                selectedValue: null,
            }));
            setAttributes(initialAttributes);
        }
    }, [configurableConfig, superAttributes]);

    // Find matching variant when all options selected
    useEffect(() => {
        if (!configurableConfig || !configurableConfig.index || attributes.length === 0) return;

        // Check if all attributes have selections
        const allSelected = attributes.every(attr => attr.selectedValue !== null);
        
        if (!allSelected) {
            setSelectedVariantId(null);
            onVariantChange(null);
            return;
        }

        // Find variant ID using the index from config
        // config.index structure: { variant_id: { attribute_id: option_id } }
        const matchingVariantId = Object.keys(configurableConfig.index).find(variantId => {
            const variantIndex = configurableConfig.index[variantId];
            
            return attributes.every(attr => {
                const selectedOption = attr.options.find((opt: any) => opt.label === attr.selectedValue);
                if (!selectedOption) return false;
                
                // Check if this variant has the selected option for this attribute
                return variantIndex[attr.id] === selectedOption.id;
            });
        });

        if (matchingVariantId) {
            const variantId = parseInt(matchingVariantId);
            console.log('✅ Found matching variant:', variantId);
            
            setSelectedVariantId(variantId);
            
            // Find the actual variant object
            const variant = variants?.find(v => v.id === variantId);
            onVariantChange(variantId, variant);
            
            // Update price from config
            if (onPriceChange) {
                let finalPrice = null;
                let regularPrice = null;
                
                if (configurableConfig.variant_prices && configurableConfig.variant_prices[variantId]) {
                    const priceData = configurableConfig.variant_prices[variantId];
                    console.log('💰 Price data structure:', JSON.stringify(priceData, null, 2));
                    
                    // Structure: { regular: { price, formatted_price }, final: { price, formatted_price } }
                    finalPrice = priceData.final?.price || priceData.regular?.price;
                    regularPrice = priceData.regular?.price;
                    
                    console.log('💰 From config - final:', finalPrice, 'regular:', regularPrice);
                } else if (variant) {
                    // Fallback to variant object prices
                    finalPrice = variant.price;
                    regularPrice = variant.special_price ? variant.price : null;
                    
                    console.log('💰 From variant - price:', finalPrice, 'special:', variant.special_price);
                }
                
                if (finalPrice) {
                    console.log('✅ Calling onPriceChange with:', finalPrice, regularPrice);
                    onPriceChange(finalPrice, regularPrice);
                } else {
                    console.log('⚠️ No price data available');
                }
            }
            
            // Update images from config
            if (onImagesChange) {
                let imagesToUse = null;
                
                if (configurableConfig.variant_images && configurableConfig.variant_images[variantId]) {
                    const images = configurableConfig.variant_images[variantId];
                    console.log('🖼️ Raw images from config:', JSON.stringify(images.slice(0, 2), null, 2));
                    
                    // Transform images to correct format
                    imagesToUse = images.map((img: any, idx: number) => {
                        // Handle string URLs
                        if (typeof img === 'string') {
                            return { 
                                id: Date.now() + idx, 
                                url: img, 
                                path: img 
                            };
                        }
                        
                        // Handle Bagisto image objects
                        const url = img.url 
                            || img.large_image_url 
                            || img.medium_image_url 
                            || img.original_image_url 
                            || img.small_image_url
                            || img.path;
                        
                        return {
                            id: img.id || Date.now() + idx,
                            url: url,
                            path: img.path || url,
                            alt: img.label || '',
                        };
                    }).filter((img: any) => img.url); // Filter out any without URLs
                    
                    console.log('🖼️ Transformed images:', imagesToUse.length, 'First URL:', imagesToUse[0]?.url);
                } else if (variant && variant.images && variant.images.length > 0) {
                    // Fallback to variant object images
                    console.log('🖼️ Using variant images:', variant.images.length);
                    imagesToUse = variant.images;
                }
                
                if (imagesToUse && imagesToUse.length > 0) {
                    console.log('✅ Calling onImagesChange with', imagesToUse.length, 'images');
                    onImagesChange(imagesToUse);
                } else {
                    console.log('⚠️ No images available for variant');
                }
            }
        } else {
            console.log('❌ No matching variant found');
            setSelectedVariantId(null);
            onVariantChange(null);
        }
    }, [attributes, configurableConfig]);

    const handleOptionSelect = (attributeId: number, optionLabel: string) => {
        console.log('🎯 Option selected:', optionLabel);
        
        setAttributes(prev => prev.map((attr, index) => {
            if (attr.id === attributeId) {
                return { ...attr, selectedValue: optionLabel };
            }
            // Reset subsequent attributes when changing an earlier one
            const currentIndex = prev.findIndex(a => a.id === attributeId);
            if (index > currentIndex) {
                return { ...attr, selectedValue: null };
            }
            return attr;
        }));
    };

    // Get available options based on previous selections
    const getAvailableOptions = (attribute: AttributeState, attrIndex: number) => {
        if (!configurableConfig || !configurableConfig.index) {
            // Without config, show all options
            return attribute.options;
        }

        if (attrIndex === 0) {
            // First attribute: show all options
            return attribute.options;
        }

        // For subsequent attributes, filter based on previous selections
        const previousAttrs = attributes.slice(0, attrIndex);
        const allPreviousSelected = previousAttrs.every(attr => attr.selectedValue !== null);
        
        if (!allPreviousSelected) {
            // Previous attributes not fully selected
            return [];
        }

        // Find which variants are still possible given previous selections
        const possibleVariantIds = Object.keys(configurableConfig.index).filter(variantId => {
            const variantIndex = configurableConfig.index[variantId];
            
            return previousAttrs.every(prevAttr => {
                const selectedOption = prevAttr.options.find((opt: any) => opt.label === prevAttr.selectedValue);
                return selectedOption && variantIndex[prevAttr.id] === selectedOption.id;
            });
        });

        // Filter options to only show those available in possible variants
        return attribute.options.filter((option: any) => {
            return possibleVariantIds.some(variantId => {
                const variantIndex = configurableConfig.index[variantId];
                return variantIndex[attribute.id] === option.id;
            });
        });
    };

    if (attributes.length === 0) {
        // Still loading or no attributes
        return null;
    }

    return (
        <View style={styles.container}>
            {attributes.map((attribute, index) => {
                const availableOptions = getAvailableOptions(attribute, index);
                const isDisabled = index > 0 && !attributes[index - 1]?.selectedValue;
                
                return (
                    <View key={attribute.id} style={styles.card}>
                        <View style={styles.attributeHeader}>
                            <Text style={styles.attributeLabel}>{attribute.label}</Text>
                            {attribute.selectedValue && (
                                <Text style={styles.selectedBadge}>
                                    {attribute.selectedValue}
                                </Text>
                            )}
                        </View>
                        
                        {isDisabled ? (
                            <Text style={styles.disabledText}>
                                Please select {attributes[index - 1]?.label?.toLowerCase() || 'previous option'} first
                            </Text>
                        ) : availableOptions.length === 0 ? (
                            <Text style={styles.noOptionsText}>
                                No options available for this combination
                            </Text>
                        ) : (
                            <>
                                {/* Color Swatches */}
                                {attribute.swatch_type === 'color' ? (
                                    <View style={styles.swatchContainer}>
                                        {availableOptions.map((option: any) => (
                                            <TouchableOpacity
                                                key={option.id}
                                                style={[
                                                    styles.colorSwatchWrapper,
                                                    attribute.selectedValue === option.label && styles.colorSwatchWrapperActive,
                                                ]}
                                                onPress={() => handleOptionSelect(attribute.id, option.label)}
                                                activeOpacity={0.7}
                                            >
                                                <View
                                                    style={[
                                                        styles.colorSwatch,
                                                        { backgroundColor: option.swatch_value || '#ccc' },
                                                    ]}
                                                />
                                                {attribute.selectedValue === option.label && (
                                                    <View style={styles.colorCheckmark}>
                                                        <Ionicons 
                                                            name="checkmark" 
                                                            size={10} 
                                                            color={theme.colors.white} 
                                                        />
                                                    </View>
                                                )}
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                ) : null}

                                {/* Image Swatches */}
                                {attribute.swatch_type === 'image' ? (
                                    <View style={styles.swatchContainer}>
                                        {availableOptions.map((option: any) => (
                                            <TouchableOpacity
                                                key={option.id}
                                                style={[
                                                    styles.imageSwatchWrapper,
                                                    attribute.selectedValue === option.label && styles.imageSwatchWrapperActive,
                                                ]}
                                                onPress={() => handleOptionSelect(attribute.id, option.label)}
                                                activeOpacity={0.7}
                                            >
                                                {option.swatch_value ? (
                                                    <ProductImage
                                                        imageUrl={option.swatch_value}
                                                        style={styles.imageSwatch}
                                                        recyclingKey={`swatch-${option.id}`}
                                                        priority="normal"
                                                    />
                                                ) : (
                                                    <View style={styles.imageSwatch}>
                                                        <Text style={styles.imageSwatchText}>{option.label}</Text>
                                                    </View>
                                                )}
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                ) : null}

                                {/* Text Swatches (Size, etc.) */}
                                {attribute.swatch_type === 'text' || !attribute.swatch_type ? (
                                    <View style={styles.textSwatchGrid}>
                                        {availableOptions.map((option: any) => (
                                            <TouchableOpacity
                                                key={option.id}
                                                style={[
                                                    styles.textSwatch,
                                                    attribute.selectedValue === option.label && styles.textSwatchActive,
                                                ]}
                                                onPress={() => handleOptionSelect(attribute.id, option.label)}
                                                activeOpacity={0.7}
                                            >
                                                <Text
                                                    style={[
                                                        styles.textSwatchLabel,
                                                        attribute.selectedValue === option.label && styles.textSwatchLabelActive,
                                                    ]}
                                                >
                                                    {option.label}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                ) : null}
                            </>
                        )}
                    </View>
                );
            })}

            {/* Selected Variant Summary */}
            {/* {selectedVariantId && (
                <View style={styles.summaryCard}>
                    <View style={styles.summaryHeader}>
                        <Ionicons name="checkmark-circle" size={20} color={theme.colors.success.main} />
                        <Text style={styles.summaryTitle}>Configuration Complete</Text>
                    </View>
                    {attributes.map(attr => (
                        attr.selectedValue && (
                            <Text key={attr.id} style={styles.summaryText}>
                                {attr.label}: {attr.selectedValue}
                            </Text>
                        )
                    ))}
                </View>
            )} */}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        gap: theme.spacing.md,
    },
    card: {
        backgroundColor: theme.colors.white,
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.lg,
        borderWidth: 1,
        borderColor: theme.colors.border.main,
        marginBottom: theme.spacing.md,
        ...theme.shadows.sm,
    },
    attributeHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.md,
    },
    attributeLabel: {
        fontSize: theme.typography.fontSize.lg,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.text.primary,
    },
    selectedBadge: {
        fontSize: theme.typography.fontSize.sm,
        fontWeight: theme.typography.fontWeight.semiBold,
        color: theme.colors.primary[500],
        backgroundColor: theme.colors.primary[50],
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.xs,
        borderRadius: theme.borderRadius.full,
    },
    disabledText: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.text.secondary,
        fontStyle: 'italic',
        padding: theme.spacing.md,
        backgroundColor: theme.colors.background.paper,
        borderRadius: theme.borderRadius.md,
        textAlign: 'center',
    },
    noOptionsText: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.warning.main,
        fontStyle: 'italic',
        padding: theme.spacing.md,
        backgroundColor: theme.colors.warning.light,
        borderRadius: theme.borderRadius.md,
        textAlign: 'center',
    },
    swatchContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: theme.spacing.sm,
    },
    
    // Color Swatch Styles
    colorSwatchWrapper: {
        width: 40,
        height: 40,
        borderRadius: 20,
        padding: 3,
        borderWidth: 2,
        borderColor: theme.colors.border.main,
        position: 'relative',
        marginBottom: theme.spacing.sm,
    },
    colorSwatchWrapperActive: {
        borderColor: theme.colors.text.primary,
        borderWidth: 2.5,
    },
    colorSwatch: {
        width: '100%',
        height: '100%',
        borderRadius: 15,
        borderWidth: 1,
        borderColor: 'rgba(0, 0, 0, 0.1)',
    },
    colorCheckmark: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: [{ translateX: -6 }, { translateY: -6 }],
        width: 12,
        height: 12,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        borderRadius: 6,
        justifyContent: 'center',
        alignItems: 'center',
    },
    
    // Image Swatch Styles
    imageSwatchWrapper: {
        width: 55,
        height: 55,
        borderRadius: theme.borderRadius.md,
        borderWidth: 2,
        borderColor: theme.colors.border.main,
        overflow: 'hidden',
        marginBottom: theme.spacing.sm,
    },
    imageSwatchWrapperActive: {
        borderColor: theme.colors.primary[500],
        borderWidth: 2.5,
    },
    imageSwatch: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.background.paper,
    },
    imageSwatchText: {
        fontSize: theme.typography.fontSize.xs,
        color: theme.colors.text.secondary,
        textAlign: 'center',
        paddingHorizontal: 4,
    },
    
    // Text Swatch Styles (Sizes) - Grid Layout
    textSwatchGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: theme.spacing.sm,
    },
    textSwatch: {
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        borderRadius: theme.borderRadius.full,
        borderWidth: 1,
        borderColor: theme.colors.border.main,
        backgroundColor: theme.colors.white,
        minWidth: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
    textSwatchActive: {
        backgroundColor: '#1E3A8A', // Navy blue matching web app
        borderColor: '#1E3A8A',
    },
    textSwatchLabel: {
        fontSize: theme.typography.fontSize.sm,
        fontWeight: theme.typography.fontWeight.semiBold,
        color: theme.colors.text.primary,
        textTransform: 'uppercase',
    },
    textSwatchLabelActive: {
        color: theme.colors.white,
    },
    
    // Summary Card
    summaryCard: {
        backgroundColor: theme.colors.success.light,
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.lg,
        borderWidth: 1,
        borderColor: theme.colors.success.main,
        borderLeftWidth: 4,
        ...theme.shadows.sm,
    },
    summaryHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.spacing.sm,
        gap: theme.spacing.sm,
    },
    summaryTitle: {
        fontSize: theme.typography.fontSize.base,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.success.dark,
    },
    summaryText: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.text.primary,
        marginBottom: 4,
        fontWeight: theme.typography.fontWeight.medium,
    },
});

export default ConfigurableOptions;
