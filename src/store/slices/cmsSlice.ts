import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { cmsApi, CMSPage } from '@/services/api/cms.api';

interface CMSState {
    pages: CMSPage[];
    isLoading: boolean;
    error: string | null;
    lastFetchedLocale: string | null;
}

const initialState: CMSState = {
    pages: [],
    isLoading: false,
    error: null,
    lastFetchedLocale: null,
};

/**
 * Fetch CMS pages from API
 */
export const fetchCMSPages = createAsyncThunk(
    'cms/fetchPages',
    async (params: { locale: string }, { rejectWithValue }) => {
        try {
            const response = await cmsApi.getPages();
            return { pages: response.data, locale: params.locale };
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to fetch CMS pages');
        }
    }
);

const cmsSlice = createSlice({
    name: 'cms',
    initialState,
    reducers: {
        clearCMSPages: (state) => {
            state.pages = [];
            state.error = null;
            state.lastFetchedLocale = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // Fetch CMS pages
            .addCase(fetchCMSPages.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchCMSPages.fulfilled, (state, action: PayloadAction<{ pages: CMSPage[]; locale: string }>) => {
                state.isLoading = false;
                state.pages = action.payload.pages;
                state.lastFetchedLocale = action.payload.locale;
                state.error = null;
            })
            .addCase(fetchCMSPages.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            });
    },
});

export const { clearCMSPages } = cmsSlice.actions;
export default cmsSlice.reducer;

