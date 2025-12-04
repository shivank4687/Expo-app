/**
 * Checkout API Service
 * Handles all checkout-related API calls
 * Uses Shop API endpoints
 */

import { shopApiClient } from './client';
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
     * Get checkout summary (cart details)
     */
    getSummary: async (): Promise<Cart> => {
        try {
            const response = await shopApiClient.get<Cart>('/checkout/onepage/summary');
            return response;
        } catch (error: any) {
            console.error('Get checkout summary error:', error);
            throw new Error(error.response?.data?.message || error.message || 'Failed to get checkout summary');
        }
    },

    /**
     * Save addresses (billing and shipping)
     * Returns shipping methods if cart has stockable items, otherwise payment methods
     */
    saveAddress: async (payload: SaveAddressPayload): Promise<{ shippingMethods?: Record<string, ShippingMethod>, payment_methods?: PaymentMethod[] }> => {
        try {
            const response = await shopApiClient.post<CheckoutResponse>(
                '/checkout/onepage/addresses',
                payload
            );

            if (response.redirect) {
                throw new Error('Redirect required');
            }

            return response.data;
        } catch (error: any) {
            console.error('Save address error:', error);
            throw new Error(error.response?.data?.message || error.message || 'Failed to save address');
        }
    },

    /**
     * Save shipping method
     * Returns available payment methods
     */
    saveShipping: async (payload: SaveShippingMethodPayload): Promise<{ payment_methods: PaymentMethod[] }> => {
        try {
            const response = await shopApiClient.post<{ payment_methods: PaymentMethod[] }>(
                '/checkout/onepage/save-shipping',
                payload
            );
            return response;
        } catch (error: any) {
            console.error('Save shipping error:', error);
            throw new Error(error.response?.data?.message || error.message || 'Failed to save shipping method');
        }
    },

    /**
     * Save payment method
     * Returns updated cart
     */
    savePayment: async (payload: SavePaymentMethodPayload): Promise<{ cart: Cart }> => {
        try {
            const response = await shopApiClient.post<{ cart: Cart }>(
                '/checkout/onepage/save-payment',
                payload
            );
            return response;
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
            const response = await shopApiClient.post<any>(
                '/checkout/onepage/save-order'
            );
            return response;
        } catch (error: any) {
            console.error('Place order error:', error);
            throw new Error(error.response?.data?.message || error.message || 'Failed to place order');
        }
    },

    /**
     * Check minimum order amount
     */
    checkMinimumOrder: async (): Promise<{ status: boolean }> => {
        try {
            const response = await shopApiClient.post<{ status: boolean }>(
                '/checkout/onepage/check-minimum-order'
            );
            return response;
        } catch (error: any) {
            console.error('Check minimum order error:', error);
            throw new Error(error.response?.data?.message || error.message || 'Failed to check minimum order');
        }
    },
};

