import { restApiClient } from '@/services/api/client';
 
export interface PromotionCondition {
    value: string;
    operator: string;
    attribute: string;
    attribute_type: string;
}

export interface Promotion {
    id: number;
    name: string;
    description: string | null;
    starts_from: string | null;
    ends_till: string | null;
    coupon_type: number;
    coupon_code: string | null;
    action_type: string;
    discount_amount: number;
    free_shipping: boolean;
    apply_to_shipping: boolean;
    sort_order: number;
    condition_type: number | null; // 1 = ALL conditions, 2 = ANY condition
    conditions: PromotionCondition[];
}

export const promotionsApi = {
    /**
     * Get list of active promotions for the current customer
     */
    async getPromotions(): Promise<Promotion[]> {
        const response = await restApiClient.get<{ data: Promotion[] }>('customer/promotions');
        // restApiClient.get() returns response.data directly from Axios,
        // so `response` here IS the parsed body: { data: [...] }
        return Array.isArray(response?.data) ? response.data : (Array.isArray(response) ? response : []);
    }
};
