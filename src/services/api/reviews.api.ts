import { restApiClient } from './client';
import { API_ENDPOINTS } from '@/config/constants';
import { ProductReview, SubmitReviewPayload, ReviewsResponse } from '@/features/product/types/review.types';

/**
 * Product Reviews API Service
 */

export const reviewsApi = {
    /**
     * Get reviews for a product
     */
    async getProductReviews(productId: number, page: number = 1): Promise<any> {
        const url = `${API_ENDPOINTS.PRODUCTS}/${productId}/reviews?page=${page}`;
        const response = await restApiClient.get<any>(url);
        console.log('📦 Raw reviews API response:', response);
        return response;
    },

    /**
     * Submit a product review (requires authentication)
     */
    async submitReview(productId: number, payload: SubmitReviewPayload): Promise<{ data: ProductReview; message: string }> {
        const url = `${API_ENDPOINTS.PRODUCTS}/${productId}/reviews`;
        
        // Create FormData for file uploads
        const formData = new FormData();
        formData.append('title', payload.title);
        formData.append('comment', payload.comment);
        formData.append('rating', payload.rating.toString());
        
        // Add attachments if any
        // In React Native, attachments are objects with { uri, type, name }
        if (payload.attachments && payload.attachments.length > 0) {
            payload.attachments.forEach((file, index) => {
                // Handle both React Native format { uri, type, name } and standard File objects
                if (file && typeof file === 'object' && 'uri' in file) {
                    // React Native format
                    formData.append(`attachments[${index}]`, file as any);
                } else {
                    // Standard File object
                    formData.append(`attachments[${index}]`, file as any);
                }
            });
        }
        
        const response = await restApiClient.post<{ data: ProductReview; message: string }>(url, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        
        return response;
    },
};

export default reviewsApi;

