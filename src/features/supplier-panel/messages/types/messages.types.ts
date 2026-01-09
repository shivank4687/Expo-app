/**
 * Message Thread Types
 */

export interface MessageThread {
    id: number;
    customer_id: number;
    customer_name: string;
    customer_email: string | null;
    last_message: string;
    last_message_role: 'customer' | 'supplier';
    unread_count: number;
    updated_at: string;
    created_at: string;
}

export interface ChatMessage {
    id: number;
    message: string;
    role: 'customer' | 'supplier';
    msg_type: string;
    is_new: boolean;
    created_at: string;
}

export interface ThreadDetails {
    thread_id: number;
    customer_id: number;
    customer_name: string;
    customer_email: string | null;
    messages: ChatMessage[];
}

export interface SendMessageResponse {
    data: {
        id: number;
        message: string;
        role: string;
        created_at: string;
    };
    message: string;
}
