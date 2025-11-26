import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { config } from '@/config/env';
import { STORAGE_KEYS } from '@/config/constants';
import { secureStorage } from '../storage/secureStorage';

/**
 * API Client
 * Axios instance with interceptors for authentication and error handling
 */

class ApiClient {
    private instance: AxiosInstance;

    constructor() {
        this.instance = axios.create({
            baseURL: config.apiUrl,
            timeout: config.timeout,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
        });

        this.setupInterceptors();
    }

    private setupInterceptors() {
        // Request interceptor - Add auth token
        this.instance.interceptors.request.use(
            async (config) => {
                const token = await secureStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);

                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }

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
                    // Handle specific error codes
                    switch (error.response.status) {
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
                        case 500:
                            // Server error
                            console.error('Server error');
                            break;
                        default:
                            console.error('API Error:', error.response.status);
                    }
                } else if (error.request) {
                    // Network error
                    console.error('Network error - no response received');
                } else {
                    console.error('Request setup error:', error.message);
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

// Export singleton instance
export const apiClient = new ApiClient();
export default apiClient;
