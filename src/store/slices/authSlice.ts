import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { authApi } from '@/services/api/auth.api';
import { secureStorage } from '@/services/storage/secureStorage';
import { STORAGE_KEYS } from '@/config/constants';
import { GoogleSignin } from '@/services/googleAuth';
import {
    User,
    LoginRequest,
    SignupRequest,
    AuthResponse,
    UpdateProfileRequest,
    SignupResponse,
    OtpVerificationRequest,
    ResendOtpRequest,
} from '@/features/auth/types/auth.types';
import { resetCart, fetchCartThunk } from './cartSlice';
import { setGlobalToken } from '@/services/api/client';
import { expoPushNotificationService } from '@/services/notifications/expo-push-notification.service';
import socketService from '@/services/socket.service';

interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
    verificationToken: string | null;
    pendingRegistration: SignupRequest | null;
    selectedUserType: 'customer' | 'supplier';
}

const initialState: AuthState = {
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
    verificationToken: null,
    pendingRegistration: null,
    selectedUserType: 'customer',
};

// Async Thunks
export const checkAuthThunk = createAsyncThunk(
    'auth/checkAuth',
    async (_, { rejectWithValue }) => {
        try {
            console.log('Checking auth...');
            const token = await secureStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
            const userData = await secureStorage.getItem(STORAGE_KEYS.USER_DATA);
            const expiresAtStr = await secureStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRES_AT);
            const expiresAt = expiresAtStr ? Number(expiresAtStr) : null;

            if (token && userData && userData !== 'undefined' && userData !== 'null') {
                const parsedUser = JSON.parse(userData);
                if (parsedUser && parsedUser.id) {
                    console.log('✅ Restored user from storage:', parsedUser.name);
                    // Set global token for API client
                    setGlobalToken(token, expiresAt);
                    return { user: parsedUser, token };
                }
            }
            // Not an error, just no auth data
            return rejectWithValue('No auth data');
        } catch (error) {
            console.log('Check auth error (non-critical):', error);
            // Silently fail - this is expected on first launch
            return rejectWithValue('No auth data');
        }
    }
);

export const loginThunk = createAsyncThunk(
    'auth/login',
    async (credentials: LoginRequest, { rejectWithValue, dispatch }) => {
        try {
            // Ensure email_or_phone is sent to the API
            const loginPayload: any = {
                email_or_phone: credentials.email_or_phone,
                password: credentials.password,
                device_name: credentials.device_name || 'mobile_app',
            };

            // Add phone_country_id if provided
            if (credentials.phone_country_id) {
                loginPayload.phone_country_id = credentials.phone_country_id;
            }
            const response: AuthResponse = await authApi.login(loginPayload);
            console.log('Login Response:', JSON.stringify(response, null, 2));

            // Handle nested response structure
            let user = response.user;
            let token = response.token;

            // Bagisto API structure: { data: User, token: string, message: string }
            if (!user && (response as any).data) {
                // Check if 'data' is the user object itself (has id/email)
                if ((response as any).data.id || (response as any).data.email) {
                    user = (response as any).data;
                }
                // Or if it's nested in data.user
                else if ((response as any).data.user) {
                    user = (response as any).data.user;
                    token = (response as any).data.token || token;
                }
            }

            // Handle double nested data (common in some frameworks)
            if (!user && (response as any).data?.data?.user) {
                user = (response as any).data.data.user;
                token = (response as any).data.data.token || (response as any).data.token || token;
            }

            // Add check for 2FA OTP requirement
            if (response.requires_otp_verification) {
                return {
                    requiresOtp: true,
                    verificationToken: response.verification_token,
                    phone: response.phone,
                    type: response.type || 'login_2fa',
                };
            }

            if (!user) {
                console.error('Could not find user in response');
            }

            // Store in secure storage if valid
            if (token && typeof token === 'string') {
                await secureStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
            }

            if (response.refresh_token) {
                await secureStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, response.refresh_token);
            }

            if (response.expires_in) {
                const expiresAt = Date.now() + response.expires_in * 1000;
                await secureStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRES_AT, String(expiresAt));
                setGlobalToken(token || null, expiresAt);
            } else if (token) {
                setGlobalToken(token || null, null);
            }

            if (user) {
                await secureStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
            }

            // Register device token for push notifications
            try {
                console.log('🔔 Registering device token for push notifications...');
                await expoPushNotificationService.registerToken();
            } catch (notificationError) {
                console.error('Failed to register push notification token (non-critical):', notificationError);
                // Don't fail login if notification registration fails
            }

            // Clear guest cart token now that backend has automatically merged
            try {
                const { guestCartToken } = await import('@/services/storage/guestCartToken');
                await guestCartToken.clear();
            } catch (err) {
                console.error('Failed to clear guest cart token:', err);
            }

            // Sync/Fetch authenticated cart
            await dispatch(fetchCartThunk());

            return { requiresOtp: false, user, token };
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Login failed');
        }
    }
);

