/**
 * Notifications API Service
 * Handles all notification-related API calls
 * Uses REST API v1 endpoints (/api/v1/customer/notifications) with Bearer token authentication
 */

import { restApiClient } from './client';
import { Notification, NotificationResponse, UnreadCountResponse } from '@/features/notifications/types/notification.types';

/**
 * Notifications API endpoints
 */
export const notificationsApi = {
    /**
     * Get all notifications for the authenticated customer
     */
    getNotifications: async (page: number = 1, perPage: number = 10): Promise<NotificationResponse> => {
        try {
            const response = await restApiClient.get<NotificationResponse>(
                `/customer/notifications?page=${page}&per_page=${perPage}`
            );
            return response;
        } catch (error: any) {
            // Don't throw on 401 - just return empty data
            if (error.response?.status === 401) {
                console.log('Notifications API: Not authenticated, returning empty data');
                return {
                    data: {
                        order_notifications: [],
                        customer_notifications: [],
                        order_pagination: {
                            current_page: 1,
                            last_page: 1,
                            total: 0,
                            per_page: 10,
                        },
                        customer_pagination: {
                            current_page: 1,
                            last_page: 1,
                            total: 0,
                            per_page: 10,
                        },
                        total_unread: 0,
                        order_unread: 0,
                        customer_unread: 0,
                    }
                };
            }
            console.error('Get notifications error:', error);
            throw new Error(error.response?.data?.message || error.message || 'Failed to fetch notifications');
        }
    },

    /**
     * Get unread notification count
     */
    getUnreadCount: async (): Promise<UnreadCountResponse> => {
        try {
            const response = await restApiClient.get<UnreadCountResponse>('/customer/notifications/unread-count');
            return response;
        } catch (error: any) {
            // Don't throw on 401 - just return zero counts
            if (error.response?.status === 401) {
                console.log('Unread count API: Not authenticated, returning zero');
                return {
                    data: {
                        total_unread: 0,
                        order_unread: 0,
                        customer_unread: 0,
                    }
                };
            }
            console.error('Get unread count error:', error);
            throw new Error(error.response?.data?.message || error.message || 'Failed to fetch unread count');
        }
    },

    /**
     * Mark a single notification as read
     */
    markAsRead: async (id: number): Promise<void> => {
        try {
            await restApiClient.post(`/customer/notifications/${id}/read`);
        } catch (error: any) {
            // Silently fail on 401
            if (error.response?.status === 401) {
                console.log('Mark as read: Not authenticated');
                return;
            }
            console.error('Mark as read error:', error);
            throw new Error(error.response?.data?.message || error.message || 'Failed to mark notification as read');
        }
    },

    /**
     * Mark a single order notification as read
     */
    markOrderAsRead: async (id: number): Promise<void> => {
        try {
            await restApiClient.post(`/customer/notifications/order/${id}/read`);
        } catch (error: any) {
            // Silently fail on 401
            if (error.response?.status === 401) {
                console.log('Mark order as read: Not authenticated');
                return;
            }
            console.error('Mark order as read error:', error);
            throw new Error(error.response?.data?.message || error.message || 'Failed to mark order notification as read');
        }
    },

    /**
     * Mark all notifications as read
     */
    markAllAsRead: async (): Promise<void> => {
        try {
            await restApiClient.post('/customer/notifications/read-all');
        } catch (error: any) {
            // Silently fail on 401
            if (error.response?.status === 401) {
                console.log('Mark all as read: Not authenticated');
                return;
            }
            console.error('Mark all as read error:', error);
            throw new Error(error.response?.data?.message || error.message || 'Failed to mark all as read');
        }
    },
};
