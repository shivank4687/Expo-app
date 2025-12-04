import { restApiClient } from './client';
import { API_ENDPOINTS } from '@/config/constants';
import { Product, ProductFilters } from '@/features/product/types/product.types';
import { PaginatedResponse } from '@/types/global.types';

/**
 * Products API Service
 * Uses REST API v1 endpoints
 */

/**
 * Transform API product data to application Product type
 */
const transformProduct = (data: any): Product => {
    return {
        ...data,
        name: data.name || data.url_key || 'Product',
        slug: data.slug || data.url_key || '',
        description: data.description || '',
        price: typeof data.price === 'string' ? parseFloat(data.price) : data.price,
        special_price: data.special_price && typeof data.special_price === 'string'
            ? parseFloat(data.special_price)
            : data.special_price,
        regular_price: data.regular_price && typeof data.regular_price === 'string'
            ? parseFloat(data.regular_price)
            : data.regular_price,
        rating: data.reviews?.average_rating || 0,
        reviews_count: data.reviews?.total || 0,
        in_stock: data.in_stock !== undefined ? data.in_stock : true,
        images: data.images || [],
        thumbnail: data.base_image?.medium_image_url || data.base_image?.original_image_url || (data.images && data.images[0]?.url),
        // Badge fields
        new: data.new,
        is_new: data.is_new,
        on_sale: data.on_sale,
    };
};

export const productsApi = {
    /**
     * Get list of products with optional filters
     */
    async getProducts(filters?: ProductFilters): Promise<PaginatedResponse<Product>> {
        const response = await restApiClient.get<PaginatedResponse<any>>(API_ENDPOINTS.PRODUCTS, {
            params: filters,
        });

        return {
            ...response,
            data: response.data.map(transformProduct),
        };
    },

    /**
     * Get product details by ID
     */
    async getProductById(id: number): Promise<Product> {
        const url = API_ENDPOINTS.PRODUCT_DETAIL.replace(':id', id.toString());
        const response = await restApiClient.get<{ data: any }>(url);
        // Handle case where API might return wrapped data or direct object
        const data = (response as any).data || response;
        return transformProduct(data);
    },

    /**
     * Get featured products
     */
    async getFeaturedProducts(): Promise<Product[]> {
        const response = await this.getProducts({ featured: 1 });
        return response.data;
    },

    /**
     * Search products
     */
    async searchProducts(query: string, filters?: ProductFilters): Promise<PaginatedResponse<Product>> {
        return this.getProducts({ name: query, ...filters });
    },

    /**
     * Get products by category
     */
    async getProductsByCategory(categoryId: number, filters?: ProductFilters): Promise<PaginatedResponse<Product>> {
        return this.getProducts({ category_id: categoryId, ...filters });
    },
};

export default productsApi;
