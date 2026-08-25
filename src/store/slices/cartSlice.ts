/**
 * Cart Slice
 * Redux slice for managing cart state
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { cartApi } from '@/services/api/cart.api';
import {
    Cart,
    AddToCartPayload,
    UpdateCartItemPayload,
    ApplyCouponPayload
} from '@/features/cart/types/cart.types';

interface CartState {
    cart: Cart | null;
    isLoading: boolean;
    error: string | null;
    isAddingToCart: boolean;
    lastAddedProductId: number | null;
    isRemovingFromCart: boolean;
    removingCartItemId: number | null;
    isMovingToWishlist: boolean;
    movingToWishlistItemId: number | null;
    needsRefresh: boolean;
    selectedCartBillingAddress: any | null;
    selectedCartShippingAddress: any | null;
    selectedCartSameAsBilling: boolean;
    checkoutShippingMethods: any | null;
    checkoutAddress: any | null;
}

const initialState: CartState = {
    cart: null,
    isLoading: false,
    error: null,
    isAddingToCart: false,
    lastAddedProductId: null,
    isRemovingFromCart: false,
    removingCartItemId: null,
    isMovingToWishlist: false,
    movingToWishlistItemId: null,
    needsRefresh: false,
    selectedCartBillingAddress: null,
    selectedCartShippingAddress: null,
    selectedCartSameAsBilling: true,
    checkoutShippingMethods: null,
    checkoutAddress: null,
};

/**
 * Async Thunks
 */

// Fetch cart
export const fetchCartThunk = createAsyncThunk(
    'cart/fetchCart',
    async (_, { rejectWithValue, getState }) => {
        try {
            const state = getState() as any;
            const isAuthenticated = state.auth.isAuthenticated;
            const hasToken = state.auth.token;

            console.log('Fetching cart - isAuthenticated:', isAuthenticated, 'hasToken:', !!hasToken);

            if (isAuthenticated && hasToken) {
                return await cartApi.getCart();
            } else {
                return await cartApi.guestGetCart();
            }
        } catch (error: any) {
            console.error('Failed to fetch any cart:', error);
            return rejectWithValue(error.message || 'Failed to fetch cart');
        }
    }
);

// Add to cart
export const addToCartThunk = createAsyncThunk(
    'cart/addToCart',
    async (payload: AddToCartPayload & { product?: any }, { rejectWithValue, getState, dispatch }) => {
        try {
            const state = getState() as any;
            const isAuthenticated = state.auth.isAuthenticated;

            if (isAuthenticated) {
                //const cart = await cartApi.addToCart(payload)
                const cart = await cartApi.addToCartMini(payload);
                dispatch(fetchCartThunk());
                return { cart, productId: payload.product_id };
            } else {
                //const cart = await cartApi.guestAddToCart(payload)
                const cart = await cartApi.guestAddToCartMini(payload);
                dispatch(fetchCartThunk());
                return { cart, productId: payload.product_id };
            }
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to add item to cart');
        }
    }
);

// Update cart item
export const updateCartItemThunk = createAsyncThunk(
    'cart/updateCartItem',
    async (payload: UpdateCartItemPayload, { rejectWithValue, getState }) => {
        try {
            const state = getState() as any;
            const isAuthenticated = state.auth.isAuthenticated;

            if (isAuthenticated) {
                const cart = await cartApi.updateCartItem(payload);
                return cart;
            } else {
                const cart = await cartApi.guestUpdateCart(payload.qty);
                return cart;
            }
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to update cart');
        }
    }
);

// Remove from cart
export const removeFromCartThunk = createAsyncThunk(
    'cart/removeFromCart',
    async (cartItemId: number, { rejectWithValue, getState }) => {
        try {
            const state = getState() as any;
            const isAuthenticated = state.auth.isAuthenticated;

            if (isAuthenticated) {
                const cart = await cartApi.removeFromCart(cartItemId);
                return cart;
            } else {
                const cart = await cartApi.guestRemoveItem(cartItemId);
                return cart;
            }
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to remove item from cart');
        }
    }
);

// Apply coupon
export const applyCouponThunk = createAsyncThunk(
    'cart/applyCoupon',
    async (payload: ApplyCouponPayload, { rejectWithValue }) => {
        try {
            const cart = await cartApi.applyCoupon(payload);
            console.log('cart', cart)
            return cart;
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to apply coupon');
        }
    }
);