export const socialLoginThunk = createAsyncThunk(
    'auth/socialLogin',
    async (data: { token: string; provider: 'google' | 'facebook' | 'apple'; user_type?: 'customer' | 'supplier' }, { rejectWithValue, dispatch }) => {
        try {
            const response = await authApi.socialLogin({
                ...data,
                device_name: 'mobile_app',
            });

            console.log('Social Login Response:', JSON.stringify(response, null, 2));

            // Handle nested response structure
            let user = response.user;
            let token = response.token;

            if (!user && (response as any).data) {
                if ((response as any).data.id || (response as any).data.email) {
                    user = (response as any).data;
                } else if ((response as any).data.user) {
                    user = (response as any).data.user;
                    token = (response as any).data.token || token;
                }
            }

            if (!user) {
                console.error('Could not find user in social login response');
            }

            // Store in secure storage depending on user type
            if (token && typeof token === 'string') {
                if (data.user_type === 'supplier') {
                    await secureStorage.setItem(STORAGE_KEYS.SUPPLIER_AUTH_TOKEN, token);
                } else {
                    await secureStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
                }
            }

            if (response.refresh_token) {
                if (data.user_type === 'supplier') {
                    await secureStorage.setItem(STORAGE_KEYS.SUPPLIER_REFRESH_TOKEN, response.refresh_token);
                } else {
                    await secureStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, response.refresh_token);
                }
            }

            if (response.expires_in) {
                const expiresAt = Date.now() + response.expires_in * 1000;
                await secureStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRES_AT, String(expiresAt));
                setGlobalToken(token || null, expiresAt);
            } else if (token) {
                setGlobalToken(token || null, null);
            }

            if (user) {
                if (data.user_type === 'supplier') {
                    await secureStorage.setItem(STORAGE_KEYS.SUPPLIER_DATA, JSON.stringify(user));
                } else {
                    await secureStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
                }
            }

            // Register device token for push notifications
            try {
                if (data.user_type === 'supplier') {
                    const { supplierPushNotificationService } = await import('@/services/notifications/supplier-push-notification.service');
                    await supplierPushNotificationService.registerToken();
                } else {
                    await expoPushNotificationService.registerToken();
                }
            } catch (notificationError) {
                console.error('Failed to register push notification token:', notificationError);
            }

            // Clear guest cart token now that backend has automatically merged
            if (data.user_type !== 'supplier') {
                try {
                    const { guestCartToken } = await import('@/services/storage/guestCartToken');
                    await guestCartToken.clear();
                } catch (err) {
                    console.error('Failed to clear guest cart token:', err);
                }
                await dispatch(fetchCartThunk());
            }

            return { user, token };
        } catch (error: any) {
            console.error('socialLoginThunk error details:', {
                status: error.response?.status,
                data: error.response?.data,
                message: error.message,
            });
            return rejectWithValue(error.response?.data?.message || 'Social login failed');
        }
    }
);



