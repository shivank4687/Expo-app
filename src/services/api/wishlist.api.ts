/**
 * Wishlist API Service
 * Handles all wishlist-related API calls
 */

import { restApiClient as api } from './client';
import { WishlistItem, WishlistResponse, WishlistPayload } from '@/features/wishlist/types/wishlist.types';

/**
 * Get customer wishlist
 */
const getWishlist = async (): Promise<WishlistItem[]> => {
    try {
        console.log('[WishlistAPI] Fetching wishlist from /customer/wishlist...');
        
        const response = await api.get('/customer/wishlist');
        
        console.log('[WishlistAPI] Response received');
        console.log('[WishlistAPI] Response type:', typeof response);
        console.log('[WishlistAPI] Is response an array?', Array.isArray(response));
        console.log('[WishlistAPI] Response keys:', response ? Object.keys(response) : 'null');
        
        // Backend returns: response(['data' => CustomerWishlistResource::collection(...)])
        // Axios client.get() extracts response.data, so we receive: { data: [...] }
        
        // The response should be an object with a 'data' field containing the array
        if (response && typeof response === 'object' && 'data' in response && Array.isArray(response.data)) {
            console.log('[WishlistAPI] ✅ Found data array, count:', response.data.length);
            return response.data;
        }
        
        // Fallback: response might directly be the array (unlikely but handle it)
        if (Array.isArray(response)) {
            console.log('[WishlistAPI] ✅ Response is directly an array, count:', response.length);
            return response;
        }
        
        // If we reach here, structure is unexpected
        console.error('[WishlistAPI] ❌ Unexpected response structure:', response);
        return [];
        
    } catch (error: any) {
        console.error('[WishlistAPI] ❌ Error fetching wishlist:', error);
        console.error('[WishlistAPI] Error status:', error.response?.status);
        console.error('[WishlistAPI] Error data:', error.response?.data);
        throw new Error(error.response?.data?.message || error.message || 'Failed to fetch wishlist');
    }
};

/**
 * Add or remove product from wishlist (toggle)
 * If product exists in wishlist, it will be removed
 * If product doesn't exist, it will be added
 */
const toggleWishlist = async (productId: number): Promise<WishlistResponse> => {
    try {
        console.log('[WishlistAPI] Toggling wishlist for product:', productId);
        const response = await api.post(`/customer/wishlist/${productId}`);
        console.log('[WishlistAPI] Toggle response:', response);
        
        // Return the response as-is (contains message and possibly data)
        return response as WishlistResponse;
    } catch (error: any) {
        console.error('[WishlistAPI] Error toggling wishlist:', error);
        console.error('[WishlistAPI] Error response:', error.response?.data);
        throw new Error(error.response?.data?.message || 'Failed to update wishlist');
    }
};

/**
 * Remove product from wishlist
 * This is the same as toggleWishlist when product exists in wishlist
 */
const removeFromWishlist = async (productId: number): Promise<WishlistItem[]> => {
    try {
        console.log('[WishlistAPI] Removing product from wishlist:', productId);
        const response = await api.post(`/customer/wishlist/${productId}`);
        console.log('[WishlistAPI] Remove response:', response);
        
        // Backend returns updated wishlist after removal
        if (response && typeof response === 'object' && 'data' in response && Array.isArray(response.data)) {
            console.log('[WishlistAPI] Returning updated items, count:', response.data.length);
            return response.data;
        }
        
        console.warn('[WishlistAPI] Unexpected remove response, returning empty array');
        return [];
    } catch (error: any) {
        console.error('[WishlistAPI] Error removing from wishlist:', error);
        throw new Error(error.response?.data?.message || 'Failed to remove from wishlist');
    }
};

/**
 * Move product from wishlist to cart
 */
const moveToCart = async (productId: number, quantity: number = 1): Promise<any> => {
    try {
        console.log('[WishlistAPI] Moving product to cart:', { productId, quantity });
        const response = await api.post(`/customer/wishlist/${productId}/move-to-cart`, { quantity });
        console.log('[WishlistAPI] Move to cart response:', response);
        
        // Backend returns: { data: CartResource, message: "..." }
        return response;
    } catch (error: any) {
        console.error('[WishlistAPI] Error moving to cart:', error);
        console.error('[WishlistAPI] Error response:', error.response?.data);
        throw new Error(error.response?.data?.message || 'Failed to move to cart');
    }
};

/**
 * Remove all items from wishlist
 */
const clearWishlist = async (): Promise<void> => {
    try {
        await api.delete('/customer/wishlist/all');
    } catch (error: any) {
        console.error('[WishlistAPI] Error clearing wishlist:', error);
        throw new Error(error.response?.data?.message || 'Failed to clear wishlist');
    }
};

export const wishlistApi = {
    getWishlist,
    toggleWishlist,
    removeFromWishlist,
    moveToCart,
    clearWishlist,
};

