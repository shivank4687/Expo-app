import api from '@/services/api/client';

export interface Review {
    id: number;
    rating: number;
    status: string;
    comment: string;
    customer_name: string;
    created_at: string;
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
 */
export const getReviews = async (
    page: number = 1,
    limit: number = 20
): Promise<ReviewsResponse> => {
    const response = await api.get<ReviewsResponse>('/supplier-app/reviews', {
        params: { page, limit },
    });
    return response;
};
