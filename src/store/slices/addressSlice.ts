import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { Address } from '@/features/address/types/address.types';
import { addressApi } from '@/services/api/address.api';
import { logoutThunk } from './authSlice';

interface AddressState {
    addresses: Address[];
    isLoading: boolean;
    isLoaded: boolean;
    error: string | null;
}

const initialState: AddressState = {
    addresses: [],
    isLoading: false,
    isLoaded: false,
    error: null,
};

export const fetchAddressesThunk = createAsyncThunk(
    'address/fetchAddresses',
    async (force: boolean | undefined, { getState, rejectWithValue }) => {
        const state = getState() as any;
        if (!force && state.address?.isLoaded) {
            return state.address.addresses;
        }
        try {
            return await addressApi.getAddresses();
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to fetch addresses');
        }
    }
);

const addressSlice = createSlice({
    name: 'address',
    initialState,
    reducers: {
        clearAddresses(state) {
            state.addresses = [];
            state.isLoaded = false;
            state.error = null;
            state.isLoading = false;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchAddressesThunk.pending, (state) => {
                state.isLoading = !state.isLoaded; // only show loading spinner first time
            })
            .addCase(fetchAddressesThunk.fulfilled, (state, action) => {
                state.addresses = action.payload;
                state.isLoaded = true;
                state.isLoading = false;
            })
            .addCase(fetchAddressesThunk.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })
            .addCase(logoutThunk.fulfilled, (state) => {
                state.addresses = [];
                state.isLoaded = false;
                state.error = null;
                state.isLoading = false;
            });
    },
});

export const { clearAddresses } = addressSlice.actions;
export default addressSlice.reducer;
