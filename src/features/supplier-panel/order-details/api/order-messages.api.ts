import api from '@/services/api/client';

export interface OrderMessage {
    id: number;
    message: string;
    sender_type: 'customer' | 'supplier';
    sender_name: string;
    is_read: boolean;
    attachments: string[] | null;
    created_at: string;
}

export interface OrderMessagesResponse {
    data: OrderMessage[];
    unread_count: number;
}

export interface SendMessageRequest {
    message: string;
}

export interface SendMessageResponse {
    message: string;
    data: {
        id: number;
        message: string;
        sender_type: string;
        created_at: string;
    };
}

/**
 * Get all messages for a specific order
 * @param supplierOrderId - The supplier order ID
 */
export const getOrderMessages = async (supplierOrderId: number): Promise<OrderMessagesResponse> => {
    const response = await api.get<OrderMessagesResponse>(`/supplier-app/orders/${supplierOrderId}/messages`);
    return response;
};

/**
 * Send a new message for an order
 * @param supplierOrderId - The supplier order ID
 * @param data - Message data
 */
export const sendOrderMessage = async (
    supplierOrderId: number,
    data: SendMessageRequest
): Promise<SendMessageResponse> => {
    const response = await api.post<SendMessageResponse>(`/supplier-app/orders/${supplierOrderId}/messages`, data);
    return response;
};

/**
 * Mark a specific message as read
 * @param supplierOrderId - The supplier order ID
 * @param messageId - The message ID
 */
export const markMessageAsRead = async (supplierOrderId: number, messageId: number): Promise<void> => {
    await api.post(`/supplier-app/orders/${supplierOrderId}/messages/${messageId}/read`);
};

/**
 * Mark all messages as read for an order
 * @param supplierOrderId - The supplier order ID
 */
export const markAllMessagesAsRead = async (supplierOrderId: number): Promise<void> => {
    await api.post(`/supplier-app/orders/${supplierOrderId}/messages/read-all`);
};
