import { restApiClient } from './client';
import { FilterResponse, MaxPriceResponse } from '@/types/filters.types';

export const filtersApi = {
    /**
     * Get available filter attributes for a category
     * @param categoryId - Optional category ID to filter by
     * @returns Promise with filter attributes
     */
    async getFilterAttributes(categoryId?: number): Promise<FilterResponse> {
        const params = categoryId ? { category_id: categoryId } : {};
        const response = await restApiClient.get<FilterResponse>('/categories/attributes', { params });
        return response;
    },

    /**
     * Get maximum price for price range filter
     * @param categoryId - Optional category ID to filter by
     * @returns Promise with max price
     */
    async getMaxPrice(categoryId?: number): Promise<number> {
        const url = categoryId
            ? `/categories/max-price/${categoryId}`
            : '/categories/max-price/0';
        const response = await restApiClient.get<MaxPriceResponse>(url);
        return response.data.max_price || 100; // Default to 100 if no max price
    },
};
