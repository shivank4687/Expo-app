/**
 * Offline Product Storage
 *
 * Persists offline products using AsyncStorage.
 *
 * Key schema:
 *   @offline_product_index   → string[]         (ordered list of localIds)
 *   @offline_product_{id}    → OfflineProduct    (serialised as JSON)
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { OfflineProduct, SyncStatus } from './offline-product.types';

const INDEX_KEY = '@offline_product_index';
const productKey = (localId: string) => `@offline_product_${localId}`;

// ─── Index helpers ────────────────────────────────────────────────────────────

async function getIndex(): Promise<string[]> {
    try {
        const raw = await AsyncStorage.getItem(INDEX_KEY);
        return raw ? (JSON.parse(raw) as string[]) : [];
    } catch {
        return [];
    }
}

async function saveIndex(ids: string[]): Promise<void> {
    await AsyncStorage.setItem(INDEX_KEY, JSON.stringify(ids));
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Persist a new offline product.
 * Appends to the index if not already present.
 */
export async function saveOfflineProduct(product: OfflineProduct): Promise<void> {
    const ids = await getIndex();
    if (!ids.includes(product.localId)) {
        ids.push(product.localId);
        await saveIndex(ids);
    }
    await AsyncStorage.setItem(productKey(product.localId), JSON.stringify(product));
}

/**
 * Retrieve a single offline product by localId.
 * Returns null if not found.
 */
export async function getOfflineProduct(localId: string): Promise<OfflineProduct | null> {
    try {
        const raw = await AsyncStorage.getItem(productKey(localId));
        return raw ? (JSON.parse(raw) as OfflineProduct) : null;
    } catch {
        return null;
    }
}

/**
 * Retrieve all stored offline products, in creation order.
 */
export async function getAllOfflineProducts(): Promise<OfflineProduct[]> {
    const ids = await getIndex();
    const results: OfflineProduct[] = [];
    for (const id of ids) {
        const p = await getOfflineProduct(id);
        if (p) results.push(p);
    }
    return results;
}

/**
 * Retrieve all offline products for a specific supplier.
 * Products without a supplierId (legacy records) are excluded.
 */
export async function getOfflineProductsBySupplier(
    supplierId: number
): Promise<OfflineProduct[]> {
    const all = await getAllOfflineProducts();
    return all.filter((p) => p.supplierId === supplierId);
}

/**
 * Apply a partial update to an existing offline product.
 * Always updates the `updatedAt` timestamp.
 */
export async function updateOfflineProduct(
    localId: string,
    patch: Partial<OfflineProduct>
): Promise<void> {
    const existing = await getOfflineProduct(localId);
    if (!existing) return;
    const updated: OfflineProduct = {
        ...existing,
        ...patch,
        updatedAt: new Date().toISOString(),
    };
    await AsyncStorage.setItem(productKey(localId), JSON.stringify(updated));
}

/**
 * Delete an offline product and remove it from the index.
 */
export async function deleteOfflineProduct(localId: string): Promise<void> {
    await AsyncStorage.removeItem(productKey(localId));
    const ids = await getIndex();
    await saveIndex(ids.filter((id) => id !== localId));
}

/**
 * Returns products that should be included in the next sync run:
 *  - status is 'pending' OR 'error' with retryCount < 3
 *  - If supplierId is provided, only returns that supplier's products.
 */
export async function getPendingProducts(supplierId?: number): Promise<OfflineProduct[]> {
    const all = supplierId
        ? await getOfflineProductsBySupplier(supplierId)
        : await getAllOfflineProducts();
    return all.filter(
        (p) =>
            p.syncStatus === 'pending' ||
            (p.syncStatus === 'error' && p.retryCount < 3)
    );
}

/**
 * Recover products left in 'syncing' state by a previous app crash or kill.
 * Resets them to 'pending' so they are picked up on the next sync run.
 *
 * Call this once on app startup, before the first sync attempt.
 */
export async function recoverStuckSyncingProducts(): Promise<void> {
    const all = await getAllOfflineProducts();
    for (const product of all) {
        if (product.syncStatus === 'syncing') {
            await updateOfflineProduct(product.localId, { syncStatus: 'pending' });
        }
    }
}

/**
 * Convenience: update only the syncStatus of a product.
 */
export async function setProductSyncStatus(
    localId: string,
    status: SyncStatus
): Promise<void> {
    await updateOfflineProduct(localId, { syncStatus: status });
}

/**
 * Generate a unique local ID for a new offline product.
 * Format: off_{timestamp}_{random6}
 */
export function generateLocalId(): string {
    const ts = Date.now();
    const rand = Math.random().toString(36).slice(2, 8);
    return `off_${ts}_${rand}`;
}