export const signupThunk = createAsyncThunk(
    'auth/signup',
    async (data: SignupRequest, { getState, rejectWithValue, dispatch }) => {
        try {
            const state = getState() as any;
            const userType = state.auth.selectedUserType || 'customer';
            const response: SignupResponse = await authApi.register(data, userType);

            // Check if OTP verification is required
            if (response.requires_otp_verification && response.verification_token) {
                return {
                    requiresOtp: true,
                    verificationToken: response.verification_token,
                    phone: response.phone,
                    otpExpiry: response.otp_expiry,
                    resendAvailableAt: response.resend_available_at,
                    registrationData: data,
                };
            }

            // Direct registration (email-only or web)
            let user = response.user || response.data;
            let token = response.token;

            // Handle nested response structure
            if (!user && (response as any).data) {
                if ((response as any).data.id || (response as any).data.email) {
                    user = (response as any).data;
                } else if ((response as any).data.user) {
                    user = (response as any).data.user;
                    token = (response as any).data.token || token;
                }
            }

            // Store in secure storage if valid
            if (token && typeof token === 'string') {
                await secureStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
            }

            if (response.refresh_token) {
                await secureStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, response.refresh_token);
            }

            if (response.expires_in) {
                const expiresAt = Date.now() + response.expires_in * 1000;
                await secureStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRES_AT, String(expiresAt));
                setGlobalToken(token || null, expiresAt);
            } else if (token) {
                setGlobalToken(token || null, null);
            }

            if (user) {
                await secureStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
            }

            // Clear guest cart token now that backend has automatically merged
            try {
                const { guestCartToken } = await import('@/services/storage/guestCartToken');
                await guestCartToken.clear();
            } catch (err) {
                console.error('Failed to clear guest cart token:', err);
            }

            // Sync/Fetch authenticated cart
            await dispatch(fetchCartThunk());

            return { user, token, requiresOtp: false };
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Signup failed');
        }
    }
);

export const verifyOtpThunk = createAsyncThunk(
    'auth/verifyOtp',
    async (data: OtpVerificationRequest, { rejectWithValue, dispatch }) => {
        try {
            const response = await authApi.verifyOtp(data);

            // Handle nested response structure
            let user = response.user;
            let token = response.token;

            if (!user && (response as any).data) {
                if ((response as any).data.id || (response as any).data.email) {
                    user = (response as any).data;
                } else if ((response as any).data.user) {
                    user = (response as any).data.user;
                    token = (response as any).data.token || token;
                }
            }

            // Store in secure storage and register notifications only for customers
            // Suppliers need to login manually or wait for approval
            if (response.is_approved === undefined) {
                if (token && typeof token === 'string') {
                    await secureStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
                }

                if (response.refresh_token) {
                    await secureStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, response.refresh_token);
                }

                if (response.expires_in) {
                    const expiresAt = Date.now() + response.expires_in * 1000;
                    await secureStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRES_AT, String(expiresAt));
                    setGlobalToken(token || null, expiresAt);
                } else if (token) {
                    setGlobalToken(token || null, null);
                }

                if (user) {
                    await secureStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
                }

                // Register device token for push notifications (requires session)
                try {
                    console.log('🔔 Registering device token for push notifications...');
                    await expoPushNotificationService.registerToken();
                } catch (notificationError) {
                    console.error('Failed to register push notification token (non-critical):', notificationError);
                }

                // Clear guest cart token now that backend has automatically merged
                try {
                    const { guestCartToken } = await import('@/services/storage/guestCartToken');
                    await guestCartToken.clear();
                } catch (err) {
                    console.error('Failed to clear guest cart token:', err);
                }

                // Sync/Fetch authenticated cart
                await dispatch(fetchCartThunk());
            }

            return {
                user,
                token,
                isApproved: response.is_approved
            };
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'OTP verification failed');
        }
    }
);

export const resendOtpThunk = createAsyncThunk(
    'auth/resendOtp',
    async (data: ResendOtpRequest, { rejectWithValue }) => {
        try {
            const response = await authApi.resendOtp(data);
            return response;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to resend OTP');
        }
    }
);

export const logoutThunk = createAsyncThunk(
    'auth/logout',
    async (_, { rejectWithValue }) => {
        try {
            // Unregister device token for push notifications
            try {
                console.log('🔕 Unregistering device token for push notifications...');
                await expoPushNotificationService.unregisterToken();
            } catch (notificationError) {
                console.error('Failed to unregister push notification token (non-critical):', notificationError);
                // Don't fail logout if notification unregistration fails
            }

            // Sign out from Google if signed in
            try {
                await GoogleSignin.signOut();
            } catch (googleError) {
                console.error('Failed to sign out from Google (non-critical):', googleError);
            }

            await authApi.logout();
            // Disconnect Socket.IO session
            socketService.disconnect();
        } catch (error) {
            console.error('Logout API error:', error);
        } finally {
            // Clear storage regardless of API success
            await secureStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
            await secureStorage.removeItem(STORAGE_KEYS.USER_DATA);
        }
        return null;
    }
);

