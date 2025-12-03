import { config } from '@/config/env';

/**
 * Bundled placeholder image (same as used in Bagisto web application)
 * This is bundled with the app, so it works offline
 */
export const PLACEHOLDER_IMAGE = require('../../../assets/images/small-product-placeholder.webp');

/**
 * Convert relative image URL to absolute URL
 * @param imageUrl - The image URL (can be relative or absolute)
 * @returns Absolute image URL, bundled placeholder, or the required image object
 */
export const getAbsoluteImageUrl = (imageUrl?: string): any => {
    // If no image provided or empty string, use bundled placeholder
    if (!imageUrl || imageUrl.trim() === '') {
        return PLACEHOLDER_IMAGE;
    }

    // If already absolute URL (starts with http:// or https://), return as is
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
        return imageUrl;
    }

    // If relative URL, prepend base URL
    // Remove leading slash if present to avoid double slashes
    const cleanPath = imageUrl.startsWith('/') ? imageUrl.slice(1) : imageUrl;
    
    return `${config.baseUrl}/${cleanPath}`;
};

/**
 * Convert an array of image objects with relative URLs to absolute URLs
 */
export const normalizeImageUrls = <T extends { image?: string }>(images: T[]): any[] => {
    return images.map(img => ({
        ...img,
        image: getAbsoluteImageUrl(img.image),
    }));
};

