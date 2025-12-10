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
                    
                    // 2. Try secure storage
                    if (!token) {
                        token = await secureStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
                    }
                    
                    // 3. Try AsyncStorage as fallback
                    if (!token) {
                        token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
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
                            await this.handleUnauthorized();
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
                            console.error('Server error');
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
        // Clear auth data
        await secureStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
        await secureStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
        await secureStorage.removeItem(STORAGE_KEYS.USER_DATA);

        // You can emit an event here to trigger navigation to login
        // or use a global state management solution
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
