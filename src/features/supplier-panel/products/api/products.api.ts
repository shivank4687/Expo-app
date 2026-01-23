/**
 * Products API client for supplier panel
 */

import { restApiClient } from '@/services/api/client';
import { API_ENDPOINTS } from '@/config/constants';
import type { ProductsListResponse, ProductsListParams } from '../types/products.types';

export const productsApi = {
    /**
     * Get products list for the authenticated supplier
     * @param params - Pagination parameters (page, per_page)
     * @returns Promise<ProductsListResponse>
     */
    async getProductsList(params?: ProductsListParams): Promise<ProductsListResponse> {
        try {
            const response = await restApiClient.get<{ data: ProductsListResponse }>(
                API_ENDPOINTS.SUPPLIER_PRODUCTS_LIST,
                { params }
            );

            return response.data;
        } catch (error) {
            console.error('Error fetching products list:', error);
            throw error;
        }
    },

    /**
     * Update product status
     * @param productId - Product ID
     * @param status - New status (active/inactive)
     * @returns Promise<void>
     */
    async updateProductStatus(productId: number, status: 'active' | 'inactive'): Promise<void> {
        try {
            const endpoint = API_ENDPOINTS.SUPPLIER_PRODUCT_UPDATE.replace(':id', productId.toString());
            await restApiClient.put(endpoint, { status });
        } catch (error) {
            console.error('Error updating product status:', error);
            throw error;
        }
    },
};
