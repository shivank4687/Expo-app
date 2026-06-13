import { useState, useCallback } from 'react';
import { productAttributesApi } from '../api/product-attributes.api';
import type { ProductAttribute } from '../api/product-attributes.api';
import type { ProductType } from '../types';

interface UseProductAttributesResult {
    attributes: ProductAttribute[];
    attributeFamilyId: number | null;
    isLoading: boolean;
    error: string | null;
    fetchAttributes: () => Promise<void>;
}

/**
 * Shared hook for fetching and refreshing product attributes.
 * Used by both AddProductScreen and EditProductScreen.
 */
export function useProductAttributes(productType: ProductType): UseProductAttributesResult {
    const [attributes, setAttributes] = useState<ProductAttribute[]>([]);
    const [attributeFamilyId, setAttributeFamilyId] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchAttributes = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);
            const data = await productAttributesApi.getProductAttributes(productType);
            setAttributes(data.attributes);
            setAttributeFamilyId(data.attribute_family.id);
        } catch (err) {
            console.error('Error fetching product attributes:', err);
            setError('Failed to load product attributes. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }, [productType]);

    return { attributes, attributeFamilyId, isLoading, error, fetchAttributes };
}
