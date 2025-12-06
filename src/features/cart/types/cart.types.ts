/**
 * Cart Types
 * Type definitions for cart related data structures
 */

export interface CartItem {
    id: number;
    product_id: number;
    quantity: number;
    sku: string;
    type: string;
    name: string;
    price: number;
    base_price: number;
    total: number;
    base_total: number;
    weight?: number;
    tax_percent: number;
    tax_amount: number;
    base_tax_amount: number;
    discount_percent: number;
    discount_amount: number;
    base_discount_amount: number;
    additional?: any;
    child?: CartItem;
    parent_id?: number;
    product: {
        id: number;
        name: string;
        sku: string;
        url_key?: string;
        thumbnail?: string;
        images?: Array<{
            id: number;
            url: string;
            large_image_url?: string;
            medium_image_url?: string;
            small_image_url?: string;
        }>;
        price: number;
        regular_price?: number;
        special_price?: number;
        in_stock: boolean;
    };
}

export interface CartAddress {
    id?: number;
    first_name: string;
    last_name: string;
    email: string;
    address1: string;
    address2?: string;
    city: string;
    state: string;
    country: string;
    postcode: string;
    phone: string;
}

export interface CartTotals {
    sub_total: number;
    base_sub_total: number;
    grand_total: number;
    base_grand_total: number;
    discount_amount: number;
    base_discount_amount: number;
    tax_total: number;
    base_tax_total: number;
    shipping_amount?: number;
    base_shipping_amount?: number;
    formatted_sub_total: string;
    formatted_grand_total: string;
    formatted_discount_amount: string;
    formatted_tax_total: string;
    formatted_shipping_amount?: string;
}

export interface Cart {
    id: number;
    customer_email?: string;
    customer_first_name?: string;
    customer_last_name?: string;
    is_guest: boolean;
    items: CartItem[];
    items_count: number;
    items_qty: number;
    selected_shipping_rate?: any;
    payment?: any;
    billing_address?: CartAddress;
    shipping_address?: CartAddress;
    have_stockable_items: boolean;
    coupon_code?: string;
    applied_cart_rule_ids?: string;
    // Totals
    sub_total: number;
    base_sub_total: number;
    grand_total: number;
    base_grand_total: number;
    discount_amount: number;
    base_discount_amount: number;
    tax_total: number;
    base_tax_total: number;
    shipping_amount?: number;
    base_shipping_amount?: number;
    formatted_sub_total: string;
    formatted_grand_total: string;
    formatted_discount_amount: string;
    formatted_tax_total: string;
    formatted_shipping_amount?: string;
    formatted_base_shipping_amount?: string;
}

export interface AddToCartPayload {
    product_id: number;
    quantity: number;
    selected_configurable_option?: number;
    super_attribute?: Record<string, any>;
    links?: number[];
    booking?: Record<string, any>;
}

export interface UpdateCartItemPayload {
    qty: Record<number, number>; // { [cart_item_id]: quantity }
}

export interface RemoveCartItemPayload {
    cart_item_id: number;
}

export interface ApplyCouponPayload {
    code: string;
}

export interface MoveToWishlistPayload {
    cart_item_id: number;
}

