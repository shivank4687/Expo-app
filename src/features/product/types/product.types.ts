// Product Types

export type ProductType = 'simple' | 'configurable' | 'grouped' | 'bundle' | 'downloadable' | 'virtual' | 'booking';

export interface Product {
    id: number;
    type: ProductType; // Product type from Bagisto
    name: string;
    slug: string;
    url_key?: string;
    description: string;
    short_description?: string;
    sku: string;
    price: number; // Current price (could be special price if on sale)
    formatted_price?: string; // Formatted price from API
    special_price?: number; // Discounted price (when on sale)
    regular_price?: number; // Original price before discount
    images: ProductImage[];
    thumbnail?: string;
    rating?: number;
    reviews_count?: number;
    in_stock: boolean;
    is_saleable?: boolean; // Can this product be added to cart
    quantity?: number;
    created_at?: string;
    new?: boolean | number; // Product is marked as "new"
    on_sale?: boolean; // Product is on sale (has special price)
    is_new?: boolean; // Alternative field name for "new" status
    categories?: Category[];
    
    // For configurable products
    variants?: ProductVariant[];
    configurable_attributes?: ConfigurableAttribute[];
    super_attributes?: ConfigurableAttribute[]; // Alternative field name from API
    
    // For grouped products
    grouped_products?: GroupedProduct[];
    
    // For bundle products
    bundle_options?: BundleOption[];
    
    // For downloadable products
    downloadable_links?: DownloadableLink[];
    
    // B2B Marketplace supplier information
    supplier?: SupplierInfo;
}

export interface SupplierInfo {
    id: number;
    company_name: string;
    url: string;
    rating?: number;
    total_reviews?: number;
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
    images?: ProductImage[];
}

export interface VariantAttribute {
    id: number;
    code: string;
    label: string;
    value: string;
    swatch_value?: string; // For color swatches
}

export interface ConfigurableAttribute {
    id: number;
    code: string;
    label: string;
    swatch_type?: string;
    options: ConfigurableOption[];
}

export interface ConfigurableOption {
    id: number;
    label: string;
    swatch_value?: string;
    products?: number[]; // Variant IDs that have this option
}

export interface GroupedProduct {
    id: number;
    product_id: number;
    qty: number;
    sort_order: number;
    associated_product: Product;
}

export interface BundleOption {
    id: number;
    type: 'select' | 'radio' | 'checkbox' | 'multiselect';
    label: string;
    is_required: boolean;
    sort_order: number;
    products: BundleOptionProduct[];
}

export interface BundleOptionProduct {
    id: number;
    product_id: number;
    qty: number;
    is_default: boolean;
    is_user_defined: boolean;
    sort_order: number;
    product: Product;
}

export interface DownloadableLink {
    id: number;
    title: string;
    price: number;
    sample_url?: string;
    sample_file?: string;
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
