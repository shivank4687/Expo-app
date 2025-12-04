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
import { logoutThunk } from './authSlice';
import { guestCartStorage } from '@/services/storage/guestCartStorage';

interface CartState {
    cart: Cart | null;
    isLoading: boolean;
    error: string | null;
    isAddingToCart: boolean;
    lastAddedProductId: number | null;
}

const initialState: CartState = {
    cart: null,
    isLoading: false,
    error: null,
    isAddingToCart: false,
    lastAddedProductId: null,
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
                // Fetch from API for authenticated users
                try {
                    const cart = await cartApi.getCart();
                    
                    // If API returns null (no cart or 401/404), fall back to guest cart
                    if (cart === null) {
                        console.log('API returned null cart, loading guest cart');
                        const guestCart = await guestCartStorage.getGuestCart();
                        return guestCart;
                    }
                    
                    return cart;
                } catch (apiError: any) {
                    console.log('API error, falling back to guest cart:', apiError.message);
                    // Fall back to guest cart on API error
                    const guestCart = await guestCartStorage.getGuestCart();
                    return guestCart;
                }
            } else {
                // Get from local storage for guest users
                console.log('Loading guest cart from storage');
                const guestCart = await guestCartStorage.getGuestCart();
                return guestCart;
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
    async (payload: AddToCartPayload & { product?: any }, { rejectWithValue, getState }) => {
        try {
            const state = getState() as any;
            const isAuthenticated = state.auth.isAuthenticated;

            if (isAuthenticated) {
                // Add via API for authenticated users
                const cart = await cartApi.addToCart(payload);
                return { cart, productId: payload.product_id };
            } else {
                // Add to guest cart (local storage)
                if (!payload.product) {
                    throw new Error('Product data required for guest cart');
                }
                const cart = await guestCartStorage.addItem(payload.product, payload.quantity || 1);
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
                // Update guest cart
                const itemId = Object.keys(payload.qty)[0];
                const quantity = payload.qty[parseInt(itemId)];
                const cart = await guestCartStorage.updateItem(parseInt(itemId), quantity);
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
                // Remove from guest cart
                const cart = await guestCartStorage.removeItem(cartItemId);
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
            const cart = await cartApi.moveToWishlist(cartItemId);
            return cart;
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to move item to wishlist');
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
            })
            .addCase(fetchCartThunk.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            });

        // Add to cart
        builder
            .addCase(addToCartThunk.pending, (state) => {
                state.isAddingToCart = true;
                state.error = null;
            })
            .addCase(addToCartThunk.fulfilled, (state, action) => {
                state.isAddingToCart = false;
                state.cart = action.payload.cart;
                state.lastAddedProductId = action.payload.productId;
            })
            .addCase(addToCartThunk.rejected, (state, action) => {
                state.isAddingToCart = false;
                state.error = action.payload as string;
            });

        // Update cart item
        builder
            .addCase(updateCartItemThunk.pending, (state) => {
                state.error = null;
            })
            .addCase(updateCartItemThunk.fulfilled, (state, action) => {
                state.cart = action.payload;
            })
            .addCase(updateCartItemThunk.rejected, (state, action) => {
                state.error = action.payload as string;
            });

        // Remove from cart
        builder
            .addCase(removeFromCartThunk.pending, (state) => {
                state.error = null;
            })
            .addCase(removeFromCartThunk.fulfilled, (state, action) => {
                state.cart = action.payload;
            })
            .addCase(removeFromCartThunk.rejected, (state, action) => {
                state.error = action.payload as string;
            });

        // Apply coupon
        builder
            .addCase(applyCouponThunk.pending, (state) => {
                state.error = null;
            })
            .addCase(applyCouponThunk.fulfilled, (state, action) => {
                state.cart = action.payload;
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
            })
            .addCase(removeCouponThunk.rejected, (state, action) => {
                state.error = action.payload as string;
            });

        // Move to wishlist
        builder
            .addCase(moveToWishlistThunk.pending, (state) => {
                state.error = null;
            })
            .addCase(moveToWishlistThunk.fulfilled, (state, action) => {
                state.cart = action.payload;
            })
            .addCase(moveToWishlistThunk.rejected, (state, action) => {
                state.error = action.payload as string;
            });

        // Reset cart on logout
        builder.addCase(logoutThunk.fulfilled, (state) => {
            state.cart = null;
            state.error = null;
            state.lastAddedProductId = null;
            // Clear guest cart from storage
            guestCartStorage.clearGuestCart();
        });
    },
});

export const { clearCartError, clearLastAddedProduct, resetCart } = cartSlice.actions;
export default cartSlice.reducer;