// Remove coupon
export const removeCouponThunk = createAsyncThunk(
    'cart/removeCoupon',
    async (_, { rejectWithValue }) => {
        try {
            const cart = await cartApi.removeCoupon();
            return cart;
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to remove coupon');
        }
    }
);

// Move to wishlist
export const moveToWishlistThunk = createAsyncThunk(
    'cart/moveToWishlist',
    async (cartItemId: number, { rejectWithValue }) => {
        try {
            console.log('[cartSlice] Moving item to wishlist:', cartItemId);
            const cart = await cartApi.moveToWishlist(cartItemId);
            console.log('[cartSlice] Updated cart after move:', cart);
            return cart;
        } catch (error: any) {
            console.error('[cartSlice] Move to wishlist error:', error);
            return rejectWithValue(error.message || 'Failed to move item to wishlist');
        }
    }
);

// Remove selected items from cart
export const removeSelectedFromCartThunk = createAsyncThunk(
    'cart/removeSelected',
    async (cartItemIds: number[], { rejectWithValue, getState }) => {
        try {
            const state = getState() as any;
            const isAuthenticated = state.auth.isAuthenticated;

            if (isAuthenticated) {
                const cart = await cartApi.removeSelected(cartItemIds);
                return cart;
            } else {
                // Remove selected items from guest cart sequentially
                let cart = null;
                for (const itemId of cartItemIds) {
                    cart = await cartApi.guestRemoveItem(itemId);
                }
                return cart;
            }
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to remove selected items');
        }
    }
);

// Move selected items to wishlist
export const moveSelectedToWishlistThunk = createAsyncThunk(
    'cart/moveSelectedToWishlist',
    async (cartItemIds: number[], { rejectWithValue }) => {
        try {
            const cart = await cartApi.moveToWishlistBulk(cartItemIds);
            return cart;
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to move selected items to wishlist');
        }
    }
);

/**
 * Cart Slice
 */
