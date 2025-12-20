import { restApiClient } from './client';
import { API_ENDPOINTS } from '@/config/constants';
import { Product } from '@/features/product/types/product.types';
import { PaginatedResponse } from '@/types/global.types';

/**
 * B2B Marketplace Suppliers API Service
 */

export interface SendMessagePayload {
    supplier_id: number;
    message: string;
    customer_id?: number; // Optional, will be set from auth context
}

export interface SendMessageResponse {
    success: boolean;
    message: string;
}

export interface MessageThread {
    id: number;
    supplier_id: number;
    supplier_name: string;
    supplier_company_name: string;
    last_message: string;
    last_message_role: 'customer' | 'supplier';
    unread_count: number;
    updated_at: string;
    created_at: string;
}

export interface ChatMessage {
    id: number;
    message: string;
    role: 'customer' | 'supplier';
    msg_type: string;
    is_new: boolean;
    created_at: string;
}

export interface ThreadDetails {
    thread_id: number;
    supplier_id: number;
    supplier_name: string;
    supplier_company_name: string;
    messages: ChatMessage[];
}

export interface SendThreadMessageResponse {
    data: {
        id: number;
        message: string;
        role: string;
        created_at: string;
    };
    message: string;
}

export const suppliersApi = {
    /**
     * Send message to supplier (creates new thread if doesn't exist)
     * Requires authentication
     */
    async sendMessageToSupplier(payload: SendMessagePayload): Promise<SendMessageResponse> {
        const response = await restApiClient.post<SendMessageResponse>(
            API_ENDPOINTS.MESSAGE_SUPPLIER,
            payload
        );

        return response;
    },

    /**
     * Get list of message threads (supplier chat listing)
     * Requires authentication
     */
    async getMessageThreads(): Promise<{ data: MessageThread[] }> {
        const response = await restApiClient.get<{ data: MessageThread[] }>(
            '/supplier/messages'
        );

        return response;
    },

    /**
     * Get messages for a specific thread
     * Requires authentication
     */
    async getThreadMessages(threadId: number): Promise<{ data: ThreadDetails }> {
        const response = await restApiClient.get<{ data: ThreadDetails }>(
            `/supplier/messages/${threadId}`
        );

        return response;
    },

    /**
     * Send message in a thread
     * Requires authentication
     */
    async sendThreadMessage(threadId: number, message: string): Promise<SendThreadMessageResponse> {
        const response = await restApiClient.post<SendThreadMessageResponse>(
            `/supplier/messages/${threadId}`,
            { message }
        );

        return response;
    },

    /**
     * Get supplier profile/shop details by URL
     * Public endpoint - no authentication required
     */
    async getSupplierProfile(url: string): Promise<SupplierProfile> {
        const endpoint = API_ENDPOINTS.SUPPLIER_PROFILE.replace(':url', url);
        const response = await restApiClient.get<{ data: SupplierProfile }>(endpoint);
        return response.data;
    },

    /**
     * Get supplier products
     * Public endpoint - no authentication required
     */
    async getSupplierProducts(
        url: string,
        page: number = 1,
        perPage: number = 20,
        additionalParams?: Record<string, any>
    ): Promise<PaginatedResponse<Product>> {
        const endpoint = API_ENDPOINTS.SUPPLIER_PRODUCTS.replace(':url', url);
        const response = await restApiClient.get<{
            data: Product[];
            meta: {
                current_page: number;
                last_page: number;
                per_page: number;
                total: number;
                from: number;
                to: number;
            };
            links: {
                first: string | null;
                last: string | null;
                prev: string | null;
                next: string | null;
            };
        }>(endpoint, {
            params: {
                page,
                limit: perPage,
                ...additionalParams
            },
        });

        return {
            data: response.data,
            current_page: response.meta.current_page,
            last_page: response.meta.last_page,
            per_page: response.meta.per_page,
            total: response.meta.total,
        };
    },

    /**
     * Search supplier products for RFQ
     * Requires authentication
     */
    async searchRFQProducts(query: string, supplierId: number): Promise<Array<{
        id: number;
        sku: string;
        name: string;
        price: number;
        formated_price: string;
        base_image: string | null;
        parent_id: number | null;
        is_config: number;
    }>> {
        const response = await restApiClient.post<Array<{
            id: number;
            sku: string;
            name: string;
            price: number;
            formated_price: string;
            base_image: string | null;
            parent_id: number | null;
            is_config: number;
        }>>(
            API_ENDPOINTS.RFQ_SEARCH_PRODUCTS,
            {
                query: query,
                supplier_id: supplierId,
            }
        );
        return response;
    },

    /**
     * Submit Request for Quote (RFQ)
     * Requires authentication
     */
    async submitRFQ(payload: RFQPayload, images?: string[], files?: string[] | Array<{ uri: string; name: string }>): Promise<RFQResponse> {
        const formData = new FormData();

        // Add basic fields
        formData.append('supplier_id', payload.supplier_id.toString());
        formData.append('quote_title', payload.quote_title);
        formData.append('quote_brief', payload.quote_brief);
        formData.append('name', payload.name);
        formData.append('company_name', payload.company_name);
        formData.append('address', payload.address);
        formData.append('contact_number', payload.contact_number);

        // Add products as array - Laravel expects array format (products are optional)
        if (payload.products && payload.products.length > 0) {
            payload.products.forEach((product, index) => {
                if (product.product_id) {
                    formData.append(`products[${index}][product_id]`, product.product_id.toString());
                }
                formData.append(`products[${index}][product_name]`, product.product_name);
                formData.append(`products[${index}][quantity]`, product.quantity.toString());
                if (product.description) {
                    formData.append(`products[${index}][description]`, product.description);
                }
                if (product.price_per_quantity !== null && product.price_per_quantity !== undefined) {
                    formData.append(`products[${index}][price_per_quantity]`, product.price_per_quantity.toString());
                }
                formData.append(`products[${index}][is_sample]`, product.is_sample ? '1' : '0');
                if (product.category_id) {
                    const categoryIds = Array.isArray(product.category_id)
                        ? product.category_id
                        : [product.category_id];
                    categoryIds.forEach((catId, catIndex) => {
                        formData.append(`products[${index}][category_id][${catIndex}]`, catId.toString());
                    });
                }
            });
        }

        // Add images if provided
        if (images && images.length > 0) {
            images.forEach((imageUri, index) => {
                // Detect file extension and mime type
                const extension = imageUri.split('.').pop()?.toLowerCase() || 'jpg';
                const mimeType = extension === 'png' ? 'image/png'
                    : extension === 'gif' ? 'image/gif'
                        : extension === 'webp' ? 'image/webp'
                            : extension === 'mp4' ? 'video/mp4'
                                : extension === 'mov' ? 'video/quicktime'
                                    : 'image/jpeg';

                formData.append(`images[${index}]`, {
                    uri: imageUri,
                    type: mimeType,
                    name: `image_${index}.${extension}`,
                } as any);
            });
        }

        // Add file attachments if provided
        if (files && files.length > 0) {
            files.forEach((file, index) => {
                // Handle both string URI and object with uri and name
                const fileUri = typeof file === 'string' ? file : file.uri;
                const fileName = typeof file === 'string'
                    ? file.split('/').pop() || `file_${index}`
                    : file.name || `file_${index}`;

                // Try to detect file extension from URI or filename
                const extension = fileName.split('.').pop()?.toLowerCase() || fileUri.split('.').pop()?.toLowerCase() || 'bin';
                const mimeType = extension === 'pdf' ? 'application/pdf'
                    : extension === 'doc' ? 'application/msword'
                        : extension === 'docx' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                            : extension === 'xls' ? 'application/vnd.ms-excel'
                                : extension === 'xlsx' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                                    : extension === 'txt' ? 'text/plain'
                                        : 'application/octet-stream';

                formData.append(`files[${index}]`, {
                    uri: fileUri,
                    type: mimeType,
                    name: fileName,
                } as any);
            });
        }

        const response = await restApiClient.post<RFQResponse>(
            API_ENDPOINTS.RFQ_STORE,
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            }
        );

        return response;
    },

    /**
     * Get customer quotes (requested quotes)
     * Requires authentication
     */
    async getCustomerQuotes(page: number = 1, perPage: number = 15): Promise<PaginatedResponse<CustomerQuote>> {
        const endpoint = API_ENDPOINTS.CUSTOMER_QUOTES;
        const response = await restApiClient.get<{
            data: CustomerQuote[];
            meta: {
                current_page: number;
                last_page: number;
                per_page: number;
                total: number;
                from: number;
                to: number;
            };
            links: {
                first: string;
                last: string;
                prev: string | null;
                next: string | null;
            };
        }>(endpoint, {
            params: { page, per_page: perPage },
        });
        return {
            data: response.data,
            meta: response.meta,
            links: response.links,
        };
    },

    /**
     * Get quote detail with status counts
     * Requires authentication
     */
    async getQuoteDetail(quoteId: number): Promise<QuoteDetail> {
        const endpoint = API_ENDPOINTS.CUSTOMER_QUOTE_DETAIL.replace(':quoteId', quoteId.toString());
        const response = await restApiClient.get<{ data: QuoteDetail }>(endpoint);
        return response.data;
    },

    /**
     * Get quote responses by status
     * Requires authentication
     */
    async getQuoteByStatus(quoteId: number, status: string, page: number = 1, perPage: number = 15): Promise<PaginatedResponse<QuoteResponse>> {
        const endpoint = API_ENDPOINTS.CUSTOMER_QUOTE_STATUS.replace(':quoteId', quoteId.toString()).replace(':status', status);
        const response = await restApiClient.get<{
            data: QuoteResponse[];
            meta: {
                current_page: number;
                last_page: number;
                per_page: number;
                total: number;
                from: number;
                to: number;
            };
            links: {
                first: string;
                last: string;
                prev: string | null;
                next: string | null;
            };
        }>(endpoint, {
            params: { page, per_page: perPage },
        });
        return {
            data: response.data,
            meta: response.meta,
            links: response.links,
        };
    },

    /**
     * Submit a supplier review (requires authentication)
     */
    async submitSupplierReview(supplierUrl: string, payload: {
        rating: number;
        title: string;
        comment: string;
    }): Promise<{ success: boolean; message: string }> {
        const endpoint = API_ENDPOINTS.SUPPLIER_REVIEW_STORE.replace(':url', supplierUrl);
        const response = await restApiClient.post<{ success: boolean; message: string }>(endpoint, payload);
        return response;
    },

    /**
     * Search products for quick order (requires authentication)
     */
    async searchQuickOrderProducts(query: string, supplierId: number): Promise<Array<{
        id: number;
        sku: string;
        name: string;
        price: number;
        formated_price: string;
        base_image: string | null;
        parent_id: number | null;
        is_config: boolean;
    }>> {
        const response = await restApiClient.post<Array<{
            id: number;
            sku: string;
            name: string;
            price: number;
            formated_price: string;
            base_image: string | null;
            parent_id: number | null;
            is_config: boolean;
        }>>(API_ENDPOINTS.QUICK_ORDER_SEARCH, {
            query,
            supplier_id: supplierId,
        });
        return response;
    },

    /**
     * Add product to cart via quick order (requires authentication)
     */
    async addQuickOrderToCart(payload: {
        product: number;
        quantity: number;
    }): Promise<{ success: boolean; message: string; data?: any }> {
        try {
            const response = await restApiClient.post<{ success: boolean; message: string; data?: any }>(
                API_ENDPOINTS.QUICK_ORDER_STORE,
                payload
            );
            return response;
        } catch (error: any) {
            // Handle API errors - extract message from error response
            // API returns 400 with { success: false, message: "..." } in error.response.data
            if (error.response?.data) {
                // If the error response has the expected structure, return it
                if (typeof error.response.data === 'object' && 'message' in error.response.data) {
                    return {
                        success: false,
                        message: error.response.data.message || 'Failed to add product to cart',
                        data: error.response.data.data,
                    };
                }
            }
            // If error doesn't have expected structure, throw it
            throw error;
        }
    },

    /**
     * Contact supplier (send query email to supplier)
     * Requires authentication
     */
    async contactSupplier(supplierUrl: string, payload: {
        name: string;
        email: string;
        subject: string;
        query: string;
    }): Promise<{ success: boolean; message: string }> {
        const endpoint = API_ENDPOINTS.CONTACT_SUPPLIER.replace(':url', supplierUrl);
        const response = await restApiClient.post<{ success: boolean; message: string }>(
            endpoint,
            payload
        );
        return response;
    },

    /**
     * Report supplier (flag supplier)
     * Requires authentication
     */
    async reportSupplier(payload: {
        supplier_id: number;
        name: string;
        email: string;
        selected_reason?: string;
        reason?: string;
    }): Promise<{ success: boolean; message: string }> {
        const response = await restApiClient.post<{ success: boolean; message: string }>(
            API_ENDPOINTS.REPORT_SUPPLIER,
            payload
        );
        return response;
    },

    /**
     * Get quote response detail
     * Requires authentication
     */
    async getQuoteResponseDetail(quoteId: number, customerQuoteItemId: number): Promise<QuoteResponseDetail> {
        const endpoint = API_ENDPOINTS.CUSTOMER_QUOTE_RESPONSE_DETAIL
            .replace(':quoteId', quoteId.toString())
            .replace(':customerQuoteItemId', customerQuoteItemId.toString());
        const response = await restApiClient.get<{ data: QuoteResponseDetail }>(endpoint);
        return response.data;
    },

    /**
     * Approve supplier quote
     * Requires authentication
     */
    async approveQuote(supplierQuoteItemId: number): Promise<{ success: boolean; message: string }> {
        const endpoint = API_ENDPOINTS.QUOTE_APPROVE.replace(':supplierQuoteItemId', supplierQuoteItemId.toString());
        const response = await restApiClient.post<{ success: boolean; message: string }>(endpoint);
        return response;
    },

    /**
     * Reject supplier quote
     * Requires authentication
     */
    async rejectQuote(supplierQuoteItemId: number): Promise<{ success: boolean; message: string }> {
        const endpoint = API_ENDPOINTS.QUOTE_REJECT.replace(':supplierQuoteItemId', supplierQuoteItemId.toString());
        const response = await restApiClient.post<{ success: boolean; message: string }>(endpoint);
        return response;
    },

    /**
     * Send message in quote thread
     * Requires authentication
     */
    async sendQuoteMessage(
        supplierQuoteItemId: number,
        customerQuoteItemId: number,
        message: string
    ): Promise<{ success: boolean; message: string; data?: QuoteMessage }> {
        const endpoint = API_ENDPOINTS.QUOTE_MESSAGE.replace(':supplierQuoteItemId', supplierQuoteItemId.toString());
        const response = await restApiClient.post<{ success: boolean; message: string; data?: QuoteMessage }>(
            endpoint,
            {
                message,
                customer_quote_item_id: customerQuoteItemId,
            }
        );
        return response;
    },

    /**
     * Add approved quote item to cart
     * Requires authentication
     */
    async addQuoteToCart(supplierQuoteItemId: number): Promise<{ success: boolean; message: string }> {
        try {
            const endpoint = API_ENDPOINTS.QUOTE_ADD_TO_CART.replace(':supplierQuoteItemId', supplierQuoteItemId.toString());
            const response = await restApiClient.post<{ success: boolean; message: string }>(endpoint);
            return response;
        } catch (error: any) {
            // Handle API errors - extract message from error response
            if (error.response?.data) {
                // If the error response has the expected structure, return it
                if (typeof error.response.data === 'object' && 'message' in error.response.data) {
                    return {
                        success: false,
                        message: error.response.data.message || 'Failed to add quote to cart',
                    };
                }
            }
            // If error doesn't have expected structure, throw it
            throw error;
        }
    },
};

