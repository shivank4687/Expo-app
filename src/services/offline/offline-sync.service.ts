/**
 * Offline Sync Service
 *
 * Processes the offline product queue: picks pending/errored products (up to
 * retryCount < 3) and calls POST /supplier-app/products/sync for each one.
 *
 * On success  → removes product from AsyncStorage and Redux.
 * On failure  → marks product as 'error', stores fieldErrors, increments retryCount.
 *
 * Crash safety: products are written to AsyncStorage as 'syncing' only during
 * the active API call. The startup recovery in useOfflineSync resets any
 * 'syncing' entries back to 'pending' so they are retried on the next launch.
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

let isSyncingActive = false;
/** Safety timeout — auto-releases the lock if a sync hangs for > 5 minutes */
let syncLockTimeout: ReturnType<typeof setTimeout> | null = null;

/**
 * Process all pending offline products one at a time.
 *
 * Call this when:
 *  - Network reconnects (useOfflineSync hook)
 *  - App comes to foreground (useOfflineSync hook)
 *  - Supplier taps "Sync All" button
 *
 * @param supplierId  When provided, only syncs drafts belonging to this supplier.
 */
export async function syncPendingProducts(
    dispatch: AppDispatch,
    supplierId?: number
): Promise<void> {
    if (isSyncingActive) {
        console.log('[offline-sync] Sync already active, skipping duplicate call.');
        return;
    }

    isSyncingActive = true;

    // Auto-release the lock after 5 minutes. Protects against a permanently
    // blocked queue if an API call hangs without resolving or rejecting.
    syncLockTimeout = setTimeout(() => {
        console.warn('[offline-sync] Lock timeout — releasing stuck sync lock after 5 min.');
        isSyncingActive = false;
    }, 5 * 60 * 1000);

    try {
        const pending = await getPendingProducts(supplierId);

        if (pending.length === 0) return;

        dispatch(setSyncing(true));

        for (const product of pending) {
            // Write 'syncing' to AsyncStorage BEFORE the API call.
            // If the app is killed during the request, the startup recovery
            // in useOfflineSync will reset it back to 'pending'.
            await updateOfflineProduct(product.localId, { syncStatus: 'syncing' });

            // Mark as syncing in Redux (for UI spinner)
            dispatch(upsertOfflineProduct({ ...product, syncStatus: 'syncing' }));

            try {
                const result = await offlineProductsApi.syncProduct(product);

                if (result.synced) {
                    // ── Success ──────────────────────────────────────────────
                    // Clean up local media files: master images, video, and
                    // all variant images for configurable products.
                    const variantImagePaths = Object.values(
                        product.localVariantImagePaths ?? {}
                    ).flat();

                    await deleteLocalMedia([
                        ...product.localImagePaths,
                        ...(product.localVideoPath ? [product.localVideoPath] : []),
                        ...variantImagePaths,
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
    } finally {
        if (syncLockTimeout) {
            clearTimeout(syncLockTimeout);
            syncLockTimeout = null;
        }
        isSyncingActive = false;
        dispatch(setSyncing(false));
    }
}
