import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { supplierAuthApi, Supplier } from '@/services/api/supplierAuth.api';
import { secureStorage } from '@/services/storage/secureStorage';
import { STORAGE_KEYS } from '@/config/constants';
import { LoginRequest, OtpVerificationRequest, ResendOtpRequest } from '@/features/auth/types/auth.types';
import { authApi } from '@/services/api/auth.api';
import { setGlobalToken } from '@/services/api/client';
import { supplierPushNotificationService } from '@/services/notifications/supplier-push-notification.service';
import socketService from '@/services/socket.service';

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

            const response = (await supplierAuthApi.login(loginPayload)) as any;

            // Add check for 2FA OTP requirement
            if (response.requires_otp_verification) {
                return {
                    requiresOtp: true,
                    verificationToken: response.verification_token,
                    phone: response.phone,
                    type: response.type || 'login_2fa',
                };
            }

            // Store token and supplier data
            if (response.token) {
                await secureStorage.setItem(STORAGE_KEYS.SUPPLIER_AUTH_TOKEN, response.token);
            }
            if (response.data) {
                await secureStorage.setItem(STORAGE_KEYS.SUPPLIER_DATA, JSON.stringify(response.data));
            }

            // Set global token for API client
            setGlobalToken(response.token);

            // Register device token for supplier push notifications
            try {
                console.log('🔔 Registering supplier device token for push notifications...');
                await supplierPushNotificationService.registerToken();
            } catch (notificationError) {
                console.error('Failed to register push notification token (non-critical):', notificationError);
                // Don't fail login if notification registration fails
            }

            return {
                requiresOtp: false,
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
            // Unregister device token for supplier push notifications
            try {
                console.log('🔕 Unregistering supplier device token for push notifications...');
                await supplierPushNotificationService.unregisterToken();
            } catch (notificationError) {
                console.error('Failed to unregister push notification token (non-critical):', notificationError);
                // Don't fail logout if notification unregistration fails
            }

            await supplierAuthApi.logout();
            // Disconnect Socket.IO session
            socketService.disconnect();
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

export const sendSupplierPhoneOtpThunk = createAsyncThunk(
    'supplierAuth/sendPhoneOtp',
    async (data: { phone: string; phone_country_id: number; dial_code: string }, { rejectWithValue }) => {
        try {
            const response = await supplierAuthApi.sendPhoneOtp(data);
            return response;
        } catch (error: any) {
            return rejectWithValue(error?.response?.data?.message || 'Failed to send OTP');
        }
    }
);

export const verifySupplierPhoneOtpThunk = createAsyncThunk(
    'supplierAuth/verifyPhoneOtp',
    async (data: { verification_token: string; otp: string }, { rejectWithValue }) => {
        try {
            const response = await supplierAuthApi.verifyPhoneOtp(data);
            
            // Store updated supplier data
            if (response.data) {
                await secureStorage.setItem(STORAGE_KEYS.SUPPLIER_DATA, JSON.stringify(response.data));
            }
            
            return response;
        } catch (error: any) {
            return rejectWithValue(error?.response?.data?.message || 'OTP verification failed');
        }
    }
);


export const verifySupplierOtpThunk = createAsyncThunk(
    'supplierAuth/verifyOtp',
    async (data: OtpVerificationRequest, { rejectWithValue }) => {
        try {
            const response = await authApi.verifyOtp(data, 'supplier');
            
            // Handle nested response structure
            let supplier = response.user;
            let token = response.token;

            if (!supplier && (response as any).data) {
                if ((response as any).data.id || (response as any).data.email) {
                    supplier = (response as any).data;
                } else if ((response as any).data.user) {
                    supplier = (response as any).data.user;
                    token = (response as any).data.token || token;
                }
            }

            // Store in secure storage
            if (token && typeof token === 'string') {
                await secureStorage.setItem(STORAGE_KEYS.SUPPLIER_AUTH_TOKEN, token);
            }

            if (supplier) {
                await secureStorage.setItem(STORAGE_KEYS.SUPPLIER_DATA, JSON.stringify(supplier));
            }

            // Register device token for push notifications
            try {
                console.log('🔔 Registering supplier device token for push notifications...');
                await supplierPushNotificationService.registerToken();
            } catch (notificationError) {
                console.error('Failed to register push notification token (non-critical):', notificationError);
            }

            return {
                supplier,
                token,
                isApproved: (response as any).is_approved
            };
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'OTP verification failed');
        }
    }
);