export const updateProfileThunk = createAsyncThunk(
    'auth/updateProfile',
    async (data: UpdateProfileRequest, { rejectWithValue }) => {
        try {
            const response = await authApi.updateProfile(data);
            console.log('Update Profile Response:', JSON.stringify(response, null, 2));

            // Handle nested response structure
            let user = response.data;

            // Sometimes the response might have data.data structure
            if (!user && (response as any).data?.data) {
                user = (response as any).data.data;
            }

            // Or the user might be directly in the response
            if (!user && (response as any).user) {
                user = (response as any).user;
            }

            console.log('Extracted user:', JSON.stringify(user, null, 2));

            // Store updated user data
            if (user) {
                await secureStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
            }

            return { user, message: response.message || (response as any).message };
        } catch (error: any) {
            console.error('Update Profile Error:', error);
            return rejectWithValue(error.response?.data?.message || 'Profile update failed');
        }
    }
);

export const updateSecurityThunk = createAsyncThunk(
    'auth/updateSecurity',
    async (data: { two_factor_enabled: boolean }, { rejectWithValue }) => {
        try {
            const response = await authApi.updateSecuritySettings(data);

            // Handle nested response structure
            let user = response.data;
            if (!user && (response as any).data?.data) {
                user = (response as any).data.data;
            }

            // Store updated user data
            if (user) {
                await secureStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
            }

            return { user, message: response.message || (response as any).message };
        } catch (error: any) {
            console.error('Update Security Error:', error);
            return rejectWithValue(error.response?.data?.message || 'Security update failed');
        }
    }
);

export const sendPhoneOtpThunk = createAsyncThunk(
    'auth/sendPhoneOtp',
    async (data: { phone: string; phone_country_id: number; dial_code: string }, { rejectWithValue }) => {
        try {
            const response = await authApi.sendPhoneOtp(data);
            return response;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to send OTP');
        }
    }
);

export const verifyPhoneOtpThunk = createAsyncThunk(
    'auth/verifyPhoneOtp',
    async (data: { verification_token: string; otp: string }, { rejectWithValue }) => {
        try {
            const response = await authApi.verifyPhoneOtp(data);

            // Store updated user data
            if (response.data) {
                await secureStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(response.data));
            }

            return response;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'OTP verification failed');
        }
    }
);

const normalizeUserObject = (user: User | null): User | null => {
    if (!user) return null;
    if (!user.customer_group_id && user.group?.id) {
        user.customer_group_id = user.group.id;
    }
    return user;
};

