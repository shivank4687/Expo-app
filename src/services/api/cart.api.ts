/**
 * Cart API Service
 * Handles all cart-related API calls
 * Uses REST API v1 endpoints (/api/v1/customer/cart) with Bearer token authentication
 */

import { restApiClient } from './client';
import { 
    Cart, 
    AddToCartPayload, 
    UpdateCartItemPayload, 
    RemoveCartItemPayload,
    ApplyCouponPayload,
    MoveToWishlistPayload
} from '@/features/cart/types/cart.types';

interface CartResponse {
    data: Cart | null;
    message?: string;
}

/**
 * Cart API endpoints
 */
export const cartApi = {
    /**
     * Get current cart
     */
    getCart: async (): Promise<Cart | null> => {
        try {
            const response = await restApiClient.get<CartResponse>('/customer/cart');
            // restApiClient.get already returns response.data, so response is CartResponse
            return response?.data || null;
        } catch (error: any) {
            console.error('Get cart error:', error);
            // Return null if cart doesn't exist or error
            if (error.response?.status === 404 || error.response?.status === 401) {
                return null;
            }
            throw error;
        }
    },

    /**
     * Add item to cart
     */
    addToCart: async (payload: AddToCartPayload): Promise<Cart> => {
        try {
            // REST API expects: POST /customer/cart/add/{productId} with product_id in body too
            const response = await restApiClient.post<CartResponse>(
                `/customer/cart/add/${payload.product_id}`,
                {
                    product_id: payload.product_id,
                    quantity: payload.quantity || 1,
                    ...payload
                }
            );
            // restApiClient.post already returns response.data
            if (!response.data) {
                throw new Error('Invalid cart response');
            }
            return response.data;
        } catch (error: any) {
            console.error('Add to cart error:', error);
            throw new Error(error.response?.data?.message || error.message || 'Failed to add item to cart');
        }
    },

    /**
     * Update cart item quantity
     */
    updateCartItem: async (payload: UpdateCartItemPayload): Promise<Cart> => {
        try {
            const response = await restApiClient.put<CartResponse>(
                '/customer/cart/update',
                payload
            );
            if (!response.data) {
                throw new Error('Invalid cart response');
            }
            return response.data;
        } catch (error: any) {
            console.error('Update cart error:', error);
            throw new Error(error.response?.data?.message || error.message || 'Failed to update cart');
        }
    },

    /**
     * Remove item from cart
     */
    removeFromCart: async (cartItemId: number): Promise<Cart | null> => {
        try {
            // REST API expects: DELETE /customer/cart/remove/{cartItemId}
            const response = await restApiClient.delete<CartResponse>(
                `/customer/cart/remove/${cartItemId}`
            );
            return response?.data || null;
        } catch (error: any) {
            console.error('Remove from cart error:', error);
            throw new Error(error.response?.data?.message || error.message || 'Failed to remove item from cart');
        }
    },

    /**
     * Apply coupon code
     */
    applyCoupon: async (payload: ApplyCouponPayload): Promise<Cart> => {
        try {
            const response = await restApiClient.post<CartResponse>(
                '/customer/cart/coupon',
                payload
            );
            if (!response.data) {
                throw new Error('Invalid cart response');
            }
            return response.data;
        } catch (error: any) {
            console.error('Apply coupon error:', error);
            throw new Error(error.response?.data?.message || error.message || 'Failed to apply coupon');
        }
    },

    /**
     * Remove coupon code
     */
    removeCoupon: async (): Promise<Cart> => {
        try {
            const response = await restApiClient.delete<CartResponse>(
                '/customer/cart/coupon'
            );
            if (!response.data) {
                throw new Error('Invalid cart response');
            }
            return response.data;
        } catch (error: any) {
            console.error('Remove coupon error:', error);
            throw new Error(error.response?.data?.message || error.message || 'Failed to remove coupon');
        }
    },

    /**
     * Move item to wishlist
     */
    moveToWishlist: async (cartItemId: number): Promise<Cart | null> => {
        try {
            // REST API expects: POST /customer/cart/move-to-wishlist/{cartItemId}
            const response = await restApiClient.post<CartResponse>(
                `/customer/cart/move-to-wishlist/${cartItemId}`
            );
            return response?.data || null;
        } catch (error: any) {
            console.error('Move to wishlist error:', error);
            throw new Error(error.response?.data?.message || error.message || 'Failed to move item to wishlist');
        }
    },

    /**
     * Clear entire cart (remove all items)
     */
    clearCart: async (): Promise<void> => {
        try {
            // REST API has a specific endpoint to remove all items
            await restApiClient.delete('/customer/cart/remove');
        } catch (error: any) {
            console.error('Clear cart error:', error);
            throw new Error(error.response?.data?.message || error.message || 'Failed to clear cart');
        }
    },
};

