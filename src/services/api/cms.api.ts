import { restApiClient } from './client';

export interface CMSPage {
    id: number;
    url_key: string;
    page_title: string;
    html_content: string;
    meta_title?: string;
    meta_description?: string;
    meta_keywords?: string;
}

/**
 * CMS Pages API Service
 * Fetches static/CMS pages from the backend
 */
export const cmsApi = {
    /**
     * Get all CMS pages for current channel and locale
     * Pages are automatically filtered by channel and translated based on X-Locale header
     */
    async getPages(): Promise<{ data: CMSPage[] }> {
        try {
            console.log('[CMS API] Fetching CMS pages');
            
            const response = await restApiClient.get<{ data: CMSPage[] }>('/cms-pages');
            
            const pages = Array.isArray(response) ? response : (response.data || []);
            
            console.log('[CMS API] Loaded pages:', pages.length);
            
            return { data: pages };
        } catch (error) {
            console.error('[CMS API] Error fetching pages:', error);
            throw error;
        }
    },

    /**
     * Get a specific CMS page by url_key
     */
    async getPageByUrlKey(urlKey: string): Promise<CMSPage> {
        try {
            console.log('[CMS API] Fetching page:', urlKey);
            
            const response = await restApiClient.get<{ data: CMSPage }>(`/cms-pages/${urlKey}`);
            
            const page = (response as any).data || response;
            
            console.log('[CMS API] Loaded page:', page.page_title);
            
            return page;
        } catch (error) {
            console.error('[CMS API] Error fetching page:', error);
            throw error;
        }
    },
};

export default cmsApi;

