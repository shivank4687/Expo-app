import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { categoriesApi, Category } from '@/services/api/categories.api';

interface CategoryState {
    categories: Category[];
    isLoading: boolean;
    error: string | null;
    lastFetchedLocale: string | null; // Track which locale was fetched
}

const initialState: CategoryState = {
    categories: [],
    isLoading: false,
    error: null,
    lastFetchedLocale: null,
};

/**
 * Fetch categories from API
 * Only fetches if locale has changed or categories are empty
 
 */
export const fetchCategories = createAsyncThunk(
    'category/fetchCategories',
    async ({ locale, forceRefresh = false }: { locale: string; forceRefresh?: boolean }, { getState, rejectWithValue }) => {
        try {
            const state = getState() as { category: CategoryState };
            
           
            
            // Skip if already loaded for this locale (unless force refresh)
            if (!forceRefresh && state.category.lastFetchedLocale === locale && state.category.categories.length > 0) {
                console.log('[Category Redux] Using cached categories for locale:', locale);
                return { categories: state.category.categories, locale };
            }

            console.log('[Category Redux] Fetching categories for locale:', locale, forceRefresh ? '(force refresh)' : '');
            const response = await categoriesApi.getCategories();
            const categories = response.data;
            return { categories, locale };
        } catch (error: any) {
            console.error('[Category Redux] Error fetching categories:', error);
            return rejectWithValue(error.message || 'Failed to fetch categories');
        }
    }
);

/**
 * Refresh categories - always fetches fresh data
 */
export const refreshCategories = createAsyncThunk(
    'category/refreshCategories',
    async (locale: string, { dispatch }) => {
        return dispatch(fetchCategories({ locale, forceRefresh: true }));
    }
);

const categorySlice = createSlice({
    name: 'category',
    initialState,
    reducers: {
        clearCategories: (state) => {
            state.categories = [];
            state.lastFetchedLocale = null;
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchCategories.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchCategories.fulfilled, (state, action) => {
                state.isLoading = false;
                state.categories = action.payload.categories;
                state.lastFetchedLocale = action.payload.locale;
            })
            .addCase(fetchCategories.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            });
    },
});

export const { clearCategories } = categorySlice.actions;
export default categorySlice.reducer;

