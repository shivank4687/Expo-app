import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { categoriesApi, Category } from '@/services/api/categories.api';

interface CategoryState {
    categories: Category[];
    isLoading: boolean;
    error: string | null;
    lastFetchedLocale: string | null; // Track which locale was fetched
    lastFetchedAt: number | null; // TTL cache timestamp
}

const initialState: CategoryState = {
    categories: [],
    isLoading: false,
    error: null,
    lastFetchedLocale: null,
    lastFetchedAt: null,
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
            
            const isSameLocale = state.category.lastFetchedLocale === locale;
            const hasCategories = state.category.categories.length > 0;
            const lastFetchedAt = state.category.lastFetchedAt;
            // 24 hours TTL
            const isCacheValid = lastFetchedAt && (Date.now() - lastFetchedAt < 24 * 60 * 60 * 1000);
            
            // Skip if already loaded for this locale and cache is valid (unless force refresh)
            if (!forceRefresh && isSameLocale && hasCategories && isCacheValid) {
                console.log('[Category Redux] Using cached categories for locale:', locale);
                return { categories: state.category.categories, locale, timestamp: lastFetchedAt };
            }

            console.log('[Category Redux] Fetching categories for locale:', locale, forceRefresh ? '(force refresh)' : '');
            const response = await categoriesApi.getCategories();
            const categories = response.data;
            return { categories, locale, timestamp: Date.now() };
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
                if (action.payload.timestamp) {
                    state.lastFetchedAt = action.payload.timestamp;
                }
            })
            .addCase(fetchCategories.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            });
    },
});

export const { clearCategories } = categorySlice.actions;
export default categorySlice.reducer;

