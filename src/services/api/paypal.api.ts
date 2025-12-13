/**
 * PayPal Smart Button API Service
 * Handles PayPal Smart Button payment-related API calls
 */

import { restApiClient } from './client';

interface PaypalCreateOrderResponse {
    success: boolean;
    data?: {
        order_id: string;
        approval_url: string;
    };
    message?: string;
}

interface PaypalCaptureOrderResponse {
    success: boolean;
    data?: {
        order: {
            id: number;
            increment_id: string;
            [key: string]: any;
        };
    };
    message?: string;
}

/**
 * PayPal Smart Button API endpoints
 */
export const paypalApi = {
    /**
     * Create PayPal order
     * Returns approval URL for WebView
     */
    createOrder: async (): Promise<PaypalCreateOrderResponse> => {
        try {
            const response = await restApiClient.post<PaypalCreateOrderResponse>(
                '/customer/paypal/smart-button/create-order'
            );
            return response;
        } catch (error: any) {
            console.error('[paypal.api] Create order error:', error);
            throw new Error(error.response?.data?.message || error.message || 'Failed to create PayPal order');
        }
    },

    /**
     * Capture PayPal order after approval
     * Returns order data
     */
    captureOrder: async (orderId: string): Promise<PaypalCaptureOrderResponse> => {
        try {
            const response = await restApiClient.post<PaypalCaptureOrderResponse>(
                '/customer/paypal/smart-button/capture-order',
                { order_id: orderId }
            );
            return response;
        } catch (error: any) {
            console.error('[paypal.api] Capture order error:', error);
            
            // Extract detailed error message from PayPal response
            let errorMessage = 'Failed to capture PayPal order';
            
            if (error.response?.data) {
                const errorData = error.response.data;
                
                // Handle PayPal API error format
                if (errorData.details && Array.isArray(errorData.details) && errorData.details.length > 0) {
                    errorMessage = errorData.details[0].description || errorData.message || errorMessage;
                } else if (errorData.message) {
                    errorMessage = errorData.message;
                } else if (typeof errorData === 'string') {
                    // Sometimes PayPal returns error as string
                    try {
                        const parsedError = JSON.parse(errorData);
                        if (parsedError.details && Array.isArray(parsedError.details) && parsedError.details.length > 0) {
                            errorMessage = parsedError.details[0].description || parsedError.message || errorMessage;
                        } else if (parsedError.message) {
                            errorMessage = parsedError.message;
                        }
                    } catch {
                        errorMessage = errorData;
                    }
                }
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            throw new Error(errorMessage);
        }
    },
};

