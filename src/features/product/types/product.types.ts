// Product Types

export interface Product {
    id: number;
    name: string;
    slug: string;
    description: string;
    short_description?: string;
    sku: string;
    price: number;
    special_price?: number;
    images: ProductImage[];
    thumbnail?: string;
    rating?: number;
    reviews_count?: number;
    in_stock: boolean;
    quantity?: number;
    variants?: ProductVariant[];
    categories?: Category[];
    created_at?: string;
}

export interface ProductImage {
    id: number;
    url: string;
    path: string;
    alt?: string;
}

export interface ProductVariant {
    id: number;
    name: string;
    sku: string;
    price: number;
    special_price?: number;
    in_stock: boolean;
    attributes: VariantAttribute[];
}

export interface VariantAttribute {
    id: number;
    code: string;
    label: string;
    value: string;
}

export interface Category {
    id: number;
    name: string;
    slug: string;
    description?: string;
    image?: string;
    parent_id?: number;
}

export interface Review {
    id: number;
    customer_name: string;
    rating: number;
    comment: string;
    created_at: string;
}

export interface ProductFilters {
    category_id?: number;
    min_price?: number;
    max_price?: number;
    search?: string;
    name?: string;
    featured?: number;
    sort_by?: 'price' | 'name' | 'created_at';
    sort_order?: 'asc' | 'desc';
    page?: number;
    per_page?: number;
}
