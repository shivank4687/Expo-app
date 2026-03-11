import { restApiClient } from '@/services/api/client';
import { API_ENDPOINTS } from '@/config/constants';
import {
    NotificationsResponse,
    MarkAllReadResponse,
    MarkRfqReadResponse
} from '../types/notifications.types';

export const notificationsApi = {
    /**
     * Fetch all notifications grouped by type
     * @param limit Number of items per page for order notifications
     * @returns Grouped notifications and unread counts
     */
    async getNotifications(limit = 10): Promise<NotificationsResponse['data']> {
        // restApiClient.get() already returns response.data (the full body)
        // So body structure is: { data: { order_notifications, ... }, message: "..." }
        // We call .data once more to get the inner payload
        const body = await restApiClient.get<NotificationsResponse>(
            API_ENDPOINTS.SUPPLIER_NOTIFICATIONS,
            { params: { limit } }
        );
        return body.data;
    },

    /**
     * Mark all notifications as read
     * @returns Updated unread counts (all 0)
     */
    async markAllAsRead(): Promise<MarkAllReadResponse> {
        const response = await restApiClient.post<MarkAllReadResponse>(
            API_ENDPOINTS.SUPPLIER_NOTIFICATIONS_MARK_ALL_READ
        );
        // restApiClient.post() already unwraps response.data, so 'response' IS MarkAllReadResponse
        return response;
    },

    /**
     * Mark a specific RFQ / identity notification as read (supplier_notifications table)
     * @param id The notification ID
     */
    async markRfqAsRead(id: number): Promise<MarkRfqReadResponse> {
        const url = API_ENDPOINTS.SUPPLIER_NOTIFICATIONS_MARK_RFQ_READ.replace(':id', id.toString());
        const response = await restApiClient.post<MarkRfqReadResponse>(url);
        // restApiClient.post() already unwraps response.data, so 'response' IS MarkRfqReadResponse
        return response;
    },

    /**
     * Mark a specific order notification as read (notifications table)
     * @param id The notification ID
     */
    async markOrderAsRead(id: number): Promise<MarkRfqReadResponse> {
        const url = API_ENDPOINTS.SUPPLIER_NOTIFICATIONS_MARK_ORDER_READ.replace(':id', id.toString());
        const response = await restApiClient.post<MarkRfqReadResponse>(url);
        return response;
    },
};

