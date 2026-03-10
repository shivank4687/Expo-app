import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { coreApi, Locale, Currency, Channel, Country } from '@/services/api/core.api';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
const STORAGE_KEYS = {
    SELECTED_LOCALE: 'selected_locale',
    SELECTED_CURRENCY: 'selected_currency',
    SELECTED_CHANNEL: 'selected_channel',
    LAST_SELECTED_COUNTRY: 'last_selected_country',
};

// State interface
interface CoreState {
    locales: Locale[];
    currencies: Currency[];
    channels: Channel[];
    countries: Country[];
    selectedLocale: Locale | null;
    selectedCurrency: Currency | null;
    selectedChannel: Channel | null;
    lastSelectedCountry: any | null; // Using any for now to avoid circular or complex imports if Country isn't fully defined here, but better to use the type if possible. Wait, Country is imported.
    isLoading: boolean;
    isLoadingCountries: boolean;
    error: string | null;
}

// Initial state
const initialState: CoreState = {
    locales: [],
    currencies: [],
    channels: [],
    countries: [],
    selectedLocale: null,
    selectedCurrency: null,
    selectedChannel: null,
    lastSelectedCountry: null,
    isLoading: false,
    isLoadingCountries: false,
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

            // Find saved locale or use default from channel
            const selectedLocale = savedLocaleCode
                ? config.locales.find(l => l.code === savedLocaleCode) || config.defaultLocale
                : config.defaultLocale;

            // Find saved currency or use default from channel
            const selectedCurrency = savedCurrencyCode
                ? config.currencies.find(c => c.code === savedCurrencyCode) || config.defaultCurrency
                : config.defaultCurrency;

            // Save defaults to storage if nothing was saved before
            if (!savedLocaleCode && selectedLocale) {
                await AsyncStorage.setItem(STORAGE_KEYS.SELECTED_LOCALE, selectedLocale.code);
                console.log('Saved default locale to storage:', selectedLocale.code);
            }

            if (!savedCurrencyCode && selectedCurrency) {
                await AsyncStorage.setItem(STORAGE_KEYS.SELECTED_CURRENCY, selectedCurrency.code);
                console.log('Saved default currency to storage:', selectedCurrency.code);
            }

            // Load last selected country
            const savedCountryJson = await AsyncStorage.getItem(STORAGE_KEYS.LAST_SELECTED_COUNTRY);
            const lastSelectedCountry = savedCountryJson ? JSON.parse(savedCountryJson) : null;

            return {
                ...config,
                selectedLocale: selectedLocale || null,
                selectedCurrency: selectedCurrency || null,
                selectedChannel: config.defaultChannel || null,
                lastSelectedCountry,
            };
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to fetch core configuration');
        }
    }
);

export const fetchCountriesThunk = createAsyncThunk(
    'core/fetchCountries',
    async (_, { getState, rejectWithValue }) => {
        try {
            const state = getState() as { core: CoreState };
            return await coreApi.getCountries();
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to fetch countries');
        }
    },
    {
        // Cancel execution if we already have the countries
        condition: (_, { getState }) => {
            const state = getState() as { core: CoreState };

            // Only fetch if the countries array is empty. 
            // We intentionally do NOT check `state.core.isLoadingCountries` here
            // because if the app restarted while it was loading previously, that 
            // state might be incorrectly stuck as `true` in local storage.
            if (state.core.countries && state.core.countries.length > 0) {
                return false;
            }
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

export const setLastSelectedCountry = createAsyncThunk(
    'core/setLastSelectedCountry',
    async (country: any, { rejectWithValue }) => {
        try {
            await AsyncStorage.setItem(STORAGE_KEYS.LAST_SELECTED_COUNTRY, JSON.stringify(country));
            return country;
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to save country');
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
                state.lastSelectedCountry = action.payload.lastSelectedCountry;
            })
            .addCase(fetchCoreConfig.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            });

        // Fetch countries
        builder
            .addCase(fetchCountriesThunk.pending, (state) => {
                console.log('🔄 coreSlice: fetchCountriesThunk pending');
                state.isLoadingCountries = true;
            })
            .addCase(fetchCountriesThunk.fulfilled, (state, action) => {
                console.log(`✅ coreSlice: fetchCountriesThunk fulfilled, received ${action.payload?.length || 0} countries`);
                state.isLoadingCountries = false;
                state.countries = action.payload;
            })
            .addCase(fetchCountriesThunk.rejected, (state, action) => {
                console.error(`❌ coreSlice: fetchCountriesThunk rejected:`, action.payload);
                state.isLoadingCountries = false;
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

        // Set last selected country
        builder
            .addCase(setLastSelectedCountry.fulfilled, (state, action) => {
                state.lastSelectedCountry = action.payload;
            })
            .addCase(setLastSelectedCountry.rejected, (state, action) => {
                state.error = action.payload as string;
            });
    },
});

export const { resetCoreState } = coreSlice.actions;
export default coreSlice.reducer;

