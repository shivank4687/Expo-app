import { STORAGE_KEYS } from '@/config/constants';
import { config } from '@/config/env';
import { secureStorage } from '@/services/storage/secureStorage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

/**
 * Common utility for multipart/form-data fetch requests.
 * Used to bypass Axios "Network Error" bug in React Native standalone Android builds.
 */
export const multipartFetch = async <T = any>(
    endpoint: string,
    formData: FormData,
    options: { method?: 'POST' | 'PUT' | 'PATCH' } = {}
): Promise<T> => {
    const { method = 'POST' } = options;

    // 1. Build Headers
    const headers: Record<string, string> = {
        'Accept': 'application/json',
    };

    // 2. Authentication Token
    let token = await secureStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    if (!token) token = await secureStorage.getItem(STORAGE_KEYS.SUPPLIER_AUTH_TOKEN);
    if (!token) token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    if (!token) token = await AsyncStorage.getItem(STORAGE_KEYS.SUPPLIER_AUTH_TOKEN);

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    // 3. Locale and Currency
    const locale = await AsyncStorage.getItem('selected_locale') || 'en';
    const currency = await AsyncStorage.getItem('selected_currency') || 'USD';

    headers['X-Locale'] = locale;
    headers['X-Currency'] = currency;

    // 4. Construct URL
    // Endpoint might already be a full URL if it starts with http
    const url = endpoint.startsWith('http')
        ? endpoint
        : `${config.restApiUrl}${endpoint}`;

    try {
        const response = await fetch(url, {
            method,
            headers,
            body: formData,
        });

        const result = await response.json();

        if (!response.ok) {
            // Structure error like Axios for compatibility
            throw {
                response: {
                    status: response.status,
                    data: result
                }
            };
        }

        return result;
    } catch (error) {
        console.error(`multipartFetch error [${method} ${url}]:`, error);
        throw error;
    }
};

/**
 * Utility to ensure Android file URIs start with file://
 */
export const formatFileUri = (uri: string): string => {
    if (Platform.OS === 'android' && !uri.startsWith('file://') && !uri.startsWith('content://')) {
        return `file://${uri}`;
    }
    return uri;
};
