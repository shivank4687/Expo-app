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
    videos?: ProductVideo[];
    thumbnail?: string;
    rating?: number;
    reviews_count?: number;
    in_stock: boolean;
    is_saleable?: boolean; // Can this product be added to cart
    quantity?: number; // Available stock count
    created_at?: string;
    new?: boolean | number; // Product is marked as "new"
    on_sale?: boolean; // Product is on sale (has special price)
    is_new?: boolean; // Alternative field name for "new" status
    immediate_shipping?: boolean; // Product is in stock and ships immediately
    made_to_order?: boolean; // Product is made to order
    made_to_order_days?: number | null; // Production time in days
    made_to_order_qty?: number | null; // Minimum order quantity for made-to-order
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

    // Customer group pricing offers
    customer_group_pricing_offers?: CustomerGroupPricingOffer[];

    // Dynamic Product Specifications
    specifications?: Array<{ key: string; value: string }>;
}

export interface CustomerGroupPricingOffer {
    qty: number;
    price: number;
    formatted_price: string;
    discount: string;
}

export interface SupplierInfo {
    id: number;
    company_name: string;
    url: string;
    rating?: number;
    total_reviews?: number;
    minimum_order_amount?: number;
    free_shipping_enable?: boolean;
    free_shipping_threshold?: number;
    standard_delivery_days?: number | null;
    preparation_time_days?: number | null;
    wholesale_price_multiplier?: number | null;
    special_price_from_wholesale?: boolean;
}

export interface ProductImage {
    id: number;
    url: string;
    path: string;
    alt?: string;
}

export interface ProductVideo {
    id: number;
    type: string;
    url: string;
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
    quantity?: number;
    made_to_order?: boolean;
    made_to_order_days?: number | null;
    immediate_shipping?: boolean;
    made_to_order_qty?: number | null;
    customer_group_pricing_offers?: CustomerGroupPricingOffer[];
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
    new?: number;
    sort_by?: 'price' | 'name' | 'created_at';
    sort_order?: 'asc' | 'desc';
    sort?: string; // Combined sort parameter (e.g., 'price-asc', 'name-desc')
    page?: number;
    per_page?: number;
    locale?: string;
    price?: string; // Price range filter in "min,max" format
    // Dynamic attribute filters (e.g., color, brand, size)
    [key: string]: any; // Allow dynamic filter keys from API
}

export interface ShippingQuoteRate {
    provider: string;
    service_name: string;
    formatted_price: string;
    price: number;
    days: number | null;
    estimated_delivery: string;
}

export interface ShippingQuoteResult {
    rates: ShippingQuoteRate[];
    cheapest: ShippingQuoteRate | null;
}
