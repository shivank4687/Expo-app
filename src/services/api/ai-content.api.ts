import apiClient from './client';

export interface AIGeneratedContent {
    description: string;
    short_description: string;
}

export interface AIShopPolicies {
    shipping_policy: string;
    privacy_policy: string;
    return_policy: string;
}

export interface AIContentResponse {
    success: boolean;
    data?: AIGeneratedContent;
    message?: string;
}

export interface AIPoliciesResponse {
    success: boolean;
    data?: AIShopPolicies;
    message?: string;
}

const aiContentApi = {
    /**
     * Generate AI content for product based on prompt
     * @param prompt - Product name or brief description
     * @returns Generated description and short_description
     */
    generateProductContent: async (prompt: string): Promise<AIGeneratedContent> => {
        const response = await apiClient.post<AIContentResponse>(
            'supplier-app/products/generate-content',
            { prompt }
        );

        if (response.success && response.data) {
            return response.data;
        }

        throw new Error(response.message || 'Failed to generate content');
    },

    /**
     * Generate AI shop policies based on prompt
     * @param prompt - Shop description or brief detail
     * @returns Generated shipping, privacy, and return policies
     */
    generateShopPolicies: async (prompt: string): Promise<AIShopPolicies> => {
        const response = await apiClient.post<AIPoliciesResponse>(
            'supplier-app/profile/generate-policies',
            { prompt }
        );

        if (response.success && response.data) {
            return response.data;
        }

        throw new Error(response.message || 'Failed to generate policies');
    },
};

export default aiContentApi;
