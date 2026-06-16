/**
 * Offline Products API
 *
 * Handles the POST /supplier-app/products/sync call that uploads
 * a locally-saved offline product to the server.
 *
 * Mirrors the structure of products.api.ts — uses the same
 * multipartFetch + buildFormData helpers.
 */

import { multipartFetch, formatFileUri } from './fetchClient';
import type { OfflineProduct, SyncResponse } from '@/services/offline/offline-product.types';
import * as FileSystem from 'expo-file-system/legacy';

const SYNC_ENDPOINT = '/supplier-app/products/sync';

// ─── Helpers (mirrors products.api.ts) ───────────────────────────────────────

const inferMimeType = (uri: string, fallback: string): string => {
    const normalized = (uri || '').split('?')[0].toLowerCase();
    if (normalized.endsWith('.png'))  return 'image/png';
    if (normalized.endsWith('.gif'))  return 'image/gif';
    if (normalized.endsWith('.webp')) return 'image/webp';
    if (normalized.endsWith('.mp4'))  return 'video/mp4';
    if (normalized.endsWith('.mov'))  return 'video/quicktime';
    return fallback;
};

const inferFileName = (uri: string, fallback: string): string => {
    const parts = (uri || '').split('/');
    return parts[parts.length - 1]?.split('?')[0] || fallback;
};

/**
 * Recursively builds a FormData object from a plain object.
 * Mirrors the appendToFormData logic in products.api.ts.
 */
function buildFormData(
    formData: FormData,
    data: any,
    parentKey: string = ''
): void {
    if (data === null || data === undefined) return;

    if (typeof data === 'object' && !Array.isArray(data)) {
        Object.keys(data).forEach((key) => {
            const fullKey = parentKey ? `${parentKey}[${key}]` : key;
            buildFormData(formData, data[key], fullKey);
        });
        return;
    }

    if (Array.isArray(data)) {
        data.forEach((item: any, idx: number) => {
            const fullKey = `${parentKey}[${idx}]`;
            buildFormData(formData, item, fullKey);
        });
        return;
    }

    formData.append(parentKey, String(data));
}

// ─── Sync API ─────────────────────────────────────────────────────────────────

export const offlineProductsApi = {
    /**
     * Upload an offline-created product to the server.
     *
     * Builds a multipart/form-data payload from the stored formPayload,
     * local image paths (file:// paths in documentDirectory), and the local_id.
     *
     * The server echoes back local_id in the response so we can map the
     * local record to the newly created server product_id.
     */
    async syncProduct(product: OfflineProduct): Promise<SyncResponse> {
        const url = SYNC_ENDPOINT;
        const formData = new FormData();

        // Log request parameters and file sizes
        console.log('🔄 [Offline Sync] Preparing Sync Payload:', {
            localId: product.localId,
            type: product.productType,
            sku: product.formPayload?.sku,
            name: product.formPayload?.name,
            imagesCount: product.localImagePaths?.length,
            hasVideo: !!product.localVideoPath,
        });

        if (product.localImagePaths && product.localImagePaths.length > 0) {
            for (let i = 0; i < product.localImagePaths.length; i++) {
                try {
                    const info = await FileSystem.getInfoAsync(product.localImagePaths[i]);
                    console.log(`📸 Image [${i}] size:`, info.exists ? `${(info.size / 1024 / 1024).toFixed(2)} MB` : 'does not exist', `Path: ${product.localImagePaths[i]}`);
                } catch (err) {
                    console.warn(`Failed to get size for image [${i}]:`, err);
                }
            }
        }

        if (product.localVideoPath) {
            try {
                const info = await FileSystem.getInfoAsync(product.localVideoPath);
                console.log(`🎥 Video size:`, info.exists ? `${(info.size / 1024 / 1024).toFixed(2)} MB` : 'does not exist', `Path: ${product.localVideoPath}`);
            } catch (err) {
                console.warn('Failed to get size for video:', err);
            }
        }

        // Echo key — backend returns this to map local → server
        formData.append('local_id', product.localId);

        // Rebuild images from locally-copied Document dir paths
        // These are file:// paths so they are treated as new uploads
        let newFileIndex = 0;
        for (const path of product.localImagePaths) {
            const mimeType = inferMimeType(path, 'image/jpeg');
            const fileName = inferFileName(path, `image_${newFileIndex}.jpg`);
            formData.append(`images[files][new_${newFileIndex}]`, {
                uri: formatFileUri(path),
                name: fileName,
                type: mimeType,
            } as any);
            newFileIndex++;
        }

        // Video (if any)
        if (product.localVideoPath) {
            const mimeType = inferMimeType(product.localVideoPath, 'video/mp4');
            const fileName = inferFileName(product.localVideoPath, 'video.mp4');
            formData.append('videos[files][new_0]', {
                uri: formatFileUri(product.localVideoPath),
                name: fileName,
                type: mimeType,
            } as any);
        }

        // All other form fields from the stored payload
        const payload: Record<string, any> = {
            ...product.formPayload,
            attribute_family_id: product.attributeFamilyId,
            // Ensure locale settings
            product_locale: product.formPayload.product_locale ?? 'all',
            url_key: product.formPayload.url_key || product.formPayload.sku || '',
        };

        // Remove images/video — already appended above
        delete payload.images;
        delete payload.video;

        buildFormData(formData, payload);

        return multipartFetch<SyncResponse>(url, formData);
    },
};
