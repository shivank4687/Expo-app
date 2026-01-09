import { restApiClient } from '@/services/api/client';
import type { MessageThread, ThreadDetails, SendMessageResponse } from '../types/messages.types';

/**
 * Supplier Messages API Client
 */

export const messagesApi = {
    /**
     * Get list of message threads (customer conversations)
     * Requires supplier authentication
     */
    async getMessageThreads(): Promise<{ data: MessageThread[] }> {
        const response = await restApiClient.get<{ data: MessageThread[] }>(
            '/supplier-app/messages'
        );

        return response;
    },

    /**
     * Get messages for a specific thread
     * Requires supplier authentication
     */
    async getThreadMessages(threadId: number): Promise<{ data: ThreadDetails }> {
        const response = await restApiClient.get<{ data: ThreadDetails }>(
            `/supplier-app/messages/${threadId}`
        );

        return response;
    },

    /**
     * Send message in a thread
     * Requires supplier authentication
     */
    async sendMessage(threadId: number, message: string): Promise<SendMessageResponse> {
        const response = await restApiClient.post<SendMessageResponse>(
            `/supplier-app/messages/${threadId}`,
            { message }
        );

        return response;
    },
};
