import { useState, useCallback } from 'react';
import { productsApi } from '@/services/api/products.api';
import { ProductVariant } from '../types/product.types';

export interface AttributeState {
    id: number;
    code: string;
    label: string;
    swatch_type?: string;
    options: VariantOption[];
    selectedValue: string | null;
}

export interface VariantOption {
    id: number;
    label: string;
    swatch_value?: string;
}

export interface UseProductVariantsReturn {
    /** Attribute list with current selection state */
    attributes: AttributeState[];
    /** Resolved variant ID once all attributes are selected */
    selectedVariantId: number | null;
    /** Derived final (sale) price for the selected variant */
    displayPrice: number | null;
    /** Derived regular (original) price – present when discounted */
    displayRegularPrice: number | null;
    /** First image URL for the selected variant (card thumbnail) */
    displayImageUrl: string | null;
    /** True while the configurable-config is being fetched */
    isLoading: boolean;
    /** Error string if the fetch failed */
    error: string | null;
    /** Call this lazily (e.g. on first "Select Options" tap) to load config */
    fetchConfig: () => Promise<void>;
    /** Call when user picks an option for an attribute */
    handleOptionSelect: (attributeId: number, optionLabel: string) => void;
    /** Returns the options valid for an attribute given prior selections */
    getAvailableOptions: (attribute: AttributeState, attrIndex: number) => VariantOption[];
    /** True once all attributes have a selection */
    isFullySelected: boolean;
    /** Reset all selections */
    reset: () => void;
}

/**
 * useProductVariants
 *
 * Manages variant selection state for a configurable product.
 * Config is fetched **lazily** (call `fetchConfig()` on demand) to avoid
 * firing N API calls when N cards are rendered simultaneously.
 */
