import { restApiClient } from './client';

interface PayPalDetailsResponse {
    success: boolean;
    data: {
        paypal_email: string | null;
    };
    message?: string;
}

interface SavePayPalResponse {
    success: boolean;
    message: string;
}

export const supplierPaymentAccountApi = {
    /**
     * Fetch the stored PayPal payout identifier for the authenticated supplier.
     */
    getPayPal: async (): Promise<PayPalDetailsResponse> => {
        try {
            return await restApiClient.get<PayPalDetailsResponse>('/supplier-app/payment-accounts/paypal');
        } catch (error: any) {
            console.error('[supplierPaymentAccount.api] Failed to fetch PayPal details:', error);
            throw new Error(error.response?.data?.message || 'Failed to fetch PayPal details');
        }
    },

    /**
     * Save the PayPal payout identifier for the authenticated supplier.
     */
    savePayPal: async (paypalEmail: string): Promise<SavePayPalResponse> => {
        try {
            return await restApiClient.post<SavePayPalResponse>('/supplier-app/payment-accounts/paypal', {
                paypal_email: paypalEmail,
            });
        } catch (error: any) {
            console.error('[supplierPaymentAccount.api] Failed to save PayPal details:', error);
            throw new Error(error.response?.data?.message || 'Failed to save PayPal details');
        }
    },
};
