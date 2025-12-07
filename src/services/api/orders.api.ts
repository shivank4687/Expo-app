/**
 * Orders API Service
 * Handles all order-related API calls
 * Uses REST API v1 endpoints
 */

import { restApiClient } from './client';

export interface Order {
    id: number;
    increment_id: string;
    status: string;
    status_label: string;
    created_at: string;
    formatted_grand_total: string;
    grand_total: number;
    total_qty_ordered: number;
    total_item_count: number;
    items?: OrderItem[];
    shipping_address?: any;
    billing_address?: any;
    payment_title?: string;
    shipping_title?: string;
}

export interface OrderItem {
    id: number;
    name: string;
    sku: string;
    qty_ordered: number;
    price: number;
    formatted_price: string;
    total: number;
    formatted_total: string;
    product_id: number;
}

interface OrdersResponse {
    data: Order[];
    meta?: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
}

/**
 * Orders API endpoints
 */
export const ordersApi = {
    /**
     * Get customer orders list
     * @param params Query parameters (page, limit, sort, order)
     */
    getOrders: async (params?: {
        page?: number;
        limit?: number;
        sort?: string;
        order?: 'asc' | 'desc';
    }): Promise<OrdersResponse> => {
        try {
            const response = await restApiClient.get<any>(
                '/customer/orders',
                { params: { sort: 'id', order: 'desc', page: 1, limit: 20, ...params } }
            );
            
            console.log('[orders.api] Raw response:', JSON.stringify(response, null, 2));
            
            // Handle different response structures
            // If response has data property, use it; otherwise use response directly
            if (response.data && Array.isArray(response.data)) {
                return {
                    data: response.data,
                    meta: response.meta,
                };
            } else if (Array.isArray(response)) {
                // If response is directly an array
                return {
                    data: response,
                    meta: undefined,
                };
            } else {
                // Fallback
                return {
                    data: response.data || [],
                    meta: response.meta,
                };
            }
        } catch (error: any) {
            console.error('Get orders error:', error);
            throw new Error(error.response?.data?.message || error.message || 'Failed to fetch orders');
        }
    },

    /**
     * Get single order by ID
     */
    getOrder: async (id: number): Promise<{ data: Order }> => {
        try {
            const response = await restApiClient.get<{ data: Order }>(
                `/customer/orders/${id}`
            );
            return response;
        } catch (error: any) {
            console.error('Get order error:', error);
            throw new Error(error.response?.data?.message || error.message || 'Failed to fetch order');
        }
    },

    /**
     * Cancel an order
     */
    cancelOrder: async (id: number): Promise<{ message: string }> => {
        try {
            const response = await restApiClient.post<{ message: string }>(
                `/customer/orders/${id}/cancel`
            );
            return response;
        } catch (error: any) {
            console.error('Cancel order error:', error);
            throw new Error(error.response?.data?.message || error.message || 'Failed to cancel order');
        }
    },

    /**
     * Reorder items from an order
     */
    reorder: async (id: number): Promise<any> => {
        try {
            const response = await restApiClient.post(
                `/customer/orders/${id}/reorder`
            );
            return response;
        } catch (error: any) {
            console.error('Reorder error:', error);
            throw new Error(error.response?.data?.message || error.message || 'Failed to reorder');
        }
    },
};

