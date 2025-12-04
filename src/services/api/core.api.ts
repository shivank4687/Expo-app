import { restApiClient } from './client';
import { PaginatedResponse } from '@/types/global.types';

/**
 * Core API Service
 * Handles countries, states, and other core data
 */

export interface Country {
    id: string;
    code: string;
    name: string;
}

export interface State {
    id: number;
    country_id: string;
    country_code: string;
    code: string;
    default_name: string;
}

export const coreApi = {
    /**
     * Get all countries
     */
    async getCountries(): Promise<Country[]> {
        const response = await restApiClient.get<PaginatedResponse<Country>>('/countries', {
            params: { pagination: 0 },
        });
        return response.data || [];
    },

    /**
     * Get states by country code
     */
    async getStatesByCountry(countryCode: string): Promise<State[]> {
        const response = await restApiClient.get<PaginatedResponse<State>>('/countries-states', {
            params: { 
                pagination: 0,
                country_code: countryCode,
            },
        });
        return response.data || [];
    },
};

export default coreApi;
