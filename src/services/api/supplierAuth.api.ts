import { restApiClient } from './client';
import { API_ENDPOINTS } from '@/config/constants';
import {
    LoginRequest,
    AuthResponse,
} from '@/features/auth/types/auth.types';

/**
 * Supplier Authentication API Service
 * Uses REST API v1 endpoints for supplier app
 */

export interface Supplier {
    id: number;
    first_name: string;
    last_name: string;
    name: string;
    email: string;
    phone: string | null;
    phone_country_id: number | null;
    company_name: string;
    url: string;
    is_approved: boolean;
    is_verified: boolean;
    identity_verification_status: string;
    two_factor_enabled?: boolean;
    created_at: string;
    updated_at: string;
}

export interface SupplierAuthResponse {
    data: Supplier;
    message: string;
    token: string;
}

export const supplierAuthApi = {
    /**
     * Login supplier
     */
    async login(credentials: LoginRequest): Promise<SupplierAuthResponse> {
        return restApiClient.post<SupplierAuthResponse>(API_ENDPOINTS.SUPPLIER_LOGIN, {
            ...credentials,
            device_name: credentials.device_name || 'mobile_app',
        });
    },

    /**
     * Get authenticated supplier
     */
    async get(): Promise<{ data: Supplier }> {
        return restApiClient.get<{ data: Supplier }>(API_ENDPOINTS.SUPPLIER_GET);
    },

    /**
     * Update supplier email
     */
    async updateEmail(email: string): Promise<{ message: string }> {
        return restApiClient.put<{ message: string }>('/supplier-app/profile/email', { email });
    },

    /**
     * Update supplier security settings
     */
    async updateSecuritySettings(data: { two_factor_enabled: boolean }): Promise<{ message: string }> {
        return restApiClient.put<{ message: string }>('/supplier-app/profile/security', data);
    },

    /**
     * Logout supplier
     */
    async logout(): Promise<void> {
        return restApiClient.post(API_ENDPOINTS.SUPPLIER_LOGOUT);
    },

    /**
     * Send OTP to add/verify phone for authenticated supplier
     */
    async sendPhoneOtp(data: {
        phone: string;
        phone_country_id: number;
        dial_code: string;
    }): Promise<{
        requires_otp_verification: boolean;
        message: string;
        verification_token: string;
        type: string;
        phone: string;
        otp_expiry: string;
        resend_available_at: string;
    }> {
        return restApiClient.post('/supplier-app/send-phone-otp', data);
    },

    /**
     * Verify OTP and update supplier phone
     */
    async verifyPhoneOtp(data: {
        verification_token: string;
        otp: string;
    }): Promise<{ data: Supplier; message: string }> {
        return restApiClient.post('/supplier-app/verify-phone-otp', data);
    },
};

export default supplierAuthApi;