export const resendSupplierOtpThunk = createAsyncThunk(
    'supplierAuth/resendOtp',
    async (data: ResendOtpRequest, { rejectWithValue }) => {
        try {
            const response = await authApi.resendOtp(data, 'supplier');
            return response;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to resend OTP');
        }
    }
);

export const updateSupplierSecurityThunk = createAsyncThunk(
    'supplierAuth/updateSecurity',
    async (data: { two_factor_enabled: boolean }, { rejectWithValue, getState }) => {
        try {
            const response = await supplierAuthApi.updateSecuritySettings(data);
            
            // Get current state to update storage manually
            const state = getState() as { supplierAuth: SupplierAuthState };
            const currentSupplier = state.supplierAuth.supplier;
            
            if (currentSupplier) {
                const updatedSupplier = { ...currentSupplier, two_factor_enabled: data.two_factor_enabled };
                await secureStorage.setItem(STORAGE_KEYS.SUPPLIER_DATA, JSON.stringify(updatedSupplier));
            }
            
            return { message: response.message, data };
        } catch (error: any) {
            console.error('Update security thunk error:', error);
            return rejectWithValue(error?.response?.data?.message || 'Failed to update security settings');
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
        updateSupplierEmail: (state, action: PayloadAction<string>) => {
            if (state.supplier) {
                state.supplier.email = action.payload;
            }
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
                state.error = null;

                if (!(action.payload as any).requiresOtp) {
                    state.supplier = action.payload.supplier;
                    state.token = action.payload.token;
                    state.isAuthenticated = true;
                    // Set global token for API client
                    setGlobalToken(action.payload.token);
                }
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

        // Verify Phone OTP (Update profile upon success)
        builder
            .addCase(verifySupplierPhoneOtpThunk.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(verifySupplierPhoneOtpThunk.fulfilled, (state, action) => {
                if (action.payload.data) {
                    state.supplier = action.payload.data;
                }
                state.isLoading = false;
                state.error = null;
            })
            .addCase(verifySupplierPhoneOtpThunk.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            });

        // Update Security
        builder
            .addCase(updateSupplierSecurityThunk.fulfilled, (state, action) => {
                if (state.supplier) {
                    state.supplier.two_factor_enabled = action.payload.data.two_factor_enabled;
                }
            });

        // Verify Supplier OTP (Registration/Login 2FA)
        builder
            .addCase(verifySupplierOtpThunk.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(verifySupplierOtpThunk.fulfilled, (state, action) => {
                state.isLoading = false;
                state.error = null;

                const { isApproved } = action.payload;

                // For login_2fa, isApproved won't be defined (it's already approved)
                // For registration, it will be defined
                if (isApproved !== undefined) {
                    // Registration flow: don't auto-authenticate yet
                } else {
                    // Login 2FA flow: auto-authenticate
                    state.supplier = action.payload.supplier as any;
                    state.token = action.payload.token || null;
                    state.isAuthenticated = true;
                    if (action.payload.token) {
                        setGlobalToken(action.payload.token);
                    }
                }
            })
            .addCase(verifySupplierOtpThunk.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            });

        // Resend Supplier OTP
        builder
            .addCase(resendSupplierOtpThunk.pending, (state) => {
                // state.isLoading = true;
            })
            .addCase(resendSupplierOtpThunk.fulfilled, (state) => {
                state.error = null;
            })
            .addCase(resendSupplierOtpThunk.rejected, (state, action) => {
                state.error = action.payload as string;
            });
    },
});

export const { clearError, resetSupplierAuth, updateSupplierEmail } = supplierAuthSlice.actions;
export default supplierAuthSlice.reducer;
