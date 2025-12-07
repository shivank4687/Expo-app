import { restApiClient } from './client';
import { API_ENDPOINTS } from '@/config/constants';

/**
 * B2B Marketplace Suppliers API Service
 */

export interface SendMessagePayload {
    supplier_id: number;
    message: string;
    customer_id?: number; // Optional, will be set from auth context
}

export interface SendMessageResponse {
    success: boolean;
    message: string;
}

export interface MessageThread {
    id: number;
    supplier_id: number;
    supplier_name: string;
    supplier_company_name: string;
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
    supplier_id: number;
    supplier_name: string;
    supplier_company_name: string;
    messages: ChatMessage[];
}

export interface SendThreadMessageResponse {
    data: {
        id: number;
        message: string;
        role: string;
        created_at: string;
    };
    message: string;
}

export const suppliersApi = {
    /**
     * Send message to supplier (creates new thread if doesn't exist)
     * Requires authentication
     */
    async sendMessageToSupplier(payload: SendMessagePayload): Promise<SendMessageResponse> {
        const response = await restApiClient.post<SendMessageResponse>(
            API_ENDPOINTS.MESSAGE_SUPPLIER,
            payload
        );
        
        return response;
    },

    /**
     * Get list of message threads (supplier chat listing)
     * Requires authentication
     */
    async getMessageThreads(): Promise<{ data: MessageThread[] }> {
        const response = await restApiClient.get<{ data: MessageThread[] }>(
            '/supplier/messages'
        );
        
        return response;
    },

    /**
     * Get messages for a specific thread
     * Requires authentication
     */
    async getThreadMessages(threadId: number): Promise<{ data: ThreadDetails }> {
        const response = await restApiClient.get<{ data: ThreadDetails }>(
            `/supplier/messages/${threadId}`
        );
        
        return response;
    },

    /**
     * Send message in a thread
     * Requires authentication
     */
    async sendThreadMessage(threadId: number, message: string): Promise<SendThreadMessageResponse> {
        const response = await restApiClient.post<SendThreadMessageResponse>(
            `/supplier/messages/${threadId}`,
            { message }
        );
        
        return response;
    },
};

export default suppliersApi;

