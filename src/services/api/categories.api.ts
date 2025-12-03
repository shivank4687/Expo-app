import { shopApiClient, restApiClient } from './client';
import { API_ENDPOINTS } from '@/config/constants';

export interface Category {
    id: number;
    name: string;
    slug: string;
    description?: string;
    image?: string;
    parent_id?: number;
    children?: Category[];
    logo?: {
        large_image_url?: string;
        original_image_url?: string;
    };
}

/**
 * Categories API Service
 */
export const categoriesApi = {
    /**
     * Helper to recursively map category data
     */
    mapCategory(cat: any): Category {
        return {
            id: cat.id,
            name: cat.name,
            slug: cat.slug,
            description: cat.description,
            image: cat.logo?.original_image_url || cat.logo?.large_image_url || cat.banner?.large_image_url,
            parent_id: cat.parent_id,
            logo: cat.logo ? {
                large_image_url: cat.logo.large_image_url,
                original_image_url: cat.logo.original_image_url,
            } : undefined,
            // Recursively map children
            children: Array.isArray(cat.children) 
                ? cat.children.map((child: any) => this.mapCategory(child))
                : []
        };
    },

    /**
     * Get all categories with hierarchy
     * Uses Shop API /api/categories/tree endpoint or REST API /api/v1/categories
     * Returns categories in tree format with nested children
     */
    async getCategories(filters?: any): Promise<{ data: Category[] }> {
        try {
            console.log('[Categories API] Fetching from API');
            
            // If filters are provided, use REST API
            if (filters && Object.keys(filters).length > 0) {
                const response = await restApiClient.get<any>(API_ENDPOINTS.CATEGORIES, {
                    params: filters
                });
                const categories = Array.isArray(response) ? response : (response.data || []);
                const mappedCategories = categories.map((cat: any) => this.mapCategory(cat));
                return { data: mappedCategories };
            }
            
            // Use Shop API client - it automatically handles locale as query parameter
            const response = await shopApiClient.get<any>('/categories/tree');
            
            // Shop API wraps response in { data: [...] }
            // The backend already returns the tree structure with nested children
            const categories = Array.isArray(response) ? response : (response.data || []);
            
            console.log('[Categories API] Loaded categories:', categories.length);
            
            // Map and ensure children arrays exist
            const mappedCategories = categories.map((cat: any) => this.mapCategory(cat));
            
            console.log('[Categories API] Returning', mappedCategories.length, 'root categories');
            
            return { data: mappedCategories };
        } catch (error) {
            console.error('[Categories API] Error fetching categories:', error);
            throw error;
        }
    },

    /**
     * Get category details by ID with children
     * Uses REST API v1
     */
    async getCategoryById(id: number): Promise<Category> {
        const url = API_ENDPOINTS.CATEGORY_DETAIL.replace(':id', id.toString());
        const response = await restApiClient.get<{ data: any }>(url);
        const category = response.data || response;

        console.log('Category response:', category);

        // Fetch children/subcategories
        try {
            console.log('Fetching subcategories for parent_id:', id);
            const childrenResponse = await restApiClient.get<{ data: any[] }>('/descendant-categories', {
                params: { parent_id: id }
            });
            console.log('Subcategories raw response:', childrenResponse);
            const children = childrenResponse.data || childrenResponse;
            console.log('Subcategories data:', children);
            category.children = Array.isArray(children) ? children.map((cat: any) => ({
                ...cat,
                image: cat.logo_url || cat.image,
            })) : [];
            console.log('Mapped children:', category.children);
        } catch (error) {
            console.error('Error fetching children for category', id, error);
            category.children = [];
        }

        return {
            ...category,
            image: category.logo_url || category.image,
        };
    },
};

export default categoriesApi;
