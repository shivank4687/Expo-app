import { restApiClient } from './client';
import { API_ENDPOINTS } from '@/config/constants';

export interface DeviceTokenData {
    token: string;
    device_name?: string;
    app_version?: string;
}

/**
 * Supplier Device Token API
 *
 * Hits /api/v1/supplier-app/device-token/... (requires supplier Sanctum auth).
 * Tokens are stored with user_type = 'supplier' in expo_device_tokens so
 * PushNotificationService::sendToSupplier() can look them up correctly.
 *
 * Intentionally separate from deviceTokenApi which hits
 * /api/v1/customer/device-token/... for customer tokens.
 */
export const supplierDeviceTokenApi = {
    /**
     * Register device token for supplier push notifications.
     * Backend: POST /api/v1/supplier-app/device-token/register
     */
    register: async (data: DeviceTokenData) => {
        return restApiClient.post(API_ENDPOINTS.SUPPLIER_DEVICE_TOKEN_REGISTER, data);
    },

    /**
     * Deregister device token on supplier logout.
     * Backend: POST /api/v1/supplier-app/device-token/unregister
     */
    unregister: async (token: string) => {
        return restApiClient.post(API_ENDPOINTS.SUPPLIER_DEVICE_TOKEN_UNREGISTER, { token });
    },
};
