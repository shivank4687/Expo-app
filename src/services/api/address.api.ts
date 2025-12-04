import { restApiClient } from './client';
import { Address, AddressFormData } from '@/features/address/types/address.types';
import { PaginatedResponse } from '@/types/global.types';

/**
 * Address API Service
 * Manages customer addresses
 */

const API_BASE = '/customer/addresses';

export const addressApi = {
    /**
     * Get all addresses for the logged-in customer
     */
    async getAddresses(): Promise<Address[]> {
        const response = await restApiClient.get<PaginatedResponse<Address>>(API_BASE, {
            params: { pagination: 0 }, // Get all addresses without pagination
        });
        return response.data || [];
    },

    /**
     * Get a single address by ID
     */
    async getAddressById(id: number): Promise<Address> {
        const response = await restApiClient.get<{ data: Address }>(`${API_BASE}/${id}`);
        return response.data;
    },

    /**
     * Create a new address
     */
    async createAddress(data: AddressFormData): Promise<Address> {
        const response = await restApiClient.post<{ data: Address }>(API_BASE, data);
        return response.data;
    },

    /**
     * Update an existing address
     */
    async updateAddress(id: number, data: AddressFormData): Promise<Address> {
        const response = await restApiClient.put<{ data: Address }>(`${API_BASE}/${id}`, data);
        return response.data;
    },

    /**
     * Delete an address
     */
    async deleteAddress(id: number): Promise<void> {
        await restApiClient.delete(`${API_BASE}/${id}`);
    },

    /**
     * Set an address as default
     */
    async makeDefaultAddress(id: number): Promise<Address> {
        const response = await restApiClient.patch<{ data: Address }>(`${API_BASE}/make-default/${id}`);
        return response.data;
    },
};

export default addressApi;

