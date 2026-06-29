/**
 * Offline Media Helper
 *
 * Copies image/video files from temporary picker cache locations into the
 * app's permanent documentDirectory so they persist between sessions and
 * are available when the sync runs later (possibly much later).
 *
 * Destination: documentDirectory/offline_products/{timestamp}_{index}.{ext}
 */

import * as FileSystem from 'expo-file-system/legacy';

const DEST_DIR = `${FileSystem.documentDirectory}offline_products/`;

/** Returns true for local device file URIs (needs copying) */
function isLocalUri(uri: string): boolean {
    if (!uri || typeof uri !== 'string') return false;
    return (
        uri.startsWith('file://') ||
        uri.startsWith('content://') ||
        uri.startsWith('ph://') ||
        uri.startsWith('assets-library://') ||
        uri.startsWith('blob:')
    );
}

/** Ensure the destination directory exists */
async function ensureDir(): Promise<void> {
    const info = await FileSystem.getInfoAsync(DEST_DIR);
    if (!info.exists) {
        await FileSystem.makeDirectoryAsync(DEST_DIR, { intermediates: true });
    }
}

/**
 * Copy a list of media items (images or video objects from card getData())
 * to the app's documentDirectory.
 *
 * Items can be:
 *   - A string URI
 *   - An object with { uri, url, id, ... }
 *
 * Returns an array of local `file://` paths for the copied files.
 * Server URLs (already uploaded images) and items without a local URI
 * are skipped (returns empty string for those positions, then filtered).
 */
export async function copyMediaToDocuments(mediaItems: any[]): Promise<string[]> {
    if (!mediaItems || mediaItems.length === 0) return [];

    await ensureDir();

    const timestamp = Date.now();
    const results: string[] = [];

    for (let i = 0; i < mediaItems.length; i++) {
        const item = mediaItems[i];
        const uri = typeof item === 'object' ? (item.uri || item.url || '') : (item || '');

        if (!uri || !isLocalUri(uri)) {
            // Skip server URLs or nulls
            continue;
        }

        try {
            const ext = uri.split('?')[0].split('.').pop() || 'jpg';
            const dest = `${DEST_DIR}img_${timestamp}_${i}.${ext}`;
            await FileSystem.copyAsync({ from: uri, to: dest });
            results.push(dest);
        } catch (err) {
            console.warn(`[offline-media] Failed to copy media item ${i}:`, err);
        }
    }

    return results;
}

/**
 * Copy a single video item to documentDirectory.
 * Returns the local path or null if skipped.
 */
export async function copyVideoToDocuments(videoItem: any): Promise<string | null> {
    if (!videoItem) return null;

    const uri = typeof videoItem === 'object' ? (videoItem.uri || videoItem.url || '') : (videoItem || '');
    if (!uri || !isLocalUri(uri)) return null;

    await ensureDir();

    try {
        const ext = uri.split('?')[0].split('.').pop() || 'mp4';
        const dest = `${DEST_DIR}vid_${Date.now()}.${ext}`;
        await FileSystem.copyAsync({ from: uri, to: dest });
        return dest;
    } catch (err) {
        console.warn('[offline-media] Failed to copy video:', err);
        return null;
    }
}

/**
 * Copy all variant images from the formPayload.variants object to documentDirectory.
 *
 * Accepts the `variants` value from PriceStockVariantsCard.getData():
 *   { "variant_0": { images: [{ uri, id }], sku, price, ... }, ... }
 *
 * Returns a map of variantKey → array of permanent local file:// paths.
 * Variants with no local images produce no entry in the result map.
 *
 * Call this during Save Offline, then replace the raw URIs in formPayload
 * with the returned permanent paths so they survive between app sessions.
 */
export async function copyVariantImagesToDocuments(
    variants: Record<string, any>
): Promise<Record<string, string[]>> {
    const result: Record<string, string[]> = {};

    if (!variants || Object.keys(variants).length === 0) return result;

    await ensureDir();

    const timestamp = Date.now();

    for (const [variantKey, variant] of Object.entries(variants)) {
        const images: any[] = variant?.images ?? [];
        const paths: string[] = [];

        for (let i = 0; i < images.length; i++) {
            const img = images[i];
            const uri = typeof img === 'object' ? (img.uri || img.url || '') : (img || '');
            if (!uri || !isLocalUri(uri)) continue;

            try {
                const ext = uri.split('?')[0].split('.').pop() || 'jpg';
                const dest = `${DEST_DIR}variant_${variantKey}_${timestamp}_${i}.${ext}`;
                await FileSystem.copyAsync({ from: uri, to: dest });
                paths.push(dest);
            } catch (err) {
                console.warn(`[offline-media] Failed to copy variant image ${variantKey}[${i}]:`, err);
            }
        }

        if (paths.length > 0) {
            result[variantKey] = paths;
        }
    }

    return result;
}

/**
 * Delete a set of locally-copied media files.
 * Used to clean up when a synced product is removed from the offline store.
 */
export async function deleteLocalMedia(paths: string[]): Promise<void> {
    for (const path of paths) {
        try {
            const info = await FileSystem.getInfoAsync(path);
            if (info.exists) {
                await FileSystem.deleteAsync(path, { idempotent: true });
            }
        } catch {
            // Silently ignore deletion errors
        }
    }
}
