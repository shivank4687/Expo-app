/**
 * Products API client for supplier panel
 */

import { restApiClient } from '@/services/api/client';
import { API_ENDPOINTS } from '@/config/constants';
import type { ProductsListResponse } from '../types/products.types';

export const productsApi = {
    /**
     * Get products list for the authenticated supplier
     * @returns Promise<ProductsListResponse>
     */
    async getProductsList(): Promise<ProductsListResponse> {
        try {
            const response = await restApiClient.get<{ data: ProductsListResponse }>(
                API_ENDPOINTS.SUPPLIER_PRODUCTS_LIST
            );

            return response.data;
        } catch (error) {
            console.error('Error fetching products list:', error);
            throw error;
        }
    },
};
