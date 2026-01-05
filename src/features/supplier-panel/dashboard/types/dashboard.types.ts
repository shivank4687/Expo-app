/**
 * Supplier Dashboard Types
 */

export interface SalesStatsResponse {
    current_total: number;
    previous_total: number;
    percentage_change: number;
    formatted_total: string;
    total_orders: number;
}

export interface DashboardStatsData {
    data: SalesStatsResponse;
}

export interface PendingOrdersStatsResponse {
    pending_count: number;
}

export interface PendingOrdersStatsData {
    data: PendingOrdersStatsResponse;
}

export interface PaymentsStatsResponse {
    pending_amount: number;
    formatted_amount: string;
}

export interface PaymentsStatsData {
    data: PaymentsStatsResponse;
}

export interface QuotesStatsResponse {
    new_quotes_count: number;
}

export interface QuotesStatsData {
    data: QuotesStatsResponse;
}

export interface PendingOrder {
    id: number;
    order_increment_id: string;
    customer_name: string;
    total_items: number;
    amount: number;
    formatted_amount: string;
    created_at: string;
}

export interface PendingOrdersListResponse {
    orders: PendingOrder[];
    total_count: number;
}

export interface PendingOrdersListData {
    data: PendingOrdersListResponse;
}
