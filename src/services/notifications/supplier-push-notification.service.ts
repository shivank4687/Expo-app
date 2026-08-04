import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { router } from 'expo-router';
import { supplierDeviceTokenApi } from '../api/supplier-device-token.api';
import Constants from 'expo-constants';

const EXPO_PROJECT_ID = Constants.expoConfig?.extra?.eas?.projectId ?? 
    Constants.easConfig?.projectId ?? 
    'c700ef87-1bf1-4c01-ba8a-5164822dca55';

/**
 * Supplier Push Notification Service
 *
 * Handles push notifications for the SUPPLIER PANEL only.
 * - Registers tokens against the supplier user_type in expo_device_tokens
 *   via /api/v1/supplier-app/device-token/register
 * - Handles navigation on notification tap to supplier-panel screens
 *
 * Kept intentionally separate from the customer ExpoPushNotificationService
 * so supplier and customer push flows don't interfere with each other.
 */
class SupplierPushNotificationService {
    private notificationListener: any;
    private responseListener: any;

    /**
     * Get the Expo push token for this device.
     * Returns null if on emulator or permissions denied.
     */
    async initialize(): Promise<string | null> {
        if (!Device.isDevice) {
            console.log('[Supplier Push] Physical device required for push notifications');
            return null;
        }

        try {
            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            let finalStatus = existingStatus;

            if (existingStatus !== 'granted') {
                const { status } = await Notifications.requestPermissionsAsync();
                finalStatus = status;
            }

            if (finalStatus !== 'granted') {
                console.log('[Supplier Push] Permission not granted');
                return null;
            }

            const tokenData = await Notifications.getExpoPushTokenAsync({
                projectId: EXPO_PROJECT_ID,
            });

            return tokenData.data;
        } catch (error) {
            console.error('[Supplier Push] Error getting push token:', error);
            return null;
        }
    }

    /**
     * Register device token as a SUPPLIER token after supplier login.
     * Hits /api/v1/supplier-app/device-token/register so backend
     * stores it with user_type = 'supplier'.
     */
    async registerToken(): Promise<boolean> {
        try {
            const token = await this.initialize();

            if (!token) {
                return false;
            }

            await supplierDeviceTokenApi.register({
                token,
                device_name: Device.deviceName || 'Unknown Device',
                app_version: '1.0.0',
            });

            console.log('[Supplier Push] Device token registered successfully (supplier)');
            return true;
        } catch (error) {
            console.error('[Supplier Push] Failed to register device token:', error);
            return false;
        }
    }

    /**
     * Deregister device token on supplier logout.
     */
    async unregisterToken(): Promise<boolean> {
        try {
            const tokenData = await Notifications.getExpoPushTokenAsync({
                projectId: EXPO_PROJECT_ID,
            });

            await supplierDeviceTokenApi.unregister(tokenData.data);

            console.log('[Supplier Push] Device token unregistered (supplier)');
            return true;
        } catch (error) {
            console.error('[Supplier Push] Failed to unregister device token:', error);
            return false;
        }
    }

    /**
     * Attach system-level push notification listeners for the supplier panel.
     * Call this once after supplier logs in (or inside supplier layout).
     */
    setupNotificationHandlers(): void {
        // Foreground: notification received
        this.notificationListener = Notifications.addNotificationReceivedListener(notification => {
            const data = notification.request.content.data;
            console.log('[Supplier Push] Notification received in foreground:', data);
        });

        // Tap on notification: navigate to the right supplier screen
        this.responseListener = Notifications.addNotificationResponseReceivedListener(response => {
            const data = response.notification.request.content.data;
            console.log('[Supplier Push] Notification tapped:', data);
            this.handleNotificationNavigation(data);
        });
    }

    /**
     * Navigate to the relevant supplier-panel screen based on notification type.
     *
     * Notification types sent from the Laravel backend:
     *   identity_verification   → approved / rejected by admin
     *   supplier_order_new      → new order assigned to supplier
     *   supplier_order_updated  → existing order status changed
     *   rfq / quote_status      → RFQ-related events
     *   message                 → chat message
     */
    private handleNotificationNavigation(data: any): void {
        try {
            switch (data?.type) {
                // Identity verification approved / rejected
                case 'identity_verification':
                    router.push('/(supplier-drawer)/notifications' as any);
                    break;

                // New order for supplier
                case 'supplier_order_new':
                    if (data.supplier_order_id) {
                        router.push(`/(supplier-drawer)/order-details/${data.supplier_order_id}` as any);
                    } else {
                        router.push('/(supplier-drawer)/notifications' as any);
                    }
                    break;

                // Order status updated
                case 'supplier_order_updated':
                    if (data.supplier_order_id) {
                        router.push(`/(supplier-drawer)/order-details/${data.supplier_order_id}` as any);
                    } else {
                        router.push('/(supplier-drawer)/notifications' as any);
                    }
                    break;

                // RFQ received / quote status changed
                case 'rfq':
                case 'quote_status':
                case 'rfq_new_message':
                    router.push('/(supplier-drawer)/notifications' as any);
                    break;

                // Chat / order message
                case 'message':
                    router.push('/(supplier-drawer)/notifications' as any);
                    break;

                default:
                    console.log('[Supplier Push] Unknown type, going to notifications:', data?.type);
                    router.push('/(supplier-drawer)/notifications' as any);
            }
        } catch (error) {
            console.error('[Supplier Push] Navigation error:', error);
        }
    }

    /**
     * Remove listeners – call on supplier logout or component unmount.
     */
    cleanup(): void {
        if (this.notificationListener) {
            this.notificationListener.remove();
            this.notificationListener = null;
        }
        if (this.responseListener) {
            this.responseListener.remove();
            this.responseListener = null;
        }
    }
}

export const supplierPushNotificationService = new SupplierPushNotificationService();
