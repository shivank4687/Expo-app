import { restApiClient } from './client';
import { API_ENDPOINTS } from '@/config/constants';
import { ThemeCustomization, ThemeCustomizationsResponse } from '@/types/theme.types';
import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME_CACHE_KEY = 'cache_theme_customizations';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Theme Customizations API Service
 * Fetches theme customization configuration from Bagisto backend
 */

export const themeApi = {
    /**
     * Get all theme customizations for the current channel
     */
    async getCustomizations(): Promise<ThemeCustomization[]> {
        try {
            const cachedData = await AsyncStorage.getItem(THEME_CACHE_KEY);
            if (cachedData) {
                const { data, timestamp } = JSON.parse(cachedData);
                const isExpired = Date.now() - timestamp > CACHE_TTL;

                // Return cached data immediately, update in background
                if (!isExpired) {
                    // Fire background fetch to keep cache warm (Stale-While-Revalidate)
                    themeApi._fetchAndCacheCustomizations().catch(e => console.log('Background theme fetch failed', e));
                    return data;
                }
            }
        } catch (e) {
            console.log('Error reading theme cache:', e);
        }

        // Fetch fresh if no cache or expired
        return themeApi._fetchAndCacheCustomizations();
    },

    /**
     * Internal method to fetch and update the cache
     */
    async _fetchAndCacheCustomizations(): Promise<ThemeCustomization[]> {
        const response = await restApiClient.get<ThemeCustomizationsResponse>(
            API_ENDPOINTS.THEME_CUSTOMIZATIONS
        );

        // Sort by sort_order to maintain the order defined in admin
        const customizations = response.data || [];
        const sorted = customizations.sort((a, b) => a.sort_order - b.sort_order);

        // Update cache quietly
        AsyncStorage.setItem(THEME_CACHE_KEY, JSON.stringify({
            data: sorted,
            timestamp: Date.now()
        })).catch(e => console.log('Error saving theme cache:', e));

        return sorted;
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

