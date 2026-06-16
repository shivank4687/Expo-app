/**
 * useOfflineSync
 *
 * React hook that automatically triggers the offline product sync queue
 * whenever the device comes back online or the app returns to the foreground.
 *
 * Also exposes a manual `triggerSync()` for the "Sync All" button.
 *
 * Usage:
 *   // Mount once at the app root (supplier drawer layout)
 *   useOfflineSync();
 */

import { useEffect, useRef, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { syncPendingProducts } from '@/services/offline/offline-sync.service';
import { loadOfflineProducts } from '@/store/slices/offlineProductsSlice';

export function useOfflineSync() {
    const dispatch = useAppDispatch();
    const isConnected = useAppSelector((state) => state.network.isConnected);
    const isSyncing = useAppSelector((state) => state.offlineProducts.isSyncing);
    const isLoaded  = useAppSelector((state) => state.offlineProducts.isLoaded);

    // Track the previous connection state to detect reconnects
    const prevConnected = useRef<boolean | null>(null);

    /**
     * Manual sync trigger — called by "Sync All" button.
     */
    const triggerSync = useCallback(async () => {
        if (isSyncing) return;
        await syncPendingProducts(dispatch);
    }, [dispatch, isSyncing]);

    // ── Load products from AsyncStorage on first mount ────────────────────
    useEffect(() => {
        if (!isLoaded) {
            dispatch(loadOfflineProducts());
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Auto-sync on network reconnect ────────────────────────────────────
    useEffect(() => {
        if (isConnected === null) return; // not yet determined

        const wasOffline = prevConnected.current === false;
        const isNowOnline = isConnected === true;

        if (wasOffline && isNowOnline && !isSyncing) {
            // Just came back online — run sync
            syncPendingProducts(dispatch);
        }

        prevConnected.current = isConnected;
    }, [isConnected, dispatch, isSyncing]);

    // ── Auto-sync on app foreground ───────────────────────────────────────
    useEffect(() => {
        const subscription = AppState.addEventListener(
            'change',
            (nextState: AppStateStatus) => {
                if (nextState === 'active' && isConnected && !isSyncing) {
                    syncPendingProducts(dispatch);
                }
            }
        );

        return () => subscription.remove();
    }, [dispatch, isConnected, isSyncing]);

    return { triggerSync, isSyncing };
}
