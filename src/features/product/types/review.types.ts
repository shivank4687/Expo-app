/**
 * Product Review Types
 */

export interface ProductReview {
    id: number;
    product_id: number;
    customer_id: number;
    name: string;
    title: string;
    comment: string;
    rating: number;
    status: 'approved' | 'pending' | 'disapproved';
    created_at: string;
    updated_at: string;
    images?: ReviewAttachment[];
    profile?: string; // Customer profile image
}

export interface ReviewAttachment {
    id: number;
    type: 'image' | 'video';
    url: string;
    path: string;
    mime_type?: string;
}

export interface SubmitReviewPayload {
    title: string;
    comment: string;
    rating: number;
    attachments?: File[] | any[];
}

export interface ReviewsResponse {
    data: ProductReview[];
    links: {
        first: string;
        last: string;
        prev: string | null;
        next: string | null;
    };
    meta: {
        current_page: number;
        from: number;
        last_page: number;
        per_page: number;
        to: number;
        total: number;
    };
}

