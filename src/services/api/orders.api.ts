/**
 * Orders API Service
 * Handles all order-related API calls
 * Uses REST API v1 endpoints
 */

import { restApiClient } from './client';

export interface OrderAddress {
    id?: number;
    first_name: string;
    last_name: string;
    email?: string;
    phone?: string;
    address1?: string[];
    address?: string[];
    city?: string;
    state?: string;
    postcode?: string;
    country?: string;
    country_name?: string;
    company_name?: string;
    address2?: string;
}

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
    shipping_address?: OrderAddress;
    billing_address?: OrderAddress;
    payment_title?: string;
    shipping_title?: string;
    // Order totals
    sub_total?: number;
    formatted_sub_total?: string;
    sub_total_incl_tax?: number;
    formatted_sub_total_incl_tax?: string;
    shipping_amount?: number;
    formatted_shipping_amount?: string;
    shipping_amount_incl_tax?: number;
    formatted_shipping_amount_incl_tax?: string;
    tax_amount?: number;
    formatted_tax_amount?: string;
    discount_amount?: number;
    formatted_discount_amount?: string;
    coupon_code?: string;
    grand_total_invoiced?: number;
    formatted_grand_total_invoiced?: string;
    grand_total_refunded?: number;
    formatted_grand_total_refunded?: string;
    total_due?: number;
    formatted_total_due?: string;
    // Additional fields
    can_cancel?: boolean;
    can_reorder?: boolean;
    order_currency_code?: string;
}

export interface OrderItem {
    id: number;
    name: string;
    sku: string;
    qty_ordered: number;
    qty_invoiced?: number;
    qty_shipped?: number;
    qty_refunded?: number;
    qty_canceled?: number;
    price: number;
    formatted_price: string;
    price_incl_tax?: number;
    formatted_price_incl_tax?: string;
    total: number;
    formatted_total: string;
    total_incl_tax?: number;
    formatted_total_incl_tax?: string;
    product_id: number;
    product_image?: string;
    base_image?: {
        small_image_url?: string;
        medium_image_url?: string;
        large_image_url?: string;
    };
    additional?: {
        attributes?: Array<{
            attribute_name: string;
            option_label: string;
        }>;
    };
    tax_percent?: number;
    tax_amount?: number;
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

