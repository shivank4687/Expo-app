import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { config } from '@/config/env';
import { STORAGE_KEYS } from '@/config/constants';
import { secureStorage } from '../storage/secureStorage';
import { isTokenExpired } from '@/shared/utils/authUtils';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Global token setter for Redux to update
let globalToken: string | null = null;
let globalExpiresAt: number | null = null;
export const setGlobalToken = (token: string | null, expiresAt: number | null = null) => {
    globalToken = token;
    if (expiresAt !== null || token === null) {
        globalExpiresAt = expiresAt;
    }
};

let isRefreshing = false;
let refreshQueue: Array<(token: string) => void> = [];

const processQueue = (error: any, token: string | null = null) => {
    refreshQueue.forEach((callback) => {
        if (token) {
            callback(token);
        }
    });
    refreshQueue = [];
};

const isTokenExpiringSoon = (expiresAt: number | null, bufferSeconds = 60): boolean => {
    if (!expiresAt) return false;
    return Date.now() > expiresAt - (bufferSeconds * 1000);
};

const performTokenRefresh = async (): Promise<string> => {
    const isSupplier = await secureStorage.getItem(STORAGE_KEYS.SUPPLIER_AUTH_TOKEN) !== null;
    const userType = isSupplier ? 'supplier' : 'customer';

    try {
        let newToken: string;
        let newRefreshToken: string | undefined;
        let expiresIn: number | undefined;

        if (userType === 'supplier') {
            const refreshToken = await secureStorage.getItem(STORAGE_KEYS.SUPPLIER_REFRESH_TOKEN);
            if (!refreshToken) throw new Error('No supplier refresh token available.');

            const { supplierAuthApi } = await import('./supplierAuth.api');
            const response = await supplierAuthApi.refreshToken(refreshToken);

            newToken = response.token;
            newRefreshToken = response.refresh_token;
            expiresIn = response.expires_in;

            await secureStorage.setItem(STORAGE_KEYS.SUPPLIER_AUTH_TOKEN, newToken);
            if (newRefreshToken) {
                await secureStorage.setItem(STORAGE_KEYS.SUPPLIER_REFRESH_TOKEN, newRefreshToken);
            }
            if (expiresIn) {
                const expiresAt = Date.now() + expiresIn * 1000;
                await secureStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRES_AT, String(expiresAt));
                setGlobalToken(newToken, expiresAt);
            } else {
                setGlobalToken(newToken, null);
            }

            // Sync with Redux store
            try {
                const { store } = await import('@/store/store');
                const { updateSupplierToken } = await import('@/store/slices/supplierAuthSlice');
                store.dispatch(updateSupplierToken({ token: newToken }));
            } catch (reduxError) {
                console.error('Redux updateSupplierToken error:', reduxError);
            }
        } else {
            const refreshToken = await secureStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
            if (!refreshToken) throw new Error('No customer refresh token available.');

            const { authApi } = await import('./auth.api');
            const response = await authApi.refreshToken(refreshToken);

            newToken = response.token || '';
            newRefreshToken = response.refresh_token;
            expiresIn = response.expires_in;

            if (!newToken) throw new Error('Invalid new access token.');

            await secureStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, newToken);
            if (newRefreshToken) {
                await secureStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, newRefreshToken);
            }
            if (expiresIn) {
                const expiresAt = Date.now() + expiresIn * 1000;
                await secureStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRES_AT, String(expiresAt));
                setGlobalToken(newToken, expiresAt);
            } else {
                setGlobalToken(newToken, null);
            }

            // Sync with Redux store
            try {
                const { store } = await import('@/store/store');
                const { updateToken } = await import('@/store/slices/authSlice');
                store.dispatch(updateToken({ token: newToken }));
            } catch (reduxError) {
                console.error('Redux updateToken error:', reduxError);
            }
        }

        return newToken;
    } catch (error) {
        console.error('Token refresh execution failed:', error);
        throw error;
    }
};

