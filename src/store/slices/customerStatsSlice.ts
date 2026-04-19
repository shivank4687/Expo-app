import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { ordersApi } from '@/services/api/orders.api';

interface CustomerStatsData {
    total_orders: number;
    total_spend: number;
    formatted_total_spend: string;
}

interface CustomerStatsState {
    data: CustomerStatsData | null;
    isLoading: boolean;
    error: string | null;
}

const initialState: CustomerStatsState = {
    data: null,
    isLoading: false,
    error: null,
};

// Async Thunk to fetch stats
export const fetchCustomerStatsThunk = createAsyncThunk(
    'customerStats/fetch',
    async (_, { rejectWithValue }) => {
        try {
            const response = await ordersApi.getCustomerStats();
            return response;
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to fetch customer stats');
        }
    }
);

const customerStatsSlice = createSlice({
    name: 'customerStats',
    initialState,
    reducers: {
        clearStats: (state) => {
            state.data = null;
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchCustomerStatsThunk.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchCustomerStatsThunk.fulfilled, (state, action) => {
                state.isLoading = false;
                state.data = action.payload;
                state.error = null;
            })
            .addCase(fetchCustomerStatsThunk.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            });
    },
});

export const { clearStats } = customerStatsSlice.actions;
export default customerStatsSlice.reducer;
