import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { coreApi, Locale, Currency, Channel } from '@/services/api/core.api';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
const STORAGE_KEYS = {
    SELECTED_LOCALE: 'selected_locale',
    SELECTED_CURRENCY: 'selected_currency',
    SELECTED_CHANNEL: 'selected_channel',
};

// State interface
interface CoreState {
    locales: Locale[];
    currencies: Currency[];
    channels: Channel[];
    selectedLocale: Locale | null;
    selectedCurrency: Currency | null;
    selectedChannel: Channel | null;
    isLoading: boolean;
    error: string | null;
}

// Initial state
const initialState: CoreState = {
    locales: [],
    currencies: [],
    channels: [],
    selectedLocale: null,
    selectedCurrency: null,
    selectedChannel: null,
    isLoading: false,
    error: null,
};

// Async thunks
export const fetchCoreConfig = createAsyncThunk(
    'core/fetchConfig',
    async (_, { rejectWithValue }) => {
        try {
            const config = await coreApi.getCoreConfig();
            
            // Load saved preferences from storage
            const savedLocaleCode = await AsyncStorage.getItem(STORAGE_KEYS.SELECTED_LOCALE);
            const savedCurrencyCode = await AsyncStorage.getItem(STORAGE_KEYS.SELECTED_CURRENCY);
            
            // Find saved locale or use default
            const selectedLocale = savedLocaleCode
                ? config.locales.find(l => l.code === savedLocaleCode) || config.defaultLocale
                : config.defaultLocale;
            
            // Find saved currency or use default
            const selectedCurrency = savedCurrencyCode
                ? config.currencies.find(c => c.code === savedCurrencyCode) || config.defaultCurrency
                : config.defaultCurrency;

            return {
                ...config,
                selectedLocale: selectedLocale || null,
                selectedCurrency: selectedCurrency || null,
                selectedChannel: config.defaultChannel || null,
            };
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to fetch core configuration');
        }
    }
);

export const setLocale = createAsyncThunk(
    'core/setLocale',
    async (locale: Locale, { rejectWithValue }) => {
        try {
            await AsyncStorage.setItem(STORAGE_KEYS.SELECTED_LOCALE, locale.code);
            return locale;
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to save locale');
        }
    }
);

export const setCurrency = createAsyncThunk(
    'core/setCurrency',
    async (currency: Currency, { rejectWithValue }) => {
        try {
            await AsyncStorage.setItem(STORAGE_KEYS.SELECTED_CURRENCY, currency.code);
            return currency;
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to save currency');
        }
    }
);

export const setChannel = createAsyncThunk(
    'core/setChannel',
    async (channel: Channel, { rejectWithValue }) => {
        try {
            await AsyncStorage.setItem(STORAGE_KEYS.SELECTED_CHANNEL, channel.code);
            return channel;
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to save channel');
        }
    }
);

// Slice
const coreSlice = createSlice({
    name: 'core',
    initialState,
    reducers: {
        resetCoreState: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        // Fetch core config
        builder
            .addCase(fetchCoreConfig.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchCoreConfig.fulfilled, (state, action) => {
                state.isLoading = false;
                state.locales = action.payload.locales;
                state.currencies = action.payload.currencies;
                state.channels = action.payload.channels;
                state.selectedLocale = action.payload.selectedLocale;
                state.selectedCurrency = action.payload.selectedCurrency;
                state.selectedChannel = action.payload.selectedChannel;
            })
            .addCase(fetchCoreConfig.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            });

        // Set locale
        builder
            .addCase(setLocale.fulfilled, (state, action) => {
                state.selectedLocale = action.payload;
            })
            .addCase(setLocale.rejected, (state, action) => {
                state.error = action.payload as string;
            });

        // Set currency
        builder
            .addCase(setCurrency.fulfilled, (state, action) => {
                state.selectedCurrency = action.payload;
            })
            .addCase(setCurrency.rejected, (state, action) => {
                state.error = action.payload as string;
            });

        // Set channel
        builder
            .addCase(setChannel.fulfilled, (state, action) => {
                state.selectedChannel = action.payload;
            })
            .addCase(setChannel.rejected, (state, action) => {
                state.error = action.payload as string;
            });
    },
});

export const { resetCoreState } = coreSlice.actions;
export default coreSlice.reducer;

