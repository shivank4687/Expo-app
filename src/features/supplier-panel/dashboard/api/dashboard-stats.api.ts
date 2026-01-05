import { restApiClient } from '@/services/api/client';
import { API_ENDPOINTS } from '@/config/constants';
import {
    DashboardStatsData,
    SalesStatsResponse,
    PendingOrdersStatsData,
    PendingOrdersStatsResponse,
    PaymentsStatsData,
    PaymentsStatsResponse,
    QuotesStatsData,
    QuotesStatsResponse,
    PendingOrdersListData,
    PendingOrdersListResponse
} from '../types/dashboard.types';

/**
 * Dashboard Stats API Service
 * Handles all dashboard statistics API calls for supplier panel
 */
export const dashboardStatsApi = {
    /**
     * Get sales statistics for the last 7 days
     * @returns Sales stats with current/previous totals and percentage change
     */
    async getSalesStats(): Promise<SalesStatsResponse> {
        const response = await restApiClient.get<DashboardStatsData>(
            API_ENDPOINTS.SUPPLIER_DASHBOARD_SALES_STATS
        );
        return response.data;
    },

    /**
     * Get pending orders count
     * @returns Count of pending orders
     */
    async getPendingOrdersStats(): Promise<PendingOrdersStatsResponse> {
        const response = await restApiClient.get<PendingOrdersStatsData>(
            API_ENDPOINTS.SUPPLIER_DASHBOARD_PENDING_ORDERS_STATS
        );
        return response.data;
    },

    /**
     * Get payments to be released
     * @returns Pending payments amount
     */
    async getPaymentsStats(): Promise<PaymentsStatsResponse> {
        const response = await restApiClient.get<PaymentsStatsData>(
            API_ENDPOINTS.SUPPLIER_DASHBOARD_PAYMENTS_STATS
        );
        return response.data;
    },

    /**
     * Get new quotes count
     * @returns Count of new RFQ/quotes
     */
    async getQuotesStats(): Promise<QuotesStatsResponse> {
        const response = await restApiClient.get<QuotesStatsData>(
            API_ENDPOINTS.SUPPLIER_DASHBOARD_QUOTES_STATS
        );
        return response.data;
    },

    /**
     * Get pending orders list (max 5 for carousel)
     * @returns List of pending orders with details
     */
    async getPendingOrdersList(): Promise<PendingOrdersListResponse> {
        const response = await restApiClient.get<PendingOrdersListData>(
            API_ENDPOINTS.SUPPLIER_DASHBOARD_PENDING_ORDERS_LIST
        );
        return response.data;
    },
};