export interface RFQProduct {
    product_id?: number | null;
    product_name: string;
    quantity: number;
    description?: string;
    price_per_quantity?: number | null;
    is_sample?: boolean;
    category_id?: number | number[];
}

export interface RFQPayload {
    supplier_id: number;
    quote_title: string;
    quote_brief: string;
    name: string;
    company_name: string;
    address: string;
    contact_number: string;
    products: RFQProduct[];
}

export interface RFQResponse {
    success: boolean;
    message: string;
    data?: {
        quote_id: number;
    };
}

export interface SupplierProfile {
    id: number;
    url: string;
    email: string;
    first_name: string;
    last_name: string;
    company_name: string;
    is_verified: boolean;
    is_approved: boolean;
    created_at: string;
    banner_url: string | null;
    logo_url: string | null;
    address1: string | null;
    address2: string | null;
    city: string | null;
    state: string | null;
    country: string | null;
    postcode: string | null;
    phone: string | null;
    corporate_phone: string | null;
    response_time: string | null;
    company_overview: string | null;
    shipping_policy: string | null;
    return_policy: string | null;
    privacy_policy: string | null;
    rating: number;
    total_reviews: number;
    percentage_ratings: { [key: number]: number };
    recent_reviews: SupplierReview[];
    total_products: number;
}

