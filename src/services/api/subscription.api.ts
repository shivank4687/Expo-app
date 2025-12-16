import { apiClient } from './client';

export const subscriptionApi = {
    subscribe: async (email: string) => {
        const response = await apiClient.post('/customer/subscription', { email });

        return response;
    },
};
