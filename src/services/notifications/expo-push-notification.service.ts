import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { deviceTokenApi } from '../api/device-token.api';
import { router } from 'expo-router';

/**
 * Configure how notifications are handled when app is in foreground
 */
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

class ExpoPushNotificationService {
    private notificationListener: any;
    private responseListener: any;

    /**
     * Initialize push notifications and request permissions
     */
    async initialize(): Promise<string | null> {
        if (!Device.isDevice) {
            console.log('Push notifications only work on physical devices');
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
                console.log('Failed to get push token for push notification!');
                return null;
            }

            const tokenData = await Notifications.getExpoPushTokenAsync({
                projectId: 'your-expo-project-id', // Replace with your Expo project ID
            });

            return tokenData.data;
        } catch (error) {
            console.error('Error getting push token:', error);
            return null;
        }
    }

    /**
     * Register device token with backend after login
     */
    async registerToken(): Promise<boolean> {
        try {
            const token = await this.initialize();

            if (!token) {
                return false;
            }

            await deviceTokenApi.register({
                token,
                device_name: Device.deviceName || 'Unknown Device',
                app_version: '1.0.0', // You can get this from app.json or Constants
            });

            console.log('Device token registered successfully');
            return true;
        } catch (error) {
            console.error('Failed to register device token:', error);
            return false;
        }
    }

    /**
     * Unregister device token on logout
     */
    async unregisterToken(): Promise<boolean> {
        try {
            const tokenData = await Notifications.getExpoPushTokenAsync({
                projectId: 'your-expo-project-id', // Replace with your Expo project ID
            });

            await deviceTokenApi.unregister(tokenData.data);

            console.log('Device token unregistered successfully');
            return true;
        } catch (error) {
            console.error('Failed to unregister device token:', error);
            return false;
        }
    }

    /**
     * Setup notification event listeners
     */
    setupNotificationHandlers(): void {
        // Handle notifications received while app is in foreground
        this.notificationListener = Notifications.addNotificationReceivedListener(notification => {
            console.log('Notification received:', notification);
            // You can show a custom in-app notification here if needed
        });

        // Handle notification tap/interaction
        this.responseListener = Notifications.addNotificationResponseReceivedListener(response => {
            console.log('Notification tapped:', response);
            const data = response.notification.request.content.data;
            this.handleNotificationNavigation(data);
        });
    }

    /**
     * Handle navigation based on notification type
     */
    private handleNotificationNavigation(data: any): void {
        try {
            switch (data.type) {
                case 'order_created':
                case 'order_canceled':
                case 'order_invoiced':
                case 'order_shipped':
                case 'feedback_request':
                    // Navigate to order detail screen
                    if (data.order_id) {
                        router.push(`/(tabs)/orders/${data.order_id}` as any);
                    }
                    break;

                case 'supplier_order_new':
                case 'supplier_order_updated':
                    // Navigate to supplier order detail (if you have supplier app)
                    if (data.supplier_order_id) {
                        router.push(`/supplier/orders/${data.supplier_order_id}` as any);
                    }
                    break;

                default:
                    console.log('Unknown notification type:', data.type);
            }
        } catch (error) {
            console.error('Error navigating from notification:', error);
        }
    }

    /**
     * Clean up listeners
     */
    cleanup(): void {
        if (this.notificationListener) {
            this.notificationListener.remove();
        }
        if (this.responseListener) {
            this.responseListener.remove();
        }
    }

    /**
     * Get current notification permissions status
     */
    async getPermissionStatus(): Promise<string> {
        const { status } = await Notifications.getPermissionsAsync();
        return status;
    }

    /**
     * Schedule a local notification (for testing)
     */
    async scheduleLocalNotification(title: string, body: string, data: any = {}): Promise<void> {
        await Notifications.scheduleNotificationAsync({
            content: {
                title,
                body,
                data,
                sound: true,
            },
            trigger: null, // Show immediately
        });
    }
}

export const expoPushNotificationService = new ExpoPushNotificationService();
