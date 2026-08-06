import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Category } from '@/services/api/categories.api';

interface RecentlyVisitedCategoriesState {
    items: Category[];
}

const initialState: RecentlyVisitedCategoriesState = {
    items: [],
};

const MAX_ITEMS = 15;

const recentlyVisitedCategoriesSlice = createSlice({
    name: 'recentlyVisitedCategories',
    initialState,
    reducers: {
        addCategory: (state, action: PayloadAction<Category>) => {
            const category = action.payload;
            // Remove existing instance if any
            const filteredItems = state.items.filter(item => item.id !== category.id);
            // Add to the beginning
            state.items = [category, ...filteredItems].slice(0, MAX_ITEMS);
        },
        clearRecentlyVisitedCategories: (state) => {
            state.items = [];
        },
    },
});

export const { addCategory, clearRecentlyVisitedCategories } = recentlyVisitedCategoriesSlice.actions;
export default recentlyVisitedCategoriesSlice.reducer;
