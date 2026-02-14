import api from '@/services/api/client';

export interface Transaction {
    id: number;
    transaction_id: string;
    comment: string;
    base_total: string;
    supplier_name: string;
    created_at: string;
}

export interface TransactionsResponse {
    data: Transaction[];
    meta: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
}

/**
 * Get transactions list with pagination
 * @param page - Page number
 * @param limit - Items per page
 */
export const getTransactions = async (
    page: number = 1,
    limit: number = 20
): Promise<TransactionsResponse> => {
    const response = await api.get<TransactionsResponse>('/supplier-app/transactions', {
        params: { page, limit },
    });
    return response;
};
