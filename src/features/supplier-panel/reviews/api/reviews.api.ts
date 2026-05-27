import api from '@/services/api/client';

export interface Review {
    id: number;
    rating: number;
    status: string;
    comment: string;
    customer_name: string;
    created_at: string;
    product_name?: string;
    title?: string;
    reply_text?: string | null;
    reply_by?: string | null;
}

export interface ReviewsResponse {
    data: Review[];
    meta: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
}

/**
 * Get reviews list with pagination
 * @param page - Page number
 * @param limit - Items per page
 * @param type - Type of review ('company' or 'product')
 */
export const getReviews = async (
    page: number = 1,
    limit: number = 20,
    type: 'company' | 'product' = 'company'
): Promise<ReviewsResponse> => {
    const response = await api.get<ReviewsResponse>('/supplier-app/reviews', {
        params: { page, limit, type },
    });
    return response;
};

interface SubmitReplyResponse {
    message: string;
    reply_text: string;
    reply_by: string;
}

/**
 * Submit or update a supplier reply to a product review
 * @param reviewId - ID of the product review
 * @param replyText - Reply content text
 */
export const submitReviewReply = async (
    reviewId: number,
    replyText: string
): Promise<SubmitReplyResponse> => {
    const response = await api.post<SubmitReplyResponse>(`/supplier-app/reviews/${reviewId}/reply`, {
        reply_text: replyText,
    });
    return response;
};