// Slice
const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setUser: (state, action: PayloadAction<User>) => {
            state.user = normalizeUserObject(action.payload);
            state.isAuthenticated = true;
        },
        setSelectedUserType: (state, action: PayloadAction<'customer' | 'supplier'>) => {
            state.selectedUserType = action.payload;
        },
        clearError: (state) => {
            state.error = null;
        },
        clearVerification: (state) => {
            state.verificationToken = null;
            state.pendingRegistration = null;
            state.error = null;
        },
        updateToken: (state, action: PayloadAction<{ token: string }>) => {
            state.token = action.payload.token;
        },
        updateCustomerGroupId: (state, action: PayloadAction<{ id: number | null; code?: string | null } | number | null>) => {
            if (state.user) {
                const groupCodeMap: Record<number, string> = { 1: 'guest', 2: 'general', 3: 'wholesale' };
                let id: number | null = null;
                let code: string | null = null;

                if (typeof action.payload === 'object' && action.payload !== null) {
                    id = action.payload.id;
                    code = action.payload.code || (id ? groupCodeMap[id] : null);
                } else {
                    id = action.payload;
                    code = id ? groupCodeMap[id] : null;
                }

                state.user.customer_group_id = id;
                if (code && id) {
                    state.user.group = {
                        id,
                        code,
                        name: code.charAt(0).toUpperCase() + code.slice(1),
                    };
                }
            }
        },
    },
    extraReducers: (builder) => {
        // Check Auth
        builder
            .addCase(checkAuthThunk.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(checkAuthThunk.fulfilled, (state, action) => {
                state.user = normalizeUserObject(action.payload.user);
                state.token = action.payload.token;
                state.isAuthenticated = true;
                state.isLoading = false;
                // Set global token for API client
                setGlobalToken(action.payload.token);
            })
            .addCase(checkAuthThunk.rejected, (state) => {
                state.user = null;
                state.token = null;
                state.isAuthenticated = false;
                state.isLoading = false;
            });

        // Login
        builder
            .addCase(loginThunk.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(loginThunk.fulfilled, (state, action) => {
                state.isLoading = false;
                state.error = null;

                if (!(action.payload as any).requiresOtp) {
                    state.user = normalizeUserObject(action.payload.user || null);
                    state.token = action.payload.token || null;
                    state.isAuthenticated = true;
                    // Set global token for API client
                    setGlobalToken(action.payload.token || null);
                }
            })
            .addCase(loginThunk.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            });

        // Social Login
        builder
            .addCase(socialLoginThunk.pending, (state, action) => {
                if (action.meta.arg.user_type !== 'supplier') {
                    state.isLoading = true;
                    state.error = null;
                }
            })
            .addCase(socialLoginThunk.fulfilled, (state, action) => {
                if (action.meta.arg.user_type !== 'supplier') {
                    state.user = action.payload.user || null;
                    state.token = action.payload.token || null;
                    state.isAuthenticated = true;
                    setGlobalToken(action.payload.token || null);
                }
                state.isLoading = false;
                state.error = null;
            })
            .addCase(socialLoginThunk.rejected, (state, action) => {
                if (action.meta.arg.user_type !== 'supplier') {
                    state.isLoading = false;
                    state.error = action.payload as string;
                }
            });


        // Signup
        builder
            .addCase(signupThunk.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(signupThunk.fulfilled, (state, action) => {
                if (action.payload.requiresOtp) {
                    // OTP verification required
                    state.verificationToken = action.payload.verificationToken || null;
                    state.pendingRegistration = action.payload.registrationData || null;
                    state.isLoading = false;
                    state.error = null;
                } else {
                    // Direct registration successful
                    state.user = action.payload.user || null;
                    state.token = action.payload.token || null;
                    state.isAuthenticated = true;
                    state.isLoading = false;
                    state.error = null;
                    setGlobalToken(action.payload.token || null);
                }
            })
            .addCase(signupThunk.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            });

        // Verify OTP
        builder
            .addCase(verifyOtpThunk.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(verifyOtpThunk.fulfilled, (state, action) => {
                const { isApproved } = action.payload;

                // If it's a supplier flow (isApproved is defined), we don't auto-authenticate
                // as they need to be redirected to Home or Login per user request.
                if (isApproved !== undefined) {
                    state.isLoading = false;
                    state.error = null;
                    state.verificationToken = null;
                    state.pendingRegistration = null;
                    // We don't set state.user, state.token, or state.isAuthenticated
                } else {
                    // Normal customer flow: auto-authenticate
                    state.user = action.payload.user || null;
                    state.token = action.payload.token || null;
                    state.isAuthenticated = true;
                    state.isLoading = false;
                    state.error = null;
                    state.verificationToken = null;
                    state.pendingRegistration = null;
                    setGlobalToken(action.payload.token || null);
                }
            })
            .addCase(verifyOtpThunk.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            });

        // Resend OTP
        builder
            .addCase(resendOtpThunk.pending, (state) => {
                // Don't set loading for resend to avoid blocking UI
            })
            .addCase(resendOtpThunk.fulfilled, (state) => {
                state.error = null;
            })
            .addCase(resendOtpThunk.rejected, (state, action) => {
                state.error = action.payload as string;
            });

        // Logout
        builder
            .addCase(logoutThunk.fulfilled, (state) => {
                state.user = null;
                state.token = null;
                state.isAuthenticated = false;
                state.error = null;
                // Clear global token
                setGlobalToken(null);
            });

        // Update Profile
        builder
            .addCase(updateProfileThunk.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(updateProfileThunk.fulfilled, (state, action) => {
                state.user = action.payload.user;
                state.isLoading = false;
                state.error = null;
            })
            .addCase(updateProfileThunk.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            });

        // Update Security
        builder
            .addCase(updateSecurityThunk.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(updateSecurityThunk.fulfilled, (state, action) => {
                if (action.payload.user) {
                    state.user = action.payload.user;
                }
                state.isLoading = false;
                state.error = null;
            })
            .addCase(updateSecurityThunk.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            });

        // Verify Phone OTP (Update profile upon success)
        builder
            .addCase(verifyPhoneOtpThunk.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(verifyPhoneOtpThunk.fulfilled, (state, action) => {
                if (action.payload.data) {
                    state.user = action.payload.data;
                }
                state.isLoading = false;
                state.error = null;
            })
            .addCase(verifyPhoneOtpThunk.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            });
    },
});

export const { setUser, setSelectedUserType, clearError, clearVerification, updateToken, updateCustomerGroupId } = authSlice.actions;
export default authSlice.reducer;
