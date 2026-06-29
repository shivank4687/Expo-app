/**
 * Redux Slice — Offline Products
 *
 * Holds the in-memory list of all offline products so that components can
 * reactively display sync state without hitting AsyncStorage every render.
 *
 * AsyncStorage is the source of truth for persistence.
 * This slice is a read-through cache that is populated on app start
 * via the `loadOfflineProducts` thunk.
 *
 * Persisted via redux-persist (see store.ts whitelist).
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { getOfflineProductsBySupplier } from '@/services/offline/offline-storage';
import type { OfflineProduct } from '@/services/offline/offline-product.types';

interface OfflineProductsState {
    /** All offline products, keyed presence in AsyncStorage */
    products: OfflineProduct[];
    /** True while the sync queue is actively processing */
    isSyncing: boolean;
    /** ISO timestamp of the last completed sync run */
    lastSyncAt: string | null;
    /** Whether the initial load from AsyncStorage has completed */
    isLoaded: boolean;
}

const initialState: OfflineProductsState = {
    products: [],
    isSyncing: false,
    lastSyncAt: null,
    isLoaded: false,
};

/**
 * Load all offline products from AsyncStorage into Redux,
 * filtered to the given supplier. Call this after login.
 */
export const loadOfflineProducts = createAsyncThunk(
    'offlineProducts/load',
    async (supplierId: number) => {
        return getOfflineProductsBySupplier(supplierId);
    }
);

const offlineProductsSlice = createSlice({
    name: 'offlineProducts',
    initialState,
    reducers: {
        /**
         * Add or update a product in the in-memory list.
         * Matches by localId.
         */
        upsertOfflineProduct(state, action: PayloadAction<OfflineProduct>) {
            const idx = state.products.findIndex(
                (p) => p.localId === action.payload.localId
            );
            if (idx >= 0) {
                state.products[idx] = action.payload;
            } else {
                state.products.push(action.payload);
            }
        },

        /** Remove a product from the in-memory list by localId */
        removeOfflineProduct(state, action: PayloadAction<string>) {
            state.products = state.products.filter(
                (p) => p.localId !== action.payload
            );
        },

        /** Update the global sync progress flag */
        setSyncing(state, action: PayloadAction<boolean>) {
            state.isSyncing = action.payload;
            if (!action.payload) {
                state.lastSyncAt = new Date().toISOString();
            }
        },

        /**
         * Reset stuck sync state after an app crash or kill mid-sync.
         * - Forces isSyncing back to false
         * - Flips any per-product 'syncing' → 'pending' so they are retried
         *
         * Dispatch this once on app startup (useOfflineSync mount effect).
         */
        resetSyncing(state) {
            state.isSyncing = false;
            state.products = state.products.map((p) =>
                p.syncStatus === 'syncing' ? { ...p, syncStatus: 'pending' as const } : p
            );
        },

        /**
         * Clear the in-memory product list without touching AsyncStorage.
         * Dispatch on logout so a different supplier logging in starts clean.
         * The original supplier's drafts remain in AsyncStorage and are
         * re-loaded (filtered) when they log back in.
         */
        clearOfflineProducts(state) {
            state.products = [];
            state.isLoaded = false;
            state.isSyncing = false;
            state.lastSyncAt = null;
        },
    },
    extraReducers: (builder) => {
        builder.addCase(loadOfflineProducts.fulfilled, (state, action) => {
            state.products = action.payload;
            state.isLoaded = true;
        });
    },
});

export const {
    upsertOfflineProduct,
    removeOfflineProduct,
    setSyncing,
    resetSyncing,
    clearOfflineProducts,
} = offlineProductsSlice.actions;

export default offlineProductsSlice.reducer;
