/**
 * useOfflineSync
 *
 * React hook that automatically triggers the offline product sync queue
 * whenever the device comes back online or the app returns to the foreground.
 *
 * Also exposes a manual `triggerSync()` for the "Sync All" button.
 *
 * IMPORTANT: Call this hook exactly ONCE at the app root (supplier drawer layout).
 * Do NOT call it inside individual screens — duplicate instances create racing
 * prevConnected refs and cause sync to silently not fire on WiFi reconnect.
 *
 * On first mount it performs crash recovery — any product or global flag left
 * in a "syncing" state from a previous app kill is reset before the first
 * sync attempt fires.
 *
 * Offline products are scoped per supplier: the hook loads only the current
 * supplier's drafts and clears the Redux list when the supplier changes
 * (logout or switch account).
 */

import { useEffect, useRef, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { syncPendingProducts } from '@/services/offline/offline-sync.service';
import { recoverStuckSyncingProducts } from '@/services/offline/offline-storage';
import {
    loadOfflineProducts,
    resetSyncing,
    clearOfflineProducts,
} from '@/store/slices/offlineProductsSlice';

export function useOfflineSync() {
    const dispatch = useAppDispatch();
    const isConnected = useAppSelector((state) => state.network.isConnected);
    const isSyncing = useAppSelector((state) => state.offlineProducts.isSyncing);
    // Track the current supplier ID for account-switching detection
    const supplierId = useAppSelector((state) => state.supplierAuth.supplier?.id ?? null);
    const prevSupplierIdRef = useRef<number | null>(null);

    // ── Crash recovery + initial load ─────────────────────────────────────
    // Run once on mount. Order matters:
    //   1. Reset Redux isSyncing flag + flip in-memory 'syncing' → 'pending'
    //   2. Reset AsyncStorage products stuck at 'syncing' → 'pending'
    //   3. Reload the current supplier's products from AsyncStorage
    //   4. If already online, kick off the sync queue immediately
    useEffect(() => {
        const initAndRecover = async () => {
            // Step 1: Reset Redux volatile flags
            dispatch(resetSyncing());

            // Step 2: Reset any products left at 'syncing' in AsyncStorage
            await recoverStuckSyncingProducts();

            // Step 3: Reload current supplier's products (supplierId available at mount)
            if (supplierId) {
                dispatch(loadOfflineProducts(supplierId));
                prevSupplierIdRef.current = supplierId;
            }

            // Step 4: Trigger sync if we are already online
            const netState = await NetInfo.fetch();
            const alreadyOnline =
                netState.isConnected === true && netState.isInternetReachable !== false;
            if (alreadyOnline && supplierId) {
                setTimeout(() => {
                    syncPendingProducts(dispatch, supplierId);
                }, 200);
            }
        };

        initAndRecover();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Account switch detection ──────────────────────────────────────────
    // When supplierId changes (login / logout / account switch):
    //   - Clear the current in-memory list immediately
    //   - If a new supplier logged in, load their products
    //   - If supplier logged out (null), just leave the list empty
    useEffect(() => {
        const prevId = prevSupplierIdRef.current;

        if (supplierId === prevId) return; // no change

        // Clear Redux list first (regardless of new value)
        dispatch(clearOfflineProducts());

        if (supplierId) {
            // New supplier — load their drafts from AsyncStorage
            dispatch(loadOfflineProducts(supplierId));
        }

        prevSupplierIdRef.current = supplierId;
    }, [supplierId, dispatch]);

    // ── Auto-sync on network reconnect ────────────────────────────────────
    // Uses NetInfo.addEventListener directly instead of tracking Redux state
    // via prevConnected ref. This avoids the race where:
    //   - prevConnected.current starts as null (not false)
    //   - isSyncing in the dep array causes the effect to re-register and
    //     overwrite prevConnected.current on every sync state change
    useEffect(() => {
        // Seed from current Redux value so the first event has correct context.
        let lastConnected: boolean | null = isConnected;

        const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
            const nowConnected =
                state.isConnected === true && state.isInternetReachable !== false;
            const wasOffline = lastConnected === false;

            if (wasOffline && nowConnected && supplierId) {
                // Genuine offline → online transition — kick off sync.
                // syncPendingProducts self-guards via isSyncingActive.
                console.log('[useOfflineSync] Network reconnected — triggering sync.');
                syncPendingProducts(dispatch, supplierId);
            }

            lastConnected = nowConnected;
        });

        return () => unsubscribe();
    }, [dispatch, supplierId]); // re-subscribe if supplier changes

    // ── Auto-sync on app foreground ───────────────────────────────────────
    useEffect(() => {
        const subscription = AppState.addEventListener(
            'change',
            (nextState: AppStateStatus) => {
                if (nextState === 'active' && isConnected && !isSyncing && supplierId) {
                    syncPendingProducts(dispatch, supplierId);
                }
            }
        );

        return () => subscription.remove();
    }, [dispatch, isConnected, isSyncing, supplierId]);

    /**
     * Manual sync trigger — called by "Sync All" button.
     */
    const triggerSync = useCallback(async () => {
        if (isSyncing || !supplierId) return;
        await syncPendingProducts(dispatch, supplierId);
    }, [dispatch, isSyncing, supplierId]);

    return { triggerSync, isSyncing };
}
