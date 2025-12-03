import { restApiClient } from './client';
import { API_ENDPOINTS } from '@/config/constants';
import { ThemeCustomization, ThemeCustomizationsResponse } from '@/types/theme.types';

/**
 * Theme Customizations API Service
 * Fetches theme customization configuration from Bagisto backend
 */

export const themeApi = {
    /**
     * Get all theme customizations for the current channel
     */
    async getCustomizations(): Promise<ThemeCustomization[]> {
        const response = await restApiClient.get<ThemeCustomizationsResponse>(
            API_ENDPOINTS.THEME_CUSTOMIZATIONS
        );
        
        // Sort by sort_order to maintain the order defined in admin
        const customizations = response.data || [];
        return customizations.sort((a, b) => a.sort_order - b.sort_order);
    },

    /**
     * Get a specific customization by ID
     */
    async getCustomizationById(id: number): Promise<ThemeCustomization> {
        const response = await restApiClient.get<{ data: ThemeCustomization }>(
            `${API_ENDPOINTS.THEME_CUSTOMIZATIONS}/${id}`
        );
        
        return response.data;
    },
};

export default themeApi;

