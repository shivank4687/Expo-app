import { restApiClient } from '@/services/api/client';

export interface ProductVariant {
    id: number;
    name: string;
    sku: string;
    stock_qty: number;
}

export interface LowStockProduct {
    id: number;
    name: string;
    sku: string;
    type: 'simple' | 'configurable';
    stock_qty: number;
    price: number;
    formatted_price: string;
    image_url: string | null;
    variants?: ProductVariant[];
}

export interface LowStockProductsResponse {
    products: LowStockProduct[];
    total_count: number;
}

export interface LowStockProductsData {
    data: LowStockProductsResponse;
}

/**
 * Get low stock products for the supplier dashboard
 * Returns products ordered by stock quantity (lowest first)
 */
export const getLowStockProducts = async (): Promise<LowStockProductsResponse> => {
    const response = await restApiClient.get<LowStockProductsData>(
        '/supplier-app/dashboard/low-stock-products'
    );
    return response.data;
};
