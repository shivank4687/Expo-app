import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { supplierAuthApi, Supplier } from '@/services/api/supplierAuth.api';
import { secureStorage } from '@/services/storage/secureStorage';
import { STORAGE_KEYS } from '@/config/constants';
import { LoginRequest } from '@/features/auth/types/auth.types';
import { setGlobalToken } from '@/services/api/client';
import { expoPushNotificationService } from '@/services/notifications/expo-push-notification.service';

interface SupplierAuthState {
    supplier: Supplier | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
}

const initialState: SupplierAuthState = {
    supplier: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
};

// Async Thunks
export const checkSupplierAuthThunk = createAsyncThunk(
    'supplierAuth/checkAuth',
    async (_, { rejectWithValue }) => {
        try {
            const token = await secureStorage.getItem(STORAGE_KEYS.SUPPLIER_AUTH_TOKEN);
            const supplierData = await secureStorage.getItem(STORAGE_KEYS.SUPPLIER_DATA);

            if (token && supplierData && supplierData !== 'undefined' && supplierData !== 'null') {
                const parsedSupplier = JSON.parse(supplierData);
                if (parsedSupplier && parsedSupplier.id) {
                    console.log('✅ Restored supplier from storage:', parsedSupplier.name);
                    // Set global token for API client
                    setGlobalToken(token);
                    return { supplier: parsedSupplier, token };
                }
            }
            return rejectWithValue('No auth data');
        } catch (error) {
            console.log('Check supplier auth error (non-critical):', error);
            return rejectWithValue('No auth data');
        }
    }
);

export const supplierLoginThunk = createAsyncThunk(
    'supplierAuth/login',
    async (credentials: LoginRequest, { rejectWithValue }) => {
        try {
            const loginPayload: any = {
                email_or_phone: credentials.email_or_phone,
                password: credentials.password,
                device_name: credentials.device_name || 'mobile_app',
            };

            if (credentials.phone_country_id) {
                loginPayload.phone_country_id = credentials.phone_country_id;
            }

            const response = await supplierAuthApi.login(loginPayload);

            // Store token and supplier data
            await secureStorage.setItem(STORAGE_KEYS.SUPPLIER_AUTH_TOKEN, response.token);
            await secureStorage.setItem(STORAGE_KEYS.SUPPLIER_DATA, JSON.stringify(response.data));

            // Set global token for API client
            setGlobalToken(response.token);

            // Register device token for push notifications
            try {
                console.log('🔔 Registering supplier device token for push notifications...');
                await expoPushNotificationService.registerToken();
            } catch (notificationError) {
                console.error('Failed to register push notification token (non-critical):', notificationError);
                // Don't fail login if notification registration fails
            }

            return {
                supplier: response.data,
                token: response.token,
            };
        } catch (error: any) {
            const errorMessage = error?.response?.data?.message || error?.message || 'Login failed';
            return rejectWithValue(errorMessage);
        }
    }
);

export const supplierLogoutThunk = createAsyncThunk(
    'supplierAuth/logout',
    async (_, { rejectWithValue }) => {
        try {
            // Unregister device token for push notifications
            try {
                console.log('🔕 Unregistering supplier device token for push notifications...');
                await expoPushNotificationService.unregisterToken();
            } catch (notificationError) {
                console.error('Failed to unregister push notification token (non-critical):', notificationError);
                // Don't fail logout if notification unregistration fails
            }

            await supplierAuthApi.logout();
        } catch (error) {
            console.error('Logout API error (non-critical):', error);
        } finally {
            // Always clear local storage regardless of API call result
            await secureStorage.removeItem(STORAGE_KEYS.SUPPLIER_AUTH_TOKEN);
            await secureStorage.removeItem(STORAGE_KEYS.SUPPLIER_DATA);
            setGlobalToken(null);
        }
    }
);

const supplierAuthSlice = createSlice({
    name: 'supplierAuth',
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
        resetSupplierAuth: (state) => {
            state.supplier = null;
            state.token = null;
            state.isAuthenticated = false;
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        // Check Auth
        builder
            .addCase(checkSupplierAuthThunk.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(checkSupplierAuthThunk.fulfilled, (state, action) => {
                state.isLoading = false;
                state.supplier = action.payload.supplier;
                state.token = action.payload.token;
                state.isAuthenticated = true;
                state.error = null;
            })
            .addCase(checkSupplierAuthThunk.rejected, (state) => {
                state.isLoading = false;
                state.supplier = null;
                state.token = null;
                state.isAuthenticated = false;
            });

        // Login
        builder
            .addCase(supplierLoginThunk.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(supplierLoginThunk.fulfilled, (state, action) => {
                state.isLoading = false;
                state.supplier = action.payload.supplier;
                state.token = action.payload.token;
                state.isAuthenticated = true;
                state.error = null;
            })
            .addCase(supplierLoginThunk.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
                state.supplier = null;
                state.token = null;
                state.isAuthenticated = false;
            });

        // Logout
        builder
            .addCase(supplierLogoutThunk.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(supplierLogoutThunk.fulfilled, (state) => {
                state.isLoading = false;
                state.supplier = null;
                state.token = null;
                state.isAuthenticated = false;
                state.error = null;
            })
            .addCase(supplierLogoutThunk.rejected, (state) => {
                state.isLoading = false;
                state.supplier = null;
                state.token = null;
                state.isAuthenticated = false;
            });
    },
});

export const { clearError, resetSupplierAuth } = supplierAuthSlice.actions;
export default supplierAuthSlice.reducer;
