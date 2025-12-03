/**
 * Theme Customization Types
 * Based on Bagisto theme customization system
 */

export enum ThemeCustomizationType {
    IMAGE_CAROUSEL = 'image_carousel',
    STATIC_CONTENT = 'static_content',
    CATEGORY_CAROUSEL = 'category_carousel',
    PRODUCT_CAROUSEL = 'product_carousel',
    FOOTER_LINKS = 'footer_links',
    SERVICES_CONTENT = 'services_content',
}

export interface ImageCarouselImage {
    image?: string;
    link?: string;
    title?: string;
}

export interface ImageCarouselOptions {
    images?: ImageCarouselImage[];
}

export interface StaticContentOptions {
    html?: string;
    css?: string;
}

export interface CategoryCarouselOptions {
    title?: string;
    filters?: Record<string, any>;
}

export interface ProductCarouselOptions {
    title?: string;
    filters?: Record<string, any>;
}

export interface ThemeCustomization {
    id: number;
    type: ThemeCustomizationType;
    name: string;
    sort_order: number;
    status: number;
    channel_id: number;
    theme_code: string;
    options: ImageCarouselOptions | StaticContentOptions | CategoryCarouselOptions | ProductCarouselOptions;
    created_at?: string;
    updated_at?: string;
}

export interface ThemeCustomizationsResponse {
    data: ThemeCustomization[];
}

