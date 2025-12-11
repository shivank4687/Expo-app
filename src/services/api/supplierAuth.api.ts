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
     * Logout supplier
     */
    async logout(): Promise<void> {
        return restApiClient.post(API_ENDPOINTS.SUPPLIER_LOGOUT);
    },
};

export default supplierAuthApi;