// Global locale and currency caches
let globalLocale: string = '';
let globalCurrency: string = '';

export const setGlobalLocale = (locale: string) => {
    globalLocale = locale;
};

export const setGlobalCurrency = (currency: string) => {
    globalCurrency = currency;
};

/**
 * API Client Types
 */
type ApiType = 'rest' | 'shop';

/**
 * Base API Client
 * Axios instance with interceptors for authentication and error handling
 */
class ApiClient {
    private instance: AxiosInstance;
    private apiType: ApiType;
    private isLoggingOut: boolean = false;

    constructor(apiType: ApiType = 'rest') {
        this.apiType = apiType;
        const baseURL = apiType === 'shop' ? config.shopApiUrl : config.restApiUrl;

        this.instance = axios.create({
            baseURL,
            timeout: config.timeout,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
        });

        this.setupInterceptors();
    }

    private setupInterceptors() {
        // Request interceptor - Add auth token, locale, and currency
        this.instance.interceptors.request.use(
            async (config) => {
                // Add auth token - Try multiple sources
                try {
                    // 1. Try global token (set by Redux or cached)
                    let token = globalToken;

                    // 2. Try customer token from secure storage
                    if (!token) {
                        token = await secureStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
                        if (token) {
                            globalToken = token;
                            const expiresAtStr = await secureStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRES_AT);
                            globalExpiresAt = expiresAtStr ? Number(expiresAtStr) : null;
                        }
                    }

                    // 3. Try supplier token if customer token not found
                    if (!token) {
                        token = await secureStorage.getItem(STORAGE_KEYS.SUPPLIER_AUTH_TOKEN);
                        if (token) {
                            globalToken = token;
                            const expiresAtStr = await secureStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRES_AT);
                            globalExpiresAt = expiresAtStr ? Number(expiresAtStr) : null;
                        }
                    }

                    // 4. Try AsyncStorage as fallback (customer)
                    if (!token) {
                        token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
                        if (token) {
                            globalToken = token;
                            const expiresAtStr = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRES_AT);
                            globalExpiresAt = expiresAtStr ? Number(expiresAtStr) : null;
                        }
                    }

                    // 5. Try AsyncStorage as fallback (supplier)
                    if (!token) {
                        token = await AsyncStorage.getItem(STORAGE_KEYS.SUPPLIER_AUTH_TOKEN);
                        if (token) {
                            globalToken = token;
                            const expiresAtStr = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRES_AT);
                            globalExpiresAt = expiresAtStr ? Number(expiresAtStr) : null;
                        }
                    }

                    // Preemptive check
                    const url = config.url || '';
                    const isRefreshEndpoint = url.includes('/customer/refresh-token') || url.includes('/supplier-app/refresh-token');

                    if (token && !isRefreshEndpoint && isTokenExpiringSoon(globalExpiresAt, 60)) {
                        console.log('⏳ Preemptively refreshing expired/expiring token for request:', config.url);
                        if (isRefreshing) {
                            try {
                                const newToken = await new Promise<string>((resolve) => {
                                    refreshQueue.push((token) => resolve(token));
                                });
                                token = newToken;
                            } catch (queueErr) {
                                return Promise.reject(queueErr);
                            }
                        } else {
                            isRefreshing = true;
                            try {
                                const newToken = await performTokenRefresh();
                                processQueue(null, newToken);
                                isRefreshing = false;
                                token = newToken;
                            } catch (refreshErr) {
                                processQueue(refreshErr);
                                isRefreshing = false;
                                await this.handleUnauthorized();
                                return Promise.reject(refreshErr);
                            }
                        }
                    }

