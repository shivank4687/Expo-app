import api from '@/services/api/client';

export interface Order {
    id: number;
    order_id: number;
    increment_id: string | null;
    status: string;
    status_label: string;
    customer_email: string | null;
    customer_first_name: string | null;
    customer_last_name: string | null;
    customer_group_name: string | null;
    grand_total: number;
    base_grand_total: number;
    total_items: number;
    total_qty_ordered: number;
    first_product_image: string | null;
    items?: Array<{ name: string; qty: number }> | OrderItem[];
    can_ship: boolean;
    can_invoice: boolean;
    can_cancel: boolean;
    shipments_count: number;
    created_at: string;
    updated_at: string;
    billing_address: OrderAddress;
    shipping_address: OrderAddress;
    payment_method: string;
    shipping_method: string;
    formatted_grand_total: string;
    sub_total: number;
    base_sub_total: number;
    tax_amount: number;
    base_tax_amount: number;
    shipping_amount: number;
    base_shipping_amount: number;
    discount_amount: number;
    base_discount_amount: number;
    supplier_total: number;
    base_supplier_total: number;
    commission: number;
    base_commission: number;
    total_paid: number;
    total_refunded: number;
    total_due: number;
}

export interface OrderAddress {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    address1: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
    phone: string;
}

export interface OrdersResponse {
    data: Order[];
    meta: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        filter: string;
    };
}

export interface OrderItem {
    id: number;
    product_id: number;
    product_name: string;
    product_sku: string;
    product_image: string | null;
    qty_ordered: number;
    qty_shipped: number;
    qty_invoiced: number;
    qty_canceled: number;
    price: number;
    base_price: number;
    total: number;
    base_total: number;
    tax_amount: number;
    tax_percent: number;
    discount_amount: number;
}

export interface OrderShipment {
    id: number;
    carrier_title: string;
    track_number: string;
    total_qty: number;
    created_at: string;
}

export interface OrderDetails extends Omit<Order, 'items'> {
    items: OrderItem[];
    shipments: OrderShipment[];
}

export interface OrderDetailsResponse {
    data: OrderDetails;
}

/**
 * Get orders list with optional filter
 * @param filter - 'pending' | 'shipped' | 'issues'
 * @param page - Page number
 * @param limit - Items per page
 */
export const getOrders = async (
    filter: 'pending' | 'shipped' | 'issues' = 'pending',
    page: number = 1,
    limit: number = 20
): Promise<OrdersResponse> => {
    const response = await api.get<OrdersResponse>('/supplier-app/orders', {
        params: { filter, page, limit },
    });
    return response;
};

/**
 * Get detailed information for a specific order
 * @param orderId - Order ID
 */
export const getOrderDetails = async (orderId: number): Promise<OrderDetailsResponse> => {
    const response = await api.get<OrderDetailsResponse>(`/supplier-app/orders/${orderId}`);
    return response;
};
