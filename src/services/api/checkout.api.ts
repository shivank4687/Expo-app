/**
 * Checkout API Service
 * Handles all checkout-related API calls
 * Uses REST API v1 endpoints
 */

import { restApiClient } from './client';
import { Cart } from '@/features/cart/types/cart.types';
import {
    SaveAddressPayload,
    SaveShippingMethodPayload,
    SavePaymentMethodPayload,
    ShippingMethod,
    PaymentMethod
} from '@/features/checkout/types/checkout.types';

interface CheckoutResponse<T = any> {
    data: T;
    message?: string;
    redirect?: boolean;
    redirect_url?: string;
}

/**
 * Checkout API endpoints
 */
export const checkoutApi = {
    /**
     * Save addresses (billing and shipping)
     * Returns shipping methods (REST API v1 endpoint)
     */
    saveAddress: async (payload: SaveAddressPayload): Promise<{ rates?: any[], cart?: Cart }> => {
        try {
            console.log('[checkout.api] Sending payload to REST API:', JSON.stringify(payload, null, 2));
            
            const response = await restApiClient.post<CheckoutResponse>(
                '/customer/checkout/save-address',
                payload
            );

            console.log('[checkout.api] Response from REST API:', JSON.stringify(response, null, 2));

            if (response.redirect_url) {
                throw new Error('Redirect required');
            }

            // REST API returns: { data: { rates: [...], cart: {...} }, message: "..." }
            return response.data || {};
        } catch (error: any) {
            console.error('[checkout.api] Save address error:', error);
            console.error('[checkout.api] Error response:', error.response?.data);
            throw new Error(error.response?.data?.message || error.message || 'Failed to save address');
        }
    },

    /**
     * Save shipping method
     * Returns available payment methods
     */
    saveShipping: async (payload: SaveShippingMethodPayload): Promise<{ methods?: PaymentMethod[], cart?: Cart }> => {
        try {
            console.log('[checkout.api] Sending shipping method:', JSON.stringify(payload, null, 2));
            
            const response = await restApiClient.post<CheckoutResponse>(
                '/customer/checkout/save-shipping',
                payload
            );
            
            console.log('[checkout.api] Shipping response:', JSON.stringify(response, null, 2));
            
            // REST API returns: { data: { methods: [...], cart: {...} }, message: "..." }
            return response.data || {};
        } catch (error: any) {
            console.error('[checkout.api] Save shipping error:', error);
            console.error('[checkout.api] Error details:', {
                status: error.response?.status,
                data: error.response?.data,
                message: error.message
            });
            throw new Error(error.response?.data?.message || error.message || 'Failed to save shipping method');
        }
    },

    /**
     * Save payment method
     * Returns updated cart
     */
    savePayment: async (payload: SavePaymentMethodPayload): Promise<{ cart?: Cart }> => {
        try {
            const response = await restApiClient.post<CheckoutResponse>(
                '/customer/checkout/save-payment',
                payload
            );
            return response.data || {};
        } catch (error: any) {
            console.error('Save payment error:', error);
            throw new Error(error.response?.data?.message || error.message || 'Failed to save payment method');
        }
    },

    /**
     * Place order
     */
    placeOrder: async (): Promise<any> => {
        try {
            console.log('[checkout.api] Placing order...');
            const response = await restApiClient.post<any>(
                '/customer/checkout/save-order'
            );
            
            console.log('[checkout.api] Place order response:', JSON.stringify(response, null, 2));
            console.log('[checkout.api] Response structure:', {
                hasData: !!response.data,
                hasRedirectUrl: !!response.redirect_url,
                hasOrder: !!(response.data?.order || response.order),
                fullResponse: response
            });
            
            // Return full response to preserve redirect_url and other top-level fields
            // Backend returns: { redirect_url?: '...', data?: { order: {...} }, message?: '...' }
            return response || {};
        } catch (error: any) {
            console.error('[checkout.api] Place order error:', error);
            console.error('[checkout.api] Error response:', {
                status: error.response?.status,
                data: error.response?.data,
                message: error.message
            });
            throw new Error(error.response?.data?.message || error.message || 'Failed to place order');
        }
    },

    /**
     * Check minimum order amount
     */
    checkMinimumOrder: async (): Promise<{ status: boolean }> => {
        try {
            const response = await restApiClient.post<CheckoutResponse<{ status: boolean }>>(
                '/customer/checkout/check-minimum-order'
            );
            return response.data || { status: false };
        } catch (error: any) {
            console.error('Check minimum order error:', error);
            throw new Error(error.response?.data?.message || error.message || 'Failed to check minimum order');
        }
    },
};

