/**
 * Product types for supplier panel
 */

export interface Product {
    id: number;
    product_id: number;
    name: string;
    sku: string;
    price: number | string;
    formatted_price: string;
    status: 'active' | 'inactive';
    stock: number;
    image_url?: string | null;
}

export interface ProductsListParams {
    page?: number;
    per_page?: number;
}

export interface ProductsListResponse {
    products: Product[];
    total_count: number;
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}
