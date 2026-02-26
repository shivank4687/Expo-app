export interface NotificationItem {
    id: number;
    title: string;
    message: string | null;
    type: string;
    subtype: string | null;
    action_url: string | null;
    supplier_read: number;
    order_id: number | null;
    created_at: string;
    updated_at: string;
    order?: any;
    formatted_created_at?: string;
}

export interface NotificationsUnreadCounts {
    total: number;
    orders: number;
    identity: number;
}

export interface NotificationsData {
    order_notifications: {
        current_page: number;
        data: NotificationItem[];
        total: number;
        per_page: number;
        last_page: number;
    };
    rfq_notifications: NotificationItem[];
    identity_notifications: NotificationItem[];
    unread_counts: NotificationsUnreadCounts;
}

export interface NotificationsResponse {
    data: NotificationsData;
    message: string;
}

export interface MarkAllReadResponse {
    success: boolean;
    message: string;
    unread_counts: NotificationsUnreadCounts;
}

export interface MarkRfqReadResponse {
    success: boolean;
    message: string;
}
