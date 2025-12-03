import { restApiClient } from './client';
import { API_ENDPOINTS } from '@/config/constants';
import { LoginRequest, SignupRequest, AuthResponse } from '@/features/auth/types/auth.types';

/**
 * Authentication API Service
 * Uses REST API v1 endpoints
 */

export const authApi = {
    /**
     * Login user
     */
    async login(credentials: LoginRequest): Promise<AuthResponse> {
        return restApiClient.post<AuthResponse>(API_ENDPOINTS.LOGIN, {
            ...credentials,
            device_name: credentials.device_name || 'mobile_app',
        });
    },

    /**
     * Register new user
     */
    async register(data: SignupRequest): Promise<AuthResponse> {
        return restApiClient.post<AuthResponse>(API_ENDPOINTS.REGISTER, data);
    },

    /**
     * Logout user
     */
    async logout(): Promise<void> {
        return restApiClient.post(API_ENDPOINTS.LOGOUT);
    },

    /**
     * Refresh authentication token
     */
    async refreshToken(refreshToken: string): Promise<AuthResponse> {
        return restApiClient.post<AuthResponse>(API_ENDPOINTS.REFRESH_TOKEN, {
            refresh_token: refreshToken,
        });
    },
};

export default authApi;
