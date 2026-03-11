/**
 * Products API client for supplier panel
 */

import { API_ENDPOINTS } from '@/config/constants';
import { restApiClient } from '@/services/api/client';
import type { ProductsListParams, ProductsListResponse } from '../types/products.types';

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
     * Quick update product (status, price, stock)
     * @param productId - Product ID
     * @param updates - Fields to update (status, price, stock)
     * @returns Promise<void>
     */
    async quickUpdateProduct(
        productId: number,
        updates: {
            status?: 'active' | 'inactive';
            price?: number;
            stock?: number;
        }
    ): Promise<void> {
        try {
            const endpoint = API_ENDPOINTS.SUPPLIER_PRODUCT_QUICK_UPDATE.replace(':id', productId.toString());
            await restApiClient.patch(endpoint, updates);
        } catch (error) {
            console.error('Error quick updating product:', error);
            throw error;
        }
    },
};
