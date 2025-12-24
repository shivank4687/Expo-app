import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { config } from '@/config/env';
import { STORAGE_KEYS } from '@/config/constants';
import { secureStorage } from '../storage/secureStorage';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Global token setter for Redux to update
let globalToken: string | null = null;
export const setGlobalToken = (token: string | null) => {
    globalToken = token;
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
                    // 1. Try global token (set by Redux)
                    let token = globalToken;

                    // 2. Try customer token from secure storage
                    if (!token) {
                        token = await secureStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
                    }

                    // 3. Try supplier token if customer token not found
                    if (!token) {
                        token = await secureStorage.getItem(STORAGE_KEYS.SUPPLIER_AUTH_TOKEN);
                    }

                    // 4. Try AsyncStorage as fallback (customer)
                    if (!token) {
                        token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
                    }

                    // 5. Try AsyncStorage as fallback (supplier)
                    if (!token) {
                        token = await AsyncStorage.getItem(STORAGE_KEYS.SUPPLIER_AUTH_TOKEN);
                    }

                    if (token) {
                        config.headers.Authorization = `Bearer ${token}`;
                        console.log('✅ Token added to request:', config.url);
                    } else {
                        console.log('⚠️ No token found for request:', config.url);
                    }
                } catch (tokenError) {
                    console.error('❌ Error retrieving token:', tokenError);
                }

                // Get locale and currency from storage
                // Fallback to 'en' and 'USD' if nothing is stored yet
                // These will be updated when the app initializes and fetches core config
                const locale = await AsyncStorage.getItem('selected_locale') || 'en';
                const currency = await AsyncStorage.getItem('selected_currency') || 'USD';

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
                            // Unauthorized - Clear auth and redirect to login
                            // Only handle if not already logging out to prevent infinite loop
                            if (!this.isLoggingOut) {
                                await this.handleUnauthorized();
                            }
                            break;
                        case 403:
                            // Forbidden
                            console.error('Access forbidden');
                            break;
                        case 404:
                            // Not found
                            console.error('Resource not found');
                            break;
                        case 422:
                            // Validation error
                            console.error('Validation error:', error.response.data);
                            break;
                        case 500:
                            // Server error
                            console.error('Server error:', error.response?.data);
                            console.error('Error details:', JSON.stringify(error.response?.data, null, 2));
                            break;
                        default:
                            console.error('API Error:', status, error.response.data);
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
            await secureStorage.removeItem(STORAGE_KEYS.SUPPLIER_DATA);

            // Clear global token
            setGlobalToken(null);

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
