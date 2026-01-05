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

export interface ProductsListResponse {
    products: Product[];
    total_count: number;
}
