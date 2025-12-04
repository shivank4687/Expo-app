/**
 * Guest Cart Storage
 * Manages cart for non-authenticated users using AsyncStorage
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Cart, CartItem } from '@/features/cart/types/cart.types';

const GUEST_CART_KEY = '@guest_cart';

export const guestCartStorage = {
    /**
     * Get guest cart from storage
     */
    async getGuestCart(): Promise<Cart | null> {
        try {
            const cartData = await AsyncStorage.getItem(GUEST_CART_KEY);
            if (cartData) {
                const cart = JSON.parse(cartData);
                
                // Validate cart structure - clear if corrupted
                if (!cart.items || !Array.isArray(cart.items)) {
                    console.warn('Invalid guest cart structure, clearing...');
                    await this.clearGuestCart();
                    return null;
                }
                
                // Check for invalid IDs (non-integers or invalid)
                const hasInvalidIds = cart.items.some((item: any) => {
                    const id = Number(item.id);
                    return !Number.isInteger(id) || id <= 0;
                });
                
                if (hasInvalidIds) {
                    console.warn('Guest cart has invalid IDs, clearing...');
                    await this.clearGuestCart();
                    return null;
                }
                
                return cart;
            }
            return null;
        } catch (error) {
            console.error('Error getting guest cart:', error);
            // Clear corrupted cart
            await this.clearGuestCart();
            return null;
        }
    },

    /**
     * Save guest cart to storage
     */
    async saveGuestCart(cart: Cart): Promise<void> {
        try {
            await AsyncStorage.setItem(GUEST_CART_KEY, JSON.stringify(cart));
        } catch (error) {
            console.error('Error saving guest cart:', error);
        }
    },

    /**
     * Add item to guest cart
     */
    async addItem(product: any, quantity: number = 1): Promise<Cart> {
        try {
            let cart = await this.getGuestCart();
            
            if (!cart) {
                // Create new guest cart
                cart = {
                    id: Date.now(), // Temporary ID for guest cart
                    is_guest: true,
                    items: [],
                    items_count: 0,
                    items_qty: 0,
                    sub_total: 0,
                    base_sub_total: 0,
                    grand_total: 0,
                    base_grand_total: 0,
                    discount_amount: 0,
                    base_discount_amount: 0,
                    tax_total: 0,
                    base_tax_total: 0,
                    formatted_sub_total: '$0.00',
                    formatted_grand_total: '$0.00',
                    formatted_discount_amount: '$0.00',
                    formatted_tax_total: '$0.00',
                    have_stockable_items: true,
                };
            }

            // Check if item already exists
            const existingItemIndex = cart.items.findIndex(
                item => item.product_id === product.id
            );

            if (existingItemIndex > -1) {
                // Update quantity
                cart.items[existingItemIndex].quantity += quantity;
                cart.items[existingItemIndex].total = 
                    cart.items[existingItemIndex].price * cart.items[existingItemIndex].quantity;
            } else {
                // Add new item - use product_id as base to ensure uniqueness
                const newItem: CartItem = {
                    id: product.id * 1000 + Date.now() % 1000, // Unique ID based on product
                    product_id: product.id,
                    quantity: quantity,
                    sku: product.sku || '',
                    type: product.type || 'simple',
                    name: product.name,
                    price: parseFloat(product.price) || 0,
                    base_price: parseFloat(product.price) || 0,
                    total: parseFloat(product.price) * quantity,
                    base_total: parseFloat(product.price) * quantity,
                    tax_percent: 0,
                    tax_amount: 0,
                    base_tax_amount: 0,
                    discount_percent: 0,
                    discount_amount: 0,
                    base_discount_amount: 0,
                    product: {
                        id: product.id,
                        name: product.name,
                        sku: product.sku || '',
                        thumbnail: product.thumbnail,
                        images: product.images,
                        price: parseFloat(product.price) || 0,
                        in_stock: product.in_stock,
                    },
                };
                cart.items.push(newItem);
            }

            // Recalculate totals
            this.recalculateTotals(cart);
            
            await this.saveGuestCart(cart);
            return cart;
        } catch (error) {
            console.error('Error adding item to guest cart:', error);
            throw error;
        }
    },

    /**
     * Update item quantity
     */
    async updateItem(itemId: number, quantity: number): Promise<Cart> {
        try {
            const cart = await this.getGuestCart();
            if (!cart) throw new Error('Cart not found');

            // Convert itemId to number to ensure comparison works
            const numericItemId = Number(itemId);
            
            console.log('Updating item:', {
                searchingFor: numericItemId,
                availableItems: cart.items.map(i => ({ id: i.id, type: typeof i.id, name: i.name }))
            });
            
            const item = cart.items.find(i => Number(i.id) === numericItemId);
            
            if (!item) {
                console.error('Item not found. ItemId:', itemId, 'Type:', typeof itemId, 'Available IDs:', cart.items.map(i => ({ id: i.id, type: typeof i.id })));
                throw new Error('Item not found');
            }

            item.quantity = quantity;
            item.total = item.price * quantity;
            item.base_total = item.base_price * quantity;

            this.recalculateTotals(cart);
            await this.saveGuestCart(cart);
            return cart;
        } catch (error) {
            console.error('Error updating guest cart item:', error);
            throw error;
        }
    },

    /**
     * Remove item from cart
     */
    async removeItem(itemId: number): Promise<Cart | null> {
        try {
            const cart = await this.getGuestCart();
            if (!cart) return null;

            // Convert itemId to number to ensure comparison works
            const numericItemId = Number(itemId);
            cart.items = cart.items.filter(item => Number(item.id) !== numericItemId);

            if (cart.items.length === 0) {
                await this.clearGuestCart();
                return null;
            }

            this.recalculateTotals(cart);
            await this.saveGuestCart(cart);
            return cart;
        } catch (error) {
            console.error('Error removing item from guest cart:', error);
            throw error;
        }
    },

    /**
     * Clear guest cart
     */
    async clearGuestCart(): Promise<void> {
        try {
            await AsyncStorage.removeItem(GUEST_CART_KEY);
        } catch (error) {
            console.error('Error clearing guest cart:', error);
        }
    },

    /**
     * Recalculate cart totals
     */
    recalculateTotals(cart: Cart): void {
        cart.sub_total = cart.items.reduce((sum, item) => sum + item.total, 0);
        cart.base_sub_total = cart.sub_total;
        cart.items_qty = cart.items.reduce((sum, item) => sum + item.quantity, 0);
        cart.items_count = cart.items.length;
        
        // For guest cart, no tax or discount
        cart.tax_total = 0;
        cart.discount_amount = 0;
        cart.grand_total = cart.sub_total;
        cart.base_grand_total = cart.grand_total;

        // Format prices
        cart.formatted_sub_total = `$${cart.sub_total.toFixed(2)}`;
        cart.formatted_grand_total = `$${cart.grand_total.toFixed(2)}`;
        cart.formatted_tax_total = `$${cart.tax_total.toFixed(2)}`;
        cart.formatted_discount_amount = `$${cart.discount_amount.toFixed(2)}`;
    },
};

