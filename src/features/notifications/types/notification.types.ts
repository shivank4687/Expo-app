export interface Notification {
    id: number;
    type: 'order' | 'message';
    subtype?: string;
    title: string;
    message: string;
    data?: any;
    action_url?: string;
    read_at: string | null;
    created_at: string;
}

export interface NotificationResponse {
    data: {
        order_notifications: Notification[];
        customer_notifications: Notification[];
        order_pagination: {
            current_page: number;
            last_page: number;
            total: number;
            per_page: number;
        };
        customer_pagination: {
            current_page: number;
            last_page: number;
            total: number;
            per_page: number;
        };
        total_unread: number;
        order_unread: number;
        customer_unread: number;
    };
}

export interface UnreadCountResponse {
    data: {
        total_unread: number;
        order_unread: number;
        customer_unread: number;
    };
}
