/**
 * Offline Sync Service
 *
 * Processes the offline product queue: picks pending/errored products (up to
 * retryCount < 3) and calls POST /supplier-app/products/sync for each one.
 *
 * On success  → removes product from AsyncStorage and Redux.
 * On failure  → marks product as 'error', stores fieldErrors, increments retryCount.
 */

import { AppDispatch } from '@/store/store';
import {
    getPendingProducts,
    updateOfflineProduct,
    deleteOfflineProduct,
} from '@/services/offline/offline-storage';
import { deleteLocalMedia } from '@/services/offline/offline-media';
import {
    upsertOfflineProduct,
    removeOfflineProduct,
    setSyncing,
} from '@/store/slices/offlineProductsSlice';
import { offlineProductsApi } from '@/services/api/offline-products.api';
import type { SyncError } from '@/services/offline/offline-product.types';

/**
 * Process all pending offline products one at a time.
 *
 * Call this when:
 *  - Network reconnects (useOfflineSync hook)
 *  - App comes to foreground (useOfflineSync hook)
 *  - Supplier taps "Sync All" button
 */
export async function syncPendingProducts(dispatch: AppDispatch): Promise<void> {
    const pending = await getPendingProducts();

    if (pending.length === 0) return;

    dispatch(setSyncing(true));

    for (const product of pending) {
        // Mark as syncing in Redux (for UI spinner)
        dispatch(upsertOfflineProduct({ ...product, syncStatus: 'syncing' }));

        try {
            const result = await offlineProductsApi.syncProduct(product);

            if (result.synced) {
                // ── Success ──────────────────────────────────────────────
                // Clean up local media files
                await deleteLocalMedia([
                    ...product.localImagePaths,
                    ...(product.localVideoPath ? [product.localVideoPath] : []),
                ]);

                // Remove from AsyncStorage and Redux
                await deleteOfflineProduct(product.localId);
                dispatch(removeOfflineProduct(product.localId));

            } else {
                // ── API returned 422 with structured errors ───────────────
                throw {
                    structured: true,
                    errors: result.errors,
                    message: result.message,
                    code: 422,
                };
            }

        } catch (err: any) {
            // Build a structured SyncError regardless of error shape
            const syncError: SyncError = {
                code: err.code ?? err.response?.status ?? 0,
                message: err.message ?? err.response?.data?.message ?? 'Sync failed',
                fieldErrors: err.structured
                    ? err.errors
                    : (err.response?.data?.errors ?? null),
            };

            const updatedRetryCount = product.retryCount + 1;

            await updateOfflineProduct(product.localId, {
                syncStatus: 'error',
                errorDetails: syncError,
                retryCount: updatedRetryCount,
            });

            dispatch(
                upsertOfflineProduct({
                    ...product,
                    syncStatus: 'error',
                    errorDetails: syncError,
                    retryCount: updatedRetryCount,
                })
            );

            console.warn(
                `[offline-sync] Product ${product.localId} sync failed (attempt ${updatedRetryCount}):`,
                syncError.message
            );
        }
    }

    dispatch(setSyncing(false));
}