export interface SupplierReview {
    id: number;
    title: string;
    comment: string;
    rating: number;
    customer_name: string;
    created_at: string;
}

export interface CustomerQuote {
    id: number;
    quote_title: string;
    name: string;
    created_at: string;
    quantity: number;
    quote_status: 'pending' | 'processing' | 'completed';
    product_id: number;
}

export interface QuoteDetail {
    id: number;
    quote_title: string;
    quote_brief: string;
    name: string;
    company_name: string;
    address: string;
    phone: string;
    created_at: string;
    status_counts: {
        new: number;
        pending: number;
        answered: number;
        approved: number;
        rejected: number;
    };
    product_id: number | null;
}

export interface QuoteResponse {
    customer_quote_item_id: number;
    product_id: number;
    requested_quantity: number;
    customer_description: string | null;
    requested_price: number | null;
    is_sample: number;
    quote_status: string;
    supplier_quote_item_id: number | null;
    supplier_id: number | null;
    quoted_quantity: number | null;
    quoted_price: number | null;
    supplier_status: string | null;
    supplier_name: string | null;
    supplier_url: string | null;
    product_name: string | null;
    product_sku: string | null;
}

export interface QuoteResponseDetail {
    customer_quote_item: CustomerQuoteItem;
    supplier_quote_items: SupplierQuoteItem[];
    quote_messages: QuoteMessage[];
    supplier: {
        id: number;
        name: string;
        company_name: string;
    } | null;
    quote_info: {
        id: number;
        quote_title: string;
        quote_brief: string;
    };
}

export interface CustomerQuoteItem {
    id: number;
    quote_id: number;
    product_id: number;
    product_name: string;
    quantity: number;
    price_per_quantity: number | null;
    description: string | null;
    is_sample: boolean;
    is_approve: boolean;
    created_at: string;
}

export interface SupplierQuoteItem {
    id: number;
    product_name: string;
    quantity: number;
    price_per_quantity: number;
    is_sample: boolean;
    sample_unit: number | null;
    sample_price: number | null;
    shipping_time: number;
    note: string | null;
    status: string;
    is_approve: boolean;
    is_ordered: boolean;
    created_at: string;
}

export interface QuoteMessage {
    id: number;
    message: string;
    customer_id: number | null;
    supplier_id: number | null;
    created_at: string;
}

export default suppliersApi;

