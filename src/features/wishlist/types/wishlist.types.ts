import { Product } from '@/features/product/types/product.types';

/**
 * Wishlist Item Type
 * Represents a single item in the customer's wishlist
 */
export interface WishlistItem {
    id: number;
    product: Product;
    created_at?: string;
    updated_at?: string;
}

/**
 * Wishlist Response Type
 * API response structure for wishlist operations
 */
export interface WishlistResponse {
    data: WishlistItem | WishlistItem[];
    message?: string;
}

/**
 * Add/Remove Wishlist Payload
 */
export interface WishlistPayload {
    product_id: number;
    additional?: any;
}

