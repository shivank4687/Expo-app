import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Product } from '@/features/product/types/product.types';

interface RecentlyViewedState {
    items: Product[];
}

const initialState: RecentlyViewedState = {
    items: [],
};

const MAX_ITEMS = 20;

const recentlyViewedSlice = createSlice({
    name: 'recentlyViewed',
    initialState,
    reducers: {
        addProduct: (state, action: PayloadAction<Product>) => {
            const product = action.payload;
            // Remove existing instance if any
            const filteredItems = state.items.filter(item => item.id !== product.id);
            // Add to the beginning
            state.items = [product, ...filteredItems].slice(0, MAX_ITEMS);
        },
        clearRecentlyViewed: (state) => {
            state.items = [];
        },
    },
});

export const { addProduct, clearRecentlyViewed } = recentlyViewedSlice.actions;
export default recentlyViewedSlice.reducer;
