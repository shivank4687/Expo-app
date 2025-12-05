import { restApiClient } from './client';
import { PaginatedResponse } from '@/types/global.types';

/**
 * Core API Service
 * Handles locales, currencies, channels, countries, states, and other core data
 */

export interface Locale {
    id: number;
    code: string;
    name: string;
    direction?: string;
}

export interface Currency {
    id: number;
    code: string;
    name: string;
    symbol?: string;
}

export interface Channel {
    id: number;
    code: string;
    name: string;
    description?: string;
    hostname?: string;
    default_locale?: Locale;
    base_currency?: Currency;
}

export interface CoreConfig {
    locales: Locale[];
    currencies: Currency[];
    channels: Channel[];
    defaultLocale: Locale | null;
    defaultCurrency: Currency | null;
    defaultChannel: Channel | null;
}

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
     * Get core configuration (locales, currencies, channels)
     */
    async getCoreConfig(): Promise<CoreConfig> {
        try {
            // Fetch all core data in parallel
            const [localesResponse, currenciesResponse, channelsResponse] = await Promise.all([
                restApiClient.get<{ data: Locale[] }>('/locales'),
                restApiClient.get<{ data: Currency[] }>('/currencies'),
                restApiClient.get<{ data: Channel[] }>('/channels'),
            ]);

            const locales = localesResponse.data || [];
            const currencies = currenciesResponse.data || [];
            const channels = channelsResponse.data || [];

            // Get the default channel (usually the first one)
            const defaultChannel = channels[0];

            // Use the channel's default locale and currency if available
            const defaultLocale = defaultChannel?.default_locale 
                ? locales.find(l => l.id === defaultChannel.default_locale?.id) || locales[0]
                : locales[0];

            const defaultCurrency = defaultChannel?.base_currency
                ? currencies.find(c => c.id === defaultChannel.base_currency?.id) || currencies[0]
                : currencies[0];

            console.log('✅ Core config loaded:', {
                locales: locales.length,
                currencies: currencies.length,
                channels: channels.length,
                defaultLocale: defaultLocale?.code,
                defaultCurrency: defaultCurrency?.code,
            });

            return {
                locales,
                currencies,
                channels,
                defaultLocale: defaultLocale || null,
                defaultCurrency: defaultCurrency || null,
                defaultChannel: defaultChannel || null,
            };
        } catch (error: any) {
            console.error('❌ Error fetching core config:', error);
            throw new Error(error.response?.data?.message || 'Failed to fetch core configuration');
        }
    },

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
