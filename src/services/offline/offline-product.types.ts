/**
 * Offline Product Types
 *
 * Defines the shape of locally-stored (offline) products and sync errors.
 * These products are created while the device is offline and uploaded
 * to the server when connectivity is restored.
 */

/** Current synchronisation state of an offline product */
export type SyncStatus = 'pending' | 'syncing' | 'synced' | 'error';

/**
 * Structured sync error returned from POST /supplier-app/products/sync.
 * fieldErrors mirrors Laravel's Validator::errors()->toArray() shape.
 */
export interface SyncError {
    /** HTTP status code (422, 500, 0 for network error) */
    code: number;
    /** Human-readable summary */
    message: string;
    /** Per-field validation errors, e.g. { sku: ['The sku has already been taken.'] } */
    fieldErrors: Record<string, string[]> | null;
}

/**
 * A product saved locally while the supplier was offline.
 *
 * - `operation` is always 'create' — editing already-synced products while
 *   offline is not in scope; synced products are deleted from this store.
 * - `formPayload` is the raw merged output of all card getData() calls
 *   (minus images/video, which are tracked separately via local paths).
 * - `localImagePaths` and `localVideoPath` point to files that have been
 *   copied into expo-file-system's documentDirectory so they survive
 *   between app sessions.
 */
export interface OfflineProduct {
    /** Unique local identifier, e.g. "off_1718180000_abc123" */
    localId: string;

    /**
     * Server ID of the supplier who created this draft.
     * Used to filter products when a different supplier logs in on the same device.
     */
    supplierId: number;

    syncStatus: SyncStatus;

    /** Only 'create' is supported. */
    operation: 'create';

    /** 'simple' or 'configurable' */
    productType: 'simple' | 'configurable';

    /** Denormalized product name for list display */
    productName: string;

    /**
     * Full merged form payload (essentialData + priceStockData + ...).
     * Images and video are stripped out; they are referenced via
     * localImagePaths / localVideoPath instead.
     */
    formPayload: Record<string, any>;

    /** file:// paths inside documentDirectory/offline_products/ */
    localImagePaths: string[];

    /** file:// paths inside documentDirectory/offline_products/, or null */
    localVideoPath: string | null;

    /**
     * Variant images copied to documentDirectory, keyed by variant key.
     * e.g. { "variant_0": ["file:///…/variant_variant_0_123_0.jpg"] }
     * Only populated for configurable products.
     */
    localVariantImagePaths: Record<string, string[]>;

    /** Populated when syncStatus === 'error' */
    errorDetails: SyncError | null;

    /** Number of failed sync attempts (max 3, then stops retrying) */
    retryCount: number;

    /** Attribute family ID used when building the product create payload */
    attributeFamilyId: number;

    /** ISO 8601 timestamp */
    createdAt: string;

    /** ISO 8601 timestamp — updated on every local edit */
    updatedAt: string;

    /** ISO 8601 timestamp — set after successful sync (product then deleted) */
    syncedAt: string | null;
}

/** Response shape from POST /supplier-app/products/sync */
export interface SyncResponse {
    local_id: string;
    synced: boolean;
    server_id: number | null;
    errors: Record<string, string[]> | null;
    message: string;
}