export function useProductVariants(
    productId: number,
    fallbackVariants?: ProductVariant[],
): UseProductVariantsReturn {
    const [configurableConfig, setConfigurableConfig] = useState<any>(null);
    const [attributes, setAttributes] = useState<AttributeState[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);
    const [displayPrice, setDisplayPrice] = useState<number | null>(null);
    const [displayRegularPrice, setDisplayRegularPrice] = useState<number | null>(null);
    const [displayImageUrl, setDisplayImageUrl] = useState<string | null>(null);

    // ─── Lazy fetch ──────────────────────────────────────────────────────────

    const fetchConfig = useCallback(async () => {
        if (configurableConfig || isLoading) return; // already loaded / in-flight

        setIsLoading(true);
        setError(null);

        try {
            const config = await productsApi.getConfigurableConfig(productId);
            setConfigurableConfig(config);

            if (config?.attributes) {
                setAttributes(
                    config.attributes.map((attr: any) => ({
                        id: attr.id,
                        code: attr.code,
                        label: attr.label,
                        swatch_type: attr.swatch_type,
                        options: attr.options || [],
                        selectedValue: null,
                    })),
                );
            }
        } catch (err: any) {
            setError(err?.message || 'Failed to load options');
        } finally {
            setIsLoading(false);
        }
    }, [productId, configurableConfig, isLoading]);

    // ─── Option selection + variant resolution ────────────────────────────────

    const resolveVariant = useCallback(
        (updatedAttributes: AttributeState[], config: any) => {
            if (!config?.index) return;

            const allSelected = updatedAttributes.every(attr => attr.selectedValue !== null);
            if (!allSelected) {
                setSelectedVariantId(null);
                setDisplayPrice(null);
                setDisplayRegularPrice(null);
                setDisplayImageUrl(null);
                return;
            }

            // Find matching variant from config.index
            // Structure: { variant_id: { attribute_id: option_id } }
            const matchingVariantId = Object.keys(config.index).find(variantId => {
                const variantIndex = config.index[variantId];
                return updatedAttributes.every(attr => {
                    const selectedOption = attr.options.find(opt => opt.label === attr.selectedValue);
                    if (!selectedOption) return false;
                    return variantIndex[attr.id] === selectedOption.id;
                });
            });

            if (!matchingVariantId) {
                setSelectedVariantId(null);
                setDisplayPrice(null);
                setDisplayRegularPrice(null);
                setDisplayImageUrl(null);
                return;
            }

            const variantId = parseInt(matchingVariantId, 10);
            setSelectedVariantId(variantId);

            // ── Price ──
            if (config.variant_prices?.[variantId]) {
                const priceData = config.variant_prices[variantId];
                const finalPrice = priceData.final?.price ?? priceData.regular?.price ?? null;
                const regularPrice = priceData.regular?.price ?? null;
                setDisplayPrice(finalPrice);
                // Only show regular price as "original" when there's an actual discount
                setDisplayRegularPrice(
                    regularPrice && finalPrice && regularPrice > finalPrice ? regularPrice : null,
                );
            } else {
                // Fallback: look in the variants array passed as prop
                const variant = fallbackVariants?.find(v => v.id === variantId);
                if (variant) {
                    setDisplayPrice(variant.price ?? null);
                    setDisplayRegularPrice(null);
                }
            }

            // ── Image (first image URL → thumbnail) ──
            if (config.variant_images?.[variantId]) {
                const images: any[] = config.variant_images[variantId];
                const firstImage = images[0];
                if (firstImage) {
                    const url =
                        typeof firstImage === 'string'
                            ? firstImage
                            : firstImage.url ||
                            firstImage.large_image_url ||
                            firstImage.medium_image_url ||
                            firstImage.original_image_url ||
                            firstImage.small_image_url ||
                            null;
                    setDisplayImageUrl(url);
                }
            } else {
                setDisplayImageUrl(null);
            }
        },
        [fallbackVariants],
    );

    const handleOptionSelect = useCallback(
        (attributeId: number, optionLabel: string) => {
            setAttributes(prev => {
                const currentIndex = prev.findIndex(a => a.id === attributeId);
                const updated = prev.map((attr, index) => {
                    if (attr.id === attributeId) {
                        return { ...attr, selectedValue: optionLabel };
                    }
                    // Reset subsequent attributes when an earlier one changes
                    if (index > currentIndex) {
                        return { ...attr, selectedValue: null };
                    }
                    return attr;
                });
                resolveVariant(updated, configurableConfig);
                return updated;
            });
        },
        [configurableConfig, resolveVariant],
    );

    // ─── Cascading option filtering ───────────────────────────────────────────

    const getAvailableOptions = useCallback(
        (attribute: AttributeState, attrIndex: number): VariantOption[] => {
            if (!configurableConfig?.index) return attribute.options;
            if (attrIndex === 0) return attribute.options;

            const previousAttrs = attributes.slice(0, attrIndex);
            const allPreviousSelected = previousAttrs.every(a => a.selectedValue !== null);
            if (!allPreviousSelected) return [];

            const possibleVariantIds = Object.keys(configurableConfig.index).filter(variantId => {
                const variantIndex = configurableConfig.index[variantId];
                return previousAttrs.every(prevAttr => {
                    const selectedOption = prevAttr.options.find(opt => opt.label === prevAttr.selectedValue);
                    return selectedOption && variantIndex[prevAttr.id] === selectedOption.id;
                });
            });

            return attribute.options.filter(option =>
                possibleVariantIds.some(variantId => {
                    const variantIndex = configurableConfig.index[variantId];
                    return variantIndex[attribute.id] === option.id;
                }),
            );
        },
        [attributes, configurableConfig],
    );

    const reset = useCallback(() => {
        setAttributes(prev => prev.map(attr => ({ ...attr, selectedValue: null })));
        setSelectedVariantId(null);
        setDisplayPrice(null);
        setDisplayRegularPrice(null);
        setDisplayImageUrl(null);
    }, []);

    const isFullySelected =
        attributes.length > 0 && attributes.every(attr => attr.selectedValue !== null);

    return {
        attributes,
        selectedVariantId,
        displayPrice,
        displayRegularPrice,
        displayImageUrl,
        isLoading,
        error,
        fetchConfig,
        handleOptionSelect,
        getAvailableOptions,
        isFullySelected,
        reset,
    };
}
