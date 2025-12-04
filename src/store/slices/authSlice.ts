import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { authApi } from '@/services/api/auth.api';
import { secureStorage } from '@/services/storage/secureStorage';
import { STORAGE_KEYS } from '@/config/constants';
import { User, LoginRequest, SignupRequest, AuthResponse, UpdateProfileRequest } from '@/features/auth/types/auth.types';
import { resetCart } from './cartSlice';
import { setGlobalToken } from '@/services/api/client';

interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
}

const initialState: AuthState = {
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
};

// Async Thunks
export const checkAuthThunk = createAsyncThunk(
    'auth/checkAuth',
    async (_, { rejectWithValue }) => {
        try {
            const token = await secureStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
            const userData = await secureStorage.getItem(STORAGE_KEYS.USER_DATA);

            if (token && userData && userData !== 'undefined' && userData !== 'null') {
                const parsedUser = JSON.parse(userData);
                if (parsedUser && parsedUser.id) {
                    console.log('✅ Restored user from storage:', parsedUser.name);
                    // Set global token for API client
                    setGlobalToken(token);
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
    async (credentials: LoginRequest, { rejectWithValue }) => {
        try {
            const response: AuthResponse = await authApi.login(credentials);
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

            if (!user) {
                console.error('Could not find user in response');
            }

            // Store in secure storage if valid
            if (token && typeof token === 'string') {
                await secureStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
            }

            if (user) {
                await secureStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
            }

            return { user, token };
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Login failed');
        }
    }
);

export const signupThunk = createAsyncThunk(
    'auth/signup',
    async (data: SignupRequest, { rejectWithValue }) => {
        try {
            const response: AuthResponse = await authApi.register(data);

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

            // Store in secure storage if valid
            if (token && typeof token === 'string') {
                await secureStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
            }

            if (user) {
                await secureStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
            }

            return { user, token };
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Signup failed');
        }
    }
);

export const logoutThunk = createAsyncThunk(
    'auth/logout',
    async (_, { rejectWithValue }) => {
        try {
            await authApi.logout();
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

// Slice
const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setUser: (state, action: PayloadAction<User>) => {
            state.user = action.payload;
            state.isAuthenticated = true;
        },
        clearError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        // Check Auth
        builder
            .addCase(checkAuthThunk.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(checkAuthThunk.fulfilled, (state, action) => {
                state.user = action.payload.user;
                state.token = action.payload.token;
                state.isAuthenticated = true;
                state.isLoading = false;
                // Set global token for API client
                setGlobalToken(action.payload.token);
            })
            .addCase(checkAuthThunk.rejected, (state) => {
                state.isLoading = false;
            });

        // Login
        builder
            .addCase(loginThunk.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(loginThunk.fulfilled, (state, action) => {
                state.user = action.payload.user;
                state.token = action.payload.token;
                state.isAuthenticated = true;
                state.isLoading = false;
                state.error = null;
                // Set global token for API client
                setGlobalToken(action.payload.token);
            })
            .addCase(loginThunk.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            });

        // Signup
        builder
            .addCase(signupThunk.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(signupThunk.fulfilled, (state, action) => {
                state.user = action.payload.user;
                state.token = action.payload.token;
                state.isAuthenticated = true;
                state.isLoading = false;
                state.error = null;
                // Set global token for API client
                setGlobalToken(action.payload.token);
            })
            .addCase(signupThunk.rejected, (state, action) => {
                state.isLoading = false;
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
    },
});

export const { setUser, clearError } = authSlice.actions;
export default authSlice.reducer;
