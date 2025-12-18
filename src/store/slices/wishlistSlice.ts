/**
 * Wishlist Slice
 * Redux slice for managing wishlist state
 */

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { wishlistApi } from "@/services/api/wishlist.api";
import { WishlistItem } from "@/features/wishlist/types/wishlist.types";
import { logoutThunk } from "./authSlice";

interface WishlistState {
  items: WishlistItem[];
  isLoading: boolean;
  isRemoving: boolean;
  removingProductId: number | null;
  error: string | null;
}

const initialState: WishlistState = {
  items: [],
  isLoading: false,
  isRemoving: false,
  removingProductId: null,
  error: null,
};

/**
 * Async Thunks
 */

// Fetch wishlist
export const fetchWishlistThunk = createAsyncThunk(
  "wishlist/fetchWishlist",
  async (_, { rejectWithValue }) => {
    try {
      console.log("[wishlistSlice] Fetching wishlist...");
      const items = await wishlistApi.getWishlist();
      return items;
    } catch (error: any) {
      console.error("[wishlistSlice] Fetch wishlist error:", error);
      return rejectWithValue(error.message || "Failed to fetch wishlist");
    }
  }
);

// Toggle wishlist (add/remove)
export const toggleWishlistThunk = createAsyncThunk(
  "wishlist/toggleWishlist",
  async (productId: number, { rejectWithValue }) => {
    try {
      const response = await wishlistApi.toggleWishlist(productId);
      return { response, productId };
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update wishlist");
    }
  }
);

// Remove from wishlist
export const removeFromWishlistThunk = createAsyncThunk(
  "wishlist/removeFromWishlist",
  async (productId: number, { rejectWithValue }) => {
    try {
      const items = await wishlistApi.removeFromWishlist(productId);
      return { items, productId };
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to remove from wishlist");
    }
  }
);

// Move to cart
export const moveToCartThunk = createAsyncThunk(
  "wishlist/moveToCart",
  async (
    { productId, quantity = 1 }: { productId: number; quantity?: number },
    { rejectWithValue }
  ) => {
    try {
      console.log("[wishlistSlice] Moving to cart:", { productId, quantity });
      await wishlistApi.moveToCart(productId, quantity);
      console.log(
        "[wishlistSlice] Move successful, fetching updated wishlist..."
      );

      // Fetch updated wishlist after moving to cart
      const items = await wishlistApi.getWishlist();
      console.log("[wishlistSlice] Updated wishlist items:", items);
      return items;
    } catch (error: any) {
      console.error("[wishlistSlice] Move to cart error:", error);
      return rejectWithValue(error.message || "Failed to move to cart");
    }
  }
);

// Clear wishlist
export const clearWishlistThunk = createAsyncThunk(
  "wishlist/clearWishlist",
  async (_, { rejectWithValue }) => {
    try {
      await wishlistApi.clearWishlist();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to clear wishlist");
    }
  }
);

/**
 * Wishlist Slice
 */
const wishlistSlice = createSlice({
  name: "wishlist",
  initialState,
  reducers: {
    clearWishlistError: (state) => {
      state.error = null;
    },
    resetWishlist: (state) => {
      state.items = [];
      state.error = null;
      state.removingProductId = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch wishlist
    builder
      .addCase(fetchWishlistThunk.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchWishlistThunk.fulfilled, (state, action) => {
        console.log("[wishlistSlice] Setting items in state:", action.payload);
        state.isLoading = false;
        state.items = action.payload;
        console.log(
          "[wishlistSlice] State updated, items count:",
          state.items.length
        );
      })
      .addCase(fetchWishlistThunk.rejected, (state, action) => {
        console.error("[wishlistSlice] Fetch rejected:", action.payload);
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Toggle wishlist
    builder
      .addCase(toggleWishlistThunk.pending, (state) => {
        state.error = null;
      })
      .addCase(toggleWishlistThunk.fulfilled, (state, action) => {
        // Refresh wishlist by fetching again
        // The actual update will be handled by fetchWishlistThunk
      })
      .addCase(toggleWishlistThunk.rejected, (state, action) => {
        state.error = action.payload as string;
      });

    // Remove from wishlist
    builder
      .addCase(removeFromWishlistThunk.pending, (state, action) => {
        state.isRemoving = true;
        state.error = null;
        // Set removingProductId immediately to show loader on correct product
        state.removingProductId = action.meta.arg;
      })
      .addCase(removeFromWishlistThunk.fulfilled, (state, action) => {
        state.isRemoving = false;
        state.items = action.payload.items;
        state.removingProductId = null;
      })
      .addCase(removeFromWishlistThunk.rejected, (state, action) => {
        state.isRemoving = false;
        state.error = action.payload as string;
        state.removingProductId = null;
      });

    // Move to cart
    builder
      .addCase(moveToCartThunk.pending, (state) => {
        state.error = null;
      })
      .addCase(moveToCartThunk.fulfilled, (state, action) => {
        console.log(
          "[wishlistSlice] Move to cart fulfilled, updating items:",
          action.payload
        );
        state.items = action.payload;
        console.log(
          "[wishlistSlice] State updated, items count:",
          state.items.length
        );
      })
      .addCase(moveToCartThunk.rejected, (state, action) => {
        console.error("[wishlistSlice] Move to cart rejected:", action.payload);
        state.error = action.payload as string;
      });

    // Clear wishlist
    builder
      .addCase(clearWishlistThunk.pending, (state) => {
        state.error = null;
      })
      .addCase(clearWishlistThunk.fulfilled, (state) => {
        state.items = [];
      })
      .addCase(clearWishlistThunk.rejected, (state, action) => {
        state.error = action.payload as string;
      });

    // Reset wishlist on logout
    builder.addCase(logoutThunk.fulfilled, (state) => {
      state.items = [];
      state.error = null;
      state.removingProductId = null;
    });
  },
});

export const { clearWishlistError, resetWishlist } = wishlistSlice.actions;
export default wishlistSlice.reducer;
