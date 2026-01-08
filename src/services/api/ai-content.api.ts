import apiClient from './client';

export interface AIGeneratedContent {
    description: string;
    short_description: string;
}

export interface AIContentResponse {
    success: boolean;
    data?: AIGeneratedContent;
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
};

export default aiContentApi;
