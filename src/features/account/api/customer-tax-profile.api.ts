import { restApiClient } from '@/services/api/client';
import { API_ENDPOINTS } from '@/config/constants';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface CustomerProfile {
    id: number;
    customer_group_id: number | null;
    group?: {
        id: number;
        code: string;
        name: string;
    } | null;
    first_name: string;
    last_name: string;
}

export interface CustomerGroup {
    id: number;
    code: string;
    name: string;
}

export interface CustomerTaxProfile {
    customer_id?: number;
    tax_mode: boolean;
    tax_id?: string | null;
    tax_percentage?: number | null;
    fiscal_regime?: string | null;
    phone?: string | null;
    address?: string | null;
    city?: string | null;
    state?: string | null;
    country?: string | null;
    postcode?: string | null;
}

export interface CustomerTaxProfilePayload {
    tax_mode: boolean;
    tax_id?: string | null;
    tax_percentage?: number | null;
    fiscal_regime?: string | null;
    phone?: string | null;
    address?: string | null;
    city?: string | null;
    state?: string | null;
    country?: string | null;
    postcode?: string | null;
}

// ─── API Functions ────────────────────────────────────────────────────────────

/**
 * Fetch the authenticated customer's profile (includes customer_group_id)
 */
export const getCustomerProfile = async (): Promise<CustomerProfile> => {
    const response = await restApiClient.get<{ data: CustomerProfile }>(
        API_ENDPOINTS.CUSTOMER_GET
    );
    return response.data;
};

/**
 * Fetch all available customer groups (e.g. General, Wholesale)
 */
export const getCustomerGroups = async (): Promise<CustomerGroup[]> => {
    const response = await restApiClient.get<{ data: CustomerGroup[] }>(
        API_ENDPOINTS.CUSTOMER_GROUPS
    );
    return response.data;
};

/**
 * Fetch customer groups without requiring authentication.
 * Used on the Signup screen to populate the Customer Type dropdown.
 * restApiClient will simply omit the Authorization header when no token is stored.
 */
export const getPublicCustomerGroups = async (): Promise<CustomerGroup[]> => {
    const response = await restApiClient.get<{ data: CustomerGroup[] }>(
        API_ENDPOINTS.CUSTOMER_GROUPS_PUBLIC
    );
    return response.data;
};

/**
 * Update the authenticated customer's group
 */
export const updateCustomerGroup = async (groupId: number): Promise<void> => {
    await restApiClient.put(API_ENDPOINTS.CUSTOMER_GROUP_UPDATE, {
        group_id: groupId,
    });
};

/**
 * Fetch the authenticated customer's tax profile
 */
export const getCustomerTaxProfile = async (): Promise<CustomerTaxProfile> => {
    const response = await restApiClient.get<{ data: CustomerTaxProfile }>(
        API_ENDPOINTS.CUSTOMER_TAX_PROFILE
    );
    return response.data;
};

/**
 * Save (create or update) the authenticated customer's tax profile
 */
export const updateCustomerTaxProfile = async (
    payload: CustomerTaxProfilePayload
): Promise<CustomerTaxProfile> => {
    const response = await restApiClient.put<{ data: CustomerTaxProfile }>(
        API_ENDPOINTS.CUSTOMER_TAX_PROFILE,
        payload
    );
    return response.data;
};
