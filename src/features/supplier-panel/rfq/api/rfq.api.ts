import api from '@/services/api/client';

export type RFQStatus = 'new' | 'pending' | 'confirmed' | 'answered' | 'rejected' | 'expired';

export const RFQ_TABS: { key: RFQStatus; label: string }[] = [
    { key: 'new', label: 'New' },
    { key: 'pending', label: 'Pending' },
    { key: 'confirmed', label: 'Confirmed' },
    { key: 'answered', label: 'Answered' },
    { key: 'rejected', label: 'Rejected' },
    { key: 'expired', label: 'Expired' },
];

export interface QuoteItem {
    id: number;
    quote_id: number;
    product_id: number;
    product_name: string;
    customer_name: string;
    quantity: number;
    status: string;
    quote_status: string | null;
    created_at: string;
    image_url: string | null;
    has_file: boolean;
}

export interface RFQMeta {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    status: RFQStatus;
}

export interface RFQResponse {
    data: QuoteItem[];
    meta: RFQMeta;
}

/**
 * Fetch quote items for the authenticated supplier filtered by status tab.
 */
export const getQuotes = async (
    status: RFQStatus,
    page: number = 1,
    limit: number = 20
): Promise<RFQResponse> => {
    return api.get<RFQResponse>('/supplier-app/rfq', {
        params: { status, page, limit },
    });
};

export interface RFQDetailsResponse {
    data: {
        quote: any;
        customerQuote: any;
        productName: string;
        customerName: string;
        supplierName: string;
    };
}

export interface RFQSupplierQuotesResponse {
    data: {
        supplierQuotes: any[];
        supplierFirstQuote: any;
        supplierLastQuote: any;
    };
}

export interface RFQMessage {
    id: number;
    message: string;
    customer_id: number | null;
    supplier_id: number | null;
    created_at: string;
}

export interface RFQMessagesResponse {
    data: RFQMessage[];
}

export const getRFQDetails = async (quoteId: number, productId: number): Promise<RFQDetailsResponse> => {
    return api.get<RFQDetailsResponse>(`/supplier-app/rfq/${quoteId}/item/${productId}/details`);
};

export const getRFQQuotes = async (quoteId: number, productId: number): Promise<RFQSupplierQuotesResponse> => {
    return api.get<RFQSupplierQuotesResponse>(`/supplier-app/rfq/${quoteId}/item/${productId}/quotes`);
};

export const getRFQMessages = async (supplierQuoteId: number, customerQuoteId: number): Promise<RFQMessagesResponse> => {
    return api.get<RFQMessagesResponse>(`/supplier-app/rfq/messages/${supplierQuoteId}/${customerQuoteId}`);
};

export const sendRFQMessage = async (
    message: string,
    supplierQuoteId: number,
    customerQuoteId: number
): Promise<any> => {
    return api.post('/supplier-app/rfq/messages', {
        message,
        supplier_quote_item_id: supplierQuoteId,
        customer_quote_item_id: customerQuoteId,
    });
};

export interface SendQuotePayload {
    product_id: number;
    quantity: number;
    price_per_quantity: number;
    shipping_time: number;
    note: string;
    is_sample: 0 | 1;
    sample_unit?: number | null;
    is_sample_price?: 0 | 1;
    sample_price?: number | null;
}

export const sendRFQQuote = async (
    customerId: number,
    quoteId: number,
    data: SendQuotePayload
): Promise<any> => {
    return api.post(`/supplier-app/rfq/${customerId}/send-quote/${quoteId}`, data);
};

export const rejectRFQQuote = async (
    supplierQuoteId: number,
    customerQuoteId: number
): Promise<any> => {
    return api.post(`/supplier-app/rfq/reject/${supplierQuoteId}/${customerQuoteId}`);
};