                    if (token) {
                        config.headers.Authorization = `Bearer ${token}`;
                        //console.log('✅ Token added to request:', config.url, config.params);
                    } else {
                        try {
                            const { guestCartToken } = await import('../storage/guestCartToken');
                            const guestToken = await guestCartToken.get();
                            if (guestToken) {
                                config.headers['X-Guest-Cart-Token'] = guestToken;
                            }
                        } catch (guestTokenError) {
                            console.error('Error attaching X-Guest-Cart-Token:', guestTokenError);
                        }
                    }
                } catch (tokenError) {
                    console.error('❌ Error retrieving token:', tokenError);
                }

                // Get locale and currency from cache, fallback to storage (only once)
                let locale = globalLocale;
                let currency = globalCurrency;

                if (!locale) {
                    locale = await AsyncStorage.getItem('selected_locale') || 'en';
                    globalLocale = locale;
                }

                if (!currency) {
                    currency = await AsyncStorage.getItem('selected_currency') || 'USD';
                    globalCurrency = currency;
                }

                // Handle locale based on API type
                if (this.apiType === 'rest') {
                    // REST API uses X-Locale header
                    config.headers['X-Locale'] = locale;
                } else if (this.apiType === 'shop') {
                    // Shop API uses query parameter
                    // Add locale to query params if not already present
                    if (!config.url?.includes('locale=')) {
                        const separator = config.url?.includes('?') ? '&' : '?';
                        config.url = `${config.url}${separator}locale=${locale}`;
                    }
                }

                // Currency is handled the same way for both
                config.headers['X-Currency'] = currency;

                // If the request data is FormData, remove JSON Content-Type
                // so axios/React Native can set multipart boundary correctly.
                const isFormDataPayload =
                    !!config.data &&
                    typeof (config.data as any).append === 'function' &&
                    (Object.prototype.toString.call(config.data) === '[object FormData]' ||
                        (typeof FormData !== 'undefined' && config.data instanceof FormData));

                if (isFormDataPayload) {
                    delete config.headers['Content-Type'];
                    delete config.headers['content-type'];
                }
                console.log('📤 Request:', config.url, config.params, config.data);
                return config;
            },
            (error) => {
                return Promise.reject(error);
            }
        );

        // Response interceptor - Handle errors
        this.instance.interceptors.response.use(
            (response) => response,
            async (error: AxiosError) => {
                if (error.response) {
                    const status = error.response.status;
                    // Handle specific error codes
                    switch (status) {
                        case 401:
                            const originalRequest = error.config;
                            if (originalRequest) {
                                const url = originalRequest.url || '';
                                const isLogoutEndpoint = url.includes('/logout');

                                if (this.isLoggingOut || isLogoutEndpoint) {
                                    console.log(`🚨 401 Unauthorized for ${url} during logout. Rejecting immediately...`);
                                    break;
                                }

                                if (!(originalRequest as any)._retry) {
                                    (originalRequest as any)._retry = true;
                                    const isRefreshEndpoint = url.includes('/customer/refresh-token') || url.includes('/supplier-app/refresh-token');

                                    if (isRefreshEndpoint) {
                                        console.log('❌ Token refresh failed with 401. Logging out...');
                                        await this.handleUnauthorized();
                                        break;
                                    }

                                    console.log('🚨 401 Unauthorized received, trying to refresh token for:', url);
                                    if (isRefreshing) {
                                        try {
                                            const newToken = await new Promise<string>((resolve) => {
                                                refreshQueue.push((token) => resolve(token));
                                            });
                                            originalRequest.headers.Authorization = `Bearer ${newToken}`;
                                            return this.instance(originalRequest);
                                        } catch (queueErr) {
                                            return Promise.reject(queueErr);
                                        }
                                    }

                                    isRefreshing = true;
                                    try {
                                        const newToken = await performTokenRefresh();
                                        processQueue(null, newToken);
                                        isRefreshing = false;
                                        originalRequest.headers.Authorization = `Bearer ${newToken}`;
                                        return this.instance(originalRequest);
                                    } catch (refreshErr) {
                                        processQueue(refreshErr);
                                        isRefreshing = false;
                                        await this.handleUnauthorized();
                                        return Promise.reject(error);
                                    }
                                } else {
                                    console.error('🚨 401 Unauthorized received for URL (no retry):', error.config?.url);
                                    if (!this.isLoggingOut) {
                                        await this.handleUnauthorized();
                                    }
                                }
                            }
                            break;
                        case 403:
                            // Forbidden
                            //console.error('Access forbidden');
                            break;
                        case 404:
                            // Not found
                            //console.error('Resource not found');
                            break;
                        case 422:
                            // Validation error
                            //console.error('Validation error:', error.response.data);
                            break;
                        case 500:
                            // Server error
                            //console.error('Server error:', error.response?.data);
                            //console.error('Error details:', JSON.stringify(error.response?.data, null, 2));
                            break;
                        default:
                        //console.error('API Error:', status, error.response.data);
                    }
                } else if (error.request) {
                    // Network error
                    console.error('Network error - no response received');
                } else {
                    // Request setup error
                    const message = error.message || 'Unknown error';
                    console.error('Request setup error:', message);
                }

                return Promise.reject(error);
            }
        );
    }

    private async handleUnauthorized() {
        // Prevent infinite loop
        if (this.isLoggingOut) {
            console.log('⚠️ Already logging out, skipping...');
            return;
        }

        this.isLoggingOut = true;
        console.log('🚨 401 Unauthorized - Logging out user');

        try {
            // Clear customer auth data
            await secureStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
            await secureStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
            await secureStorage.removeItem(STORAGE_KEYS.USER_DATA);

            // Clear supplier auth data
            await secureStorage.removeItem(STORAGE_KEYS.SUPPLIER_AUTH_TOKEN);
            await secureStorage.removeItem(STORAGE_KEYS.SUPPLIER_REFRESH_TOKEN);
            await secureStorage.removeItem(STORAGE_KEYS.SUPPLIER_DATA);

            // Clear token expiration
            await secureStorage.removeItem(STORAGE_KEYS.TOKEN_EXPIRES_AT);

            // Clear global token
            setGlobalToken(null, null);

            // Dispatch logout to Redux store
            // Import store dynamically to avoid circular dependencies
            try {
                const { store } = await import('@/store/store');
                const { logoutThunk } = await import('@/store/slices/authSlice');
                const { supplierLogoutThunk } = await import('@/store/slices/supplierAuthSlice');

                // Dispatch both logout actions to clear all auth state
                // Note: These will try to call logout API which will fail with 401
                // but that's okay because we're already clearing everything
                await store.dispatch(logoutThunk());
                await store.dispatch(supplierLogoutThunk());

                console.log('✅ User logged out successfully');
            } catch (error) {
                console.error('❌ Error dispatching logout:', error);
            }
        } finally {
            // Reset flag after a delay to allow logout to complete
            setTimeout(() => {
                this.isLoggingOut = false;
            }, 2000);
        }
    }

    // HTTP Methods
    async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
        const response: AxiosResponse<T> = await this.instance.get(url, config);
        return response.data;
    }

    async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
        const response: AxiosResponse<T> = await this.instance.post(url, data, config);
        return response.data;
    }

    async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
        const response: AxiosResponse<T> = await this.instance.put(url, data, config);
        return response.data;
    }

    async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
        const response: AxiosResponse<T> = await this.instance.patch(url, data, config);
        return response.data;
    }

    async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
        const response: AxiosResponse<T> = await this.instance.delete(url, config);
        return response.data;
    }
}

// Export singleton instances
// REST API Client - uses X-Locale header, for /api/v1 endpoints
export const restApiClient = new ApiClient('rest');

// Shop API Client - uses ?locale= query parameter, for /api endpoints
export const shopApiClient = new ApiClient('shop');

// Default export for backward compatibility (REST API)
export const apiClient = restApiClient;

export default apiClient;
