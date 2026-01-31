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
        type: data.type || 'simple', // Product type (simple, configurable, grouped, etc.)
        name: data.name || data.url_key || 'Product',
        slug: data.slug || data.url_key || '',
        url_key: data.url_key || data.slug || '',
        description: data.description || '',
        short_description: data.short_description || '',
        price: typeof data.price === 'string' ? parseFloat(data.price) : data.price,
        formatted_price: data.formatted_price,
        special_price: data.special_price && typeof data.special_price === 'string'
            ? parseFloat(data.special_price)
            : data.special_price,
        regular_price: data.regular_price && typeof data.regular_price === 'string'
            ? parseFloat(data.regular_price)
            : data.regular_price,
        rating: data.reviews?.average_rating || 0,
        reviews_count: data.reviews?.total || 0,
        in_stock: data.in_stock !== undefined ? data.in_stock : true,
        is_saleable: data.is_saleable !== undefined ? data.is_saleable : true,
        images: data.images || [],
        thumbnail: data.base_image?.medium_image_url || data.base_image?.original_image_url || (data.images && data.images[0]?.url),
        // Badge fields
        new: data.new,
        is_new: data.is_new,
        on_sale: data.on_sale,
        // Product type specific fields
        variants: data.variants,
        configurable_attributes: data.configurable_attributes,
        super_attributes: data.super_attributes,
        grouped_products: data.grouped_products,
        bundle_options: data.bundle_options,
        downloadable_links: data.downloadable_links,
        // B2B Marketplace supplier information
        supplier: data.supplier ? {
            id: data.supplier.id,
            company_name: data.supplier.company_name,
            url: data.supplier.url,
            rating: data.supplier.rating ? parseFloat(data.supplier.rating.toString()) : 0,
            total_reviews: data.supplier.total_reviews || 0,
        } : undefined,
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

    /**
     * Get configurable product configuration
     * Returns complete configuration with variant mapping, prices, and images
     */
    async getConfigurableConfig(productId: number): Promise<any> {
        const url = `${API_ENDPOINTS.PRODUCTS}/${productId}/configurable-config`;
        const response = await restApiClient.get<{ data: any }>(url);
        return response.data || response;
    },

    /**
     * Create a new product as a supplier
     */
    async createSupplierProduct(data: any): Promise<any> {
        // Broaden hasFiles check to include variants
        const hasVariantImages = data.variants && Object.values(data.variants).some((v: any) =>
            v.images && Array.isArray(v.images) && v.images.some((img: any) => {
                const uri = typeof img === 'object' ? img.uri : img;
                return typeof uri === 'string' && uri.startsWith('file://');
            })
        );
        const hasFiles = (data.images && data.images.some((img: any) => {
            const uri = typeof img === 'object' ? img.uri : img;
            return typeof uri === 'string' && uri.startsWith('file://');
        })) ||
            (data.video && (() => {
                const uri = typeof data.video === 'object' ? data.video.uri : data.video;
                return typeof uri === 'string' && uri.startsWith('file://');
            })()) ||
            hasVariantImages;

        if (!hasFiles) {
            const response = await restApiClient.post<{ data: any, message: string }>(
                API_ENDPOINTS.SUPPLIER_PRODUCTS_LIST,
                data
            );
            return response.data;
        }

        // Use FormData for multipart upload
        const formData = new FormData();

        const appendToFormData = (data: any, rootKey: string) => {
            if (data === null || data === undefined) return;

            if (rootKey === 'images' && Array.isArray(data)) {
                data.forEach((img: any, index: number) => {
                    const uri = typeof img === 'object' ? img.uri : img;
                    const id = typeof img === 'object' ? img.id : null;

                    if (typeof uri === 'string' && uri.startsWith('file://')) {
                        formData.append(`images[files][${index}]`, {
                            uri,
                            name: `image_${index}.png`,
                            type: 'image/png',
                        } as any);
                    } else if (id) {
                        formData.append(`images[files][${id}]`, id);
                    }
                });
                return;
            }

            if (rootKey === 'video' && data) {
                const uri = typeof data === 'object' ? data.uri : data;
                const id = typeof data === 'object' ? data.id : null;

                if (typeof uri === 'string' && uri.startsWith('file://')) {
                    formData.append('videos[files][0]', {
                        uri,
                        name: 'video.mp4',
                        type: 'video/mp4',
                    } as any);
                } else if (id) {
                    formData.append('videos[files][0]', id);
                }
                return;
            }

            // Handle variant images - check if we're processing a variant's images array
            if (rootKey.includes('variants[') && rootKey.endsWith('][images]') && Array.isArray(data)) {
                data.forEach((img: any, index: number) => {
                    const uri = typeof img === 'object' ? img.uri : img;
                    const id = typeof img === 'object' ? img.id : null;

                    if (typeof uri === 'string' && uri.startsWith('file://')) {
                        formData.append(`${rootKey}[files][${index}]`, {
                            uri,
                            name: `variant_image_${index}.png`,
                            type: 'image/png',
                        } as any);
                    } else if (id) {
                        formData.append(`${rootKey}[files][${id}]`, id);
                    }
                });
                return;
            }

            if (Array.isArray(data)) {
                data.forEach((value, index) => {
                    appendToFormData(value, `${rootKey}[${index}]`);
                });
            } else if (typeof data === 'object' && !(data instanceof Date)) {
                Object.keys(data).forEach(key => {
                    appendToFormData(data[key], rootKey ? `${rootKey}[${key}]` : key);
                });
            } else {
                formData.append(rootKey, data);
            }
        };

        appendToFormData(data, '');

        const response = await restApiClient.post<{ data: any, message: string }>(
            API_ENDPOINTS.SUPPLIER_PRODUCTS_LIST,
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            }
        );
        return response.data;
    },

    /**
     * Get a supplier product by ID for editing
     */
    async getSupplierProductById(id: number): Promise<any> {
        const url = API_ENDPOINTS.SUPPLIER_PRODUCT_DETAIL.replace(':id', id.toString());
        const response = await restApiClient.get<{ data: any }>(url);
        return response.data;
    },

    /**
     * Update an existing supplier product
     */
    async updateSupplierProduct(id: number, data: any): Promise<any> {
        // Check if there are images or variants (always use FormData if they are present
        // to ensure existing images are preserved via their IDs)
        const hasImagesOrVariants = (data.images && Array.isArray(data.images) && data.images.length > 0) ||
            (data.variants && Object.keys(data.variants).length > 0) ||
            (data.video);

        // Check if there are actual NEW FILES to upload
        const hasVariantFiles = data.variants && Object.values(data.variants).some((v: any) =>
            v.images && Array.isArray(v.images) && v.images.some((img: any) => {
                const uri = typeof img === 'object' ? img.uri || img.url : img;
                return typeof uri === 'string' && (uri.startsWith('file://') || uri.startsWith('blob:'));
            })
        );
        const hasNewImageFiles = data.images && Array.isArray(data.images) &&
            data.images.some((img: any) => {
                const uri = typeof img === 'object' ? img.uri || img.url : img;
                return typeof uri === 'string' && (uri.startsWith('file://') || uri.startsWith('blob:'));
            });
        const hasNewVideoFile = data.video && (() => {
            const uri = typeof data.video === 'object' ? data.video.uri || data.video.url : data.video;
            return typeof uri === 'string' && (uri.startsWith('file://') || uri.startsWith('blob:'));
        })();

        const hasFiles = hasNewImageFiles || hasNewVideoFile || hasVariantFiles;
        const url = API_ENDPOINTS.SUPPLIER_PRODUCT_UPDATE.replace(':id', id.toString());

        // If no images/variants at all, use JSON
        if (!hasImagesOrVariants) {
            console.log('📤 Sending update via JSON (no media/variants)');
            const response = await restApiClient.put<{ data: any, message: string }>(
                url,
                data
            );
            return response.data;
        }

        // Use FormData for multipart upload when there are images or variants
        // IMPORTANT: For Laravel/Bagisto, multipart requests with PUT often fail.
        // We use POST and add _method: 'PUT' to simulate a PUT request.
        console.log(`📤 Sending update via FormData (POST with _method=PUT) (${hasFiles ? 'has new files' : 'existing media only'})`);
        const formData = new FormData();
        formData.append('_method', 'PUT');

        const appendToFormData = (data: any, rootKey: string) => {
            if (data === null || data === undefined) return;

            // Handle images array (main product)
            if (rootKey === 'images' && Array.isArray(data)) {
                data.forEach((img: any, index: number) => {
                    const uri = typeof img === 'object' ? img.uri || img.url : img;
                    const id = typeof img === 'object' ? img.id : null;

                    if (typeof uri === 'string' && (uri.startsWith('file://') || uri.startsWith('blob:'))) {
                        // New local file - use a unique string key to avoid clashing with existing IDs
                        formData.append(`images[files][new_${index}]`, {
                            uri,
                            name: `image_${index}.png`,
                            type: 'image/png',
                        } as any);
                    } else if (id) {
                        // Existing file - send its ID as the key
                        formData.append(`images[files][${id}]`, id);
                    }
                });
                return;
            }

            // Handle video (main product)
            if (rootKey === 'video' && data) {
                const uri = typeof data === 'object' ? data.uri || data.url : data;
                const id = typeof data === 'object' ? data.id : null;

                if (typeof uri === 'string' && (uri.startsWith('file://') || uri.startsWith('blob:'))) {
                    formData.append('videos[files][new_0]', {
                        uri,
                        name: 'video.mp4',
                        type: 'video/mp4',
                    } as any);
                } else if (id) {
                    formData.append('videos[files][0]', id);
                }
                return;
            }

            // Handle variant images
            if (rootKey.includes('variants[') && rootKey.endsWith('][images]') && Array.isArray(data)) {
                data.forEach((img: any, index: number) => {
                    const uri = typeof img === 'object' ? img.uri || img.url : img;
                    const id = typeof img === 'object' ? img.id : null;

                    if (typeof uri === 'string' && (uri.startsWith('file://') || uri.startsWith('blob:'))) {
                        // New local file for variant
                        formData.append(`${rootKey}[files][new_${index}]`, {
                            uri,
                            name: `variant_image_${index}.png`,
                            type: 'image/png',
                        } as any);
                    } else if (id) {
                        // Existing file for variant
                        formData.append(`${rootKey}[files][${id}]`, id);
                    }
                });
                return;
            }

            if (Array.isArray(data)) {
                data.forEach((value, index) => {
                    appendToFormData(value, `${rootKey}[${index}]`);
                });
            } else if (typeof data === 'object' && !(data instanceof Date)) {
                Object.keys(data).forEach(key => {
                    appendToFormData(data[key], rootKey ? `${rootKey}[${key}]` : key);
                });
            } else {
                formData.append(rootKey, data);
            }
        };

        appendToFormData(data, '');

        // Use POST with _method=PUT
        const response = await restApiClient.post<{ data: any, message: string }>(
            url,
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            }
        );
        return response.data;
    },

    /**
     * Check if a SKU already exists
     * @param sku - The SKU to check
     * @param productId - Optional product ID to exclude (for edit mode)
     */
    async checkSkuExists(sku: string, productId?: number): Promise<boolean> {
        const params: any = { sku };
        if (productId) {
            params.product_id = productId;
        }
        const response = await restApiClient.get<{ exists: boolean }>(
            API_ENDPOINTS.SUPPLIER_CHECK_SKU,
            { params }
        );
        return response.exists;
    },

    /**
     * Duplicate a supplier product
     * @param productId - The product ID to duplicate
     * @returns The duplicated product's marketplace ID and details
     */
    async duplicateSupplierProduct(productId: number): Promise<{
        marketplace_product_id: number;
        product_id: number;
        name: string;
        sku: string;
    }> {
        const url = API_ENDPOINTS.SUPPLIER_PRODUCT_COPY.replace(':id', productId.toString());
        const response = await restApiClient.post<{
            data: {
                marketplace_product_id: number;
                product_id: number;
                name: string;
                sku: string;
            };
            message: string;
        }>(url, {});
        return response.data;
    },
};

export default productsApi;
