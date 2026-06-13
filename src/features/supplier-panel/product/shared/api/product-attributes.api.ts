/**
 * Product Attributes API client for supplier panel
 * Fetches product attributes for creating/editing products
 */

import { restApiClient } from '@/services/api/client';
import { API_ENDPOINTS } from '@/config/constants';

/**
 * Product attribute option interface (for select, multiselect, checkbox types)
 */
export interface AttributeOption {
    id: number;
    admin_name: string;
    sort_order: number;
    swatch_value: string | null;
}

/**
 * Product attribute interface
 */
export interface ProductAttribute {
    id: number;
    code: string;
    admin_name: string;
    type: string;
    validation: string | null;
    is_required: boolean;
    is_unique: boolean;
    value_per_locale: boolean;
    value_per_channel: boolean;
    options?: AttributeOption[];
}

/**
 * Attribute family interface
 */
export interface AttributeFamily {
    id: number;
    code: string;
    name: string;
}

/**
 * Product attributes API response interface
 */
export interface ProductAttributesResponse {
    attributes: ProductAttribute[];
    attribute_family: AttributeFamily;
}

/**
 * Product attributes API service
 */
export const productAttributesApi = {
    /**
     * Get product attributes for creating/editing products
     * @param productType - Product type (default: 'simple')
     * @param attributeFamilyId - Optional attribute family ID
     * @returns Promise<ProductAttributesResponse>
     */
    async getProductAttributes(
        productType: string = 'simple',
        attributeFamilyId?: number
    ): Promise<ProductAttributesResponse> {
        try {
            const params = new URLSearchParams();
            params.append('product_type', productType);

            if (attributeFamilyId) {
                params.append('attribute_family_id', attributeFamilyId.toString());
            }

            const response = await restApiClient.get<{ data: ProductAttributesResponse }>(
                `${API_ENDPOINTS.SUPPLIER_PRODUCT_ATTRIBUTES}?${params.toString()}`
            );

            return response.data;
        } catch (error) {
            console.error('Error fetching product attributes:', error);
            throw error;
        }
    },

    /**
     * Create a new attribute option
     * @param attributeCode - The attribute code (e.g., 'material_type')
     * @param adminName - The display name for the new option
     * @returns Promise<AttributeOption>
     */
    async createAttributeOption(
        attributeCode: string,
        adminName: string
    ): Promise<AttributeOption> {
        try {
            const response = await restApiClient.post<{ data: AttributeOption }>(
                `${API_ENDPOINTS.SUPPLIER_PRODUCTS_LIST}/attribute-options`,
                {
                    attribute_code: attributeCode,
                    admin_name: adminName,
                }
            );

            return response.data;
        } catch (error) {
            console.error('Error creating attribute option:', error);
            throw error;
        }
    },
};

export default productAttributesApi;
