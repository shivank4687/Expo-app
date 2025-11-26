import { apiClient } from './client';
import { API_ENDPOINTS } from '@/config/constants';
import { LoginRequest, SignupRequest, AuthResponse } from '@/features/auth/types/auth.types';

/**
 * Authentication API Service
 */

export const authApi = {
    /**
     * Login user
     */
    async login(credentials: LoginRequest): Promise<AuthResponse> {
        return apiClient.post<AuthResponse>(API_ENDPOINTS.LOGIN, credentials);
    },

    /**
     * Register new user
     */
    async register(data: SignupRequest): Promise<AuthResponse> {
        return apiClient.post<AuthResponse>(API_ENDPOINTS.REGISTER, data);
    },

    /**
     * Logout user
     */
    async logout(): Promise<void> {
        return apiClient.post(API_ENDPOINTS.LOGOUT);
    },

    /**
     * Refresh authentication token
     */
    async refreshToken(refreshToken: string): Promise<AuthResponse> {
        return apiClient.post<AuthResponse>(API_ENDPOINTS.REFRESH_TOKEN, {
            refresh_token: refreshToken,
        });
    },
};

export default authApi;
