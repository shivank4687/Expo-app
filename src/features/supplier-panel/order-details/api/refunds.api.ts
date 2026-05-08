import api from '@/services/api/client';

export interface RefundTotalsRequest {
    refund: {
        items: Record<number, number>;
        shipping: number;
        adjustment_refund: number;
        adjustment_fee: number;
    };
}

export interface RefundTotalsResponse {
    success: boolean;
    data: {
        subtotal: { price: number; formatted_price: string };
        discount: { price: number; formatted_price: string };
        tax: { price: number; formatted_price: string };
        shipping: { price: number; formatted_price: string };
        grand_total: { price: number; formatted_price: string };
    };
    message?: string;
}

export interface CreateRefundResponse {
    success: boolean;
    message: string;
    data?: {
        refund_id: number;
    };
}

export const calculateRefundTotals = async (
    supplierOrderId: number,
    payload: RefundTotalsRequest
): Promise<RefundTotalsResponse> => {
    const response = await api.post<RefundTotalsResponse>(
        `/supplier-app/orders/${supplierOrderId}/refunds/calculate`,
        payload
    );
    return response;
};

export const createRefund = async (
    supplierOrderId: number,
    payload: RefundTotalsRequest
): Promise<CreateRefundResponse> => {
    const response = await api.post<CreateRefundResponse>(
        `/supplier-app/orders/${supplierOrderId}/refunds`,
        payload
    );
    return response;
};