const cartSlice = createSlice({
    name: 'cart',
    initialState,
    reducers: {
        clearCartError: (state) => {
            state.error = null;
        },
        clearLastAddedProduct: (state) => {
            state.lastAddedProductId = null;
        },
        resetCart: (state) => {
            state.cart = null;
            state.error = null;
            state.lastAddedProductId = null;
            state.needsRefresh = false;
            state.selectedCartBillingAddress = null;
            state.selectedCartShippingAddress = null;
            state.selectedCartSameAsBilling = true;
            state.checkoutShippingMethods = null;
            state.checkoutAddress = null;
        },
        setSelectedCartAddresses: (state, action: PayloadAction<{ billingAddress: any | null, shippingAddress: any | null, sameAsBilling: boolean }>) => {
            state.selectedCartBillingAddress = action.payload.billingAddress;
            state.selectedCartShippingAddress = action.payload.shippingAddress;
            state.selectedCartSameAsBilling = action.payload.sameAsBilling;
        },
        setCheckoutShippingData: (state, action: PayloadAction<{ shippingMethods: any | null, address: any | null }>) => {
            state.checkoutShippingMethods = action.payload.shippingMethods;
            state.checkoutAddress = action.payload.address;
        },
    },
    extraReducers: (builder) => {
        // Fetch cart
        builder
            .addCase(fetchCartThunk.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchCartThunk.fulfilled, (state, action) => {
                state.isLoading = false;
                state.cart = action.payload;
                state.needsRefresh = false;
            })
            .addCase(fetchCartThunk.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            });

        // Add to cart
        builder
            .addCase(addToCartThunk.pending, (state, action) => {
                state.isAddingToCart = true;
                state.error = null;
                // Set lastAddedProductId immediately when pending to show loader on correct product
                state.lastAddedProductId = action.meta.arg.product_id;
            })
            .addCase(addToCartThunk.fulfilled, (state, action) => {
                state.isAddingToCart = false;
                // Merge mini-cart attributes if items list is not present
                if (action.payload.cart && !('items' in action.payload.cart)) {
                    if (state.cart) {
                        state.cart = {
                            ...state.cart,
                            id: action.payload.cart.id,
                            items_count: action.payload.cart.items_count,
                            items_qty: action.payload.cart.items_qty,
                        };
                    } else {
                        state.cart = {
                            id: action.payload.cart.id,
                            items_count: action.payload.cart.items_count,
                            items_qty: action.payload.cart.items_qty,
                            items: [],
                        } as any;
                    }
                } else {
                    state.cart = action.payload.cart;
                }
                state.lastAddedProductId = action.payload.productId;
                state.needsRefresh = true;
            })
            .addCase(addToCartThunk.rejected, (state, action) => {
                state.isAddingToCart = false;
                state.error = action.payload as string;
                // Clear lastAddedProductId on error
                state.lastAddedProductId = null;
            });

        // Update cart item
        builder
            .addCase(updateCartItemThunk.pending, (state) => {
                state.error = null;
            })
            .addCase(updateCartItemThunk.fulfilled, (state, action) => {
                state.cart = action.payload;
                state.needsRefresh = false;
            })
            .addCase(updateCartItemThunk.rejected, (state, action) => {
                state.error = action.payload as string;
            });

        // Remove from cart
        builder
            .addCase(removeFromCartThunk.pending, (state, action) => {
                state.isRemovingFromCart = true;
                state.removingCartItemId = action.meta.arg;
                state.error = null;
            })
            .addCase(removeFromCartThunk.fulfilled, (state, action) => {
                state.isRemovingFromCart = false;
                state.removingCartItemId = null;
                state.cart = action.payload;
                state.needsRefresh = false;
            })
            .addCase(removeFromCartThunk.rejected, (state, action) => {
                state.isRemovingFromCart = false;
                state.removingCartItemId = null;
                state.error = action.payload as string;
            });

        // Apply coupon
        builder
            .addCase(applyCouponThunk.pending, (state) => {
                state.error = null;
            })
            .addCase(applyCouponThunk.fulfilled, (state, action) => {
                state.cart = action.payload;
                state.needsRefresh = false;
            })
            .addCase(applyCouponThunk.rejected, (state, action) => {
                state.error = action.payload as string;
            });

        // Remove coupon
        builder
            .addCase(removeCouponThunk.pending, (state) => {
                state.error = null;
            })
            .addCase(removeCouponThunk.fulfilled, (state, action) => {
                state.cart = action.payload;
                state.needsRefresh = false;
            })
            .addCase(removeCouponThunk.rejected, (state, action) => {
                state.error = action.payload as string;
            });

        // Move to wishlist
        builder
            .addCase(moveToWishlistThunk.pending, (state, action) => {
                state.isMovingToWishlist = true;
                state.movingToWishlistItemId = action.meta.arg;
                state.error = null;
            })
            .addCase(moveToWishlistThunk.fulfilled, (state, action) => {
                state.isMovingToWishlist = false;
                state.movingToWishlistItemId = null;
                // Update cart with the payload (can be null if cart is now empty)
                // Null indicates empty cart after moving last item to wishlist
                state.cart = action.payload;
                state.needsRefresh = false;
            })
            .addCase(moveToWishlistThunk.rejected, (state, action) => {
                state.isMovingToWishlist = false;
                state.movingToWishlistItemId = null;
                state.error = action.payload as string;
            });

        // Remove selected items
        builder
            .addCase(removeSelectedFromCartThunk.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(removeSelectedFromCartThunk.fulfilled, (state, action) => {
                state.isLoading = false;
                state.cart = action.payload;
                state.needsRefresh = false;
            })
            .addCase(removeSelectedFromCartThunk.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            });

        // Move selected to wishlist
        builder
            .addCase(moveSelectedToWishlistThunk.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(moveSelectedToWishlistThunk.fulfilled, (state, action) => {
                state.isLoading = false;
                state.cart = action.payload;
                state.needsRefresh = false;
            })
            .addCase(moveSelectedToWishlistThunk.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            });
        // Reset cart on logout
        builder.addCase('auth/logout/fulfilled', (state) => {
            state.cart = null;
            state.error = null;
            state.lastAddedProductId = null;
            state.needsRefresh = false;
            state.selectedCartBillingAddress = null;
            state.selectedCartShippingAddress = null;
            state.selectedCartSameAsBilling = true;
            state.checkoutShippingMethods = null;
            state.checkoutAddress = null;

            // Clear and regenerate guest cart token for next guest session
            try {
                const { guestCartToken } = require('@/services/storage/guestCartToken');
                guestCartToken.clear().then(() => guestCartToken.getOrCreate());
            } catch (err) {
                console.error('Error handling guest cart token on logout:', err);
            }
        });
    },
});

export const { clearCartError, clearLastAddedProduct, resetCart, setSelectedCartAddresses, setCheckoutShippingData } = cartSlice.actions;
export default cartSlice.reducer;

