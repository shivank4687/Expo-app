/**
 * Stripe Connect API Service
 * Handles Stripe Connect payment-related API calls
 */

import { restApiClient } from './client';
import { Order } from './orders.api';

interface StripeConnectSuccessResponse {
    success: boolean;
    data: {
        order: Order;
    };
    message: string;
}

/**
 * Stripe Connect API endpoints
 */
export const stripeConnectApi = {
    /**
     * Process Stripe Connect payment success callback
     * @param sessionId Stripe Checkout Session ID
     */
    processSuccess: async (sessionId: string): Promise<StripeConnectSuccessResponse> => {
        try {
            console.log('[stripeconnect.api] Processing success with session_id:', sessionId);
            // restApiClient.post already returns response.data, so we get the direct response
            const response = await restApiClient.post<StripeConnectSuccessResponse>(
                '/customer/stripeconnect/success',
                { session_id: sessionId }
            );
            
            console.log('[stripeconnect.api] API response:', JSON.stringify(response, null, 2));
            console.log('[stripeconnect.api] Response structure:', {
                hasSuccess: 'success' in response,
                success: response.success,
                hasData: 'data' in response,
                hasOrder: !!(response.data?.order),
                orderId: response.data?.order?.id
            });
            
            // Response is already the data object from axios (response.data was already extracted)
            // So response should be: { success: true, data: { order: {...} }, message: "..." }
            return response;
        } catch (error: any) {
            console.error('[stripeconnect.api] Error processing success:', error);
            console.error('[stripeconnect.api] Error details:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status,
                statusText: error.response?.statusText
            });
            throw new Error(error.response?.data?.message || error.message || 'Failed to process payment success');
        }
    },
};
