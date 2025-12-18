import { apiClient } from './client';

export interface DeviceTokenData {
    token: string;
    device_name?: string;
    app_version?: string;
}

export const deviceTokenApi = {
    /**
     * Register device token for push notifications
     */
    register: async (data: DeviceTokenData) => {
        const response = await apiClient.post('/customer/device-token/register', data);
        return response.data;
    },

    /**
     * Unregister device token (on logout)
     */
    unregister: async (token: string) => {
        const response = await apiClient.post('/customer/device-token/unregister', { token });
        return response.data;
    },

    /**
     * Update device token information
     */
    update: async (data: DeviceTokenData) => {
        const response = await apiClient.put('/customer/device-token/update', data);
        return response.data;
    },
};
