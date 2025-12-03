import { restApiClient } from './client';

// Types
export interface Locale {
    id: number;
    code: string;
    name: string;
    direction: 'ltr' | 'rtl';
    image?: string;
}

export interface Currency {
    id: number;
    code: string;
    name: string;
    symbol: string;
}

export interface Channel {
    id: number;
    code: string;
    name: string;
    description?: string;
    theme?: string;
    hostname?: string;
    default_locale_id: number;
    base_currency_id: number;
    root_category_id?: number;
}

export interface CoreConfig {
    locales: Locale[];
    currencies: Currency[];
    channels: Channel[];
    defaultLocale?: Locale;
    defaultCurrency?: Currency;
    defaultChannel?: Channel;
}

// API Service
// Uses REST API v1 endpoints
export const coreApi = {
    /**
     * Get all available locales
     */
    getLocales: async (): Promise<Locale[]> => {
        try {
            const response = await restApiClient.get<{ data: Locale[] }>('/locales');
            return response.data || [];
        } catch (error) {
            console.error('Error fetching locales:', error);
            throw error;
        }
    },

    /**
     * Get all available currencies
     */
    getCurrencies: async (): Promise<Currency[]> => {
        try {
            const response = await restApiClient.get<{ data: Currency[] }>('/currencies');
            return response.data || [];
        } catch (error) {
            console.error('Error fetching currencies:', error);
            throw error;
        }
    },

    /**
     * Get all channels
     */
    getChannels: async (): Promise<Channel[]> => {
        try {
            const response = await restApiClient.get<{ data: Channel[] }>('/channels');
            return response.data || [];
        } catch (error) {
            console.error('Error fetching channels:', error);
            throw error;
        }
    },

    /**
     * Get core configuration (locales, currencies, channels)
     */
    getCoreConfig: async (): Promise<CoreConfig> => {
        try {
            const [locales, currencies, channels] = await Promise.all([
                coreApi.getLocales(),
                coreApi.getCurrencies(),
                coreApi.getChannels(),
            ]);

            return {
                locales,
                currencies,
                channels,
                defaultLocale: locales.find(l => l.code === 'en'),
                defaultCurrency: currencies.find(c => c.code === 'USD'),
                defaultChannel: channels[0],
            };
        } catch (error) {
            console.error('Error fetching core config:', error);
            throw error;
        }
    },
};

