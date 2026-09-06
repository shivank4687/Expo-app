import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { useEffect, useState, useCallback, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';

export interface NetworkStatus {
  isConnected: boolean;
  isChecking: boolean;
  retry: () => void;
}

/**
 * useNetworkStatus
 *
 * Subscribes to real-time network changes via @react-native-community/netinfo.
 * Also re-checks connectivity when the app comes back to the foreground.
 * Includes a debounce mechanism to prevent brief offline flashes.
 */
export function useNetworkStatus(): NetworkStatus {
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const offlineTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setConnectedState = useCallback((connected: boolean) => {
    if (connected) {
      if (offlineTimeoutRef.current) {
        clearTimeout(offlineTimeoutRef.current);
        offlineTimeoutRef.current = null;
      }
      setIsConnected(true);
    } else {
      if (!offlineTimeoutRef.current) {
        // Delay showing offline state to prevent flickering
        offlineTimeoutRef.current = setTimeout(() => {
          setIsConnected(false);
          offlineTimeoutRef.current = null;
        }, 1000); // 1-second debounce buffer
      }
    }
  }, []);

  const checkConnectivity = useCallback(async () => {
    setIsChecking(true);
    try {
      const state = await NetInfo.fetch();
      setConnectedState(state.isConnected === true && state.isInternetReachable !== false);
    } catch {
      setConnectedState(false);
    } finally {
      setIsChecking(false);
    }
  }, [setConnectedState]);

  useEffect(() => {
    // Initial check
    checkConnectivity();

    // Real-time subscription
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      const connected = state.isConnected === true && state.isInternetReachable !== false;
      setConnectedState(connected);
    });

    // Re-check when app comes to foreground
    const handleAppState = (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        checkConnectivity();
      }
    };
    const appStateSub = AppState.addEventListener('change', handleAppState);

    return () => {
      unsubscribe();
      appStateSub.remove();
      if (offlineTimeoutRef.current) {
        clearTimeout(offlineTimeoutRef.current);
      }
    };
  }, [checkConnectivity, setConnectedState]);

  return { isConnected, isChecking, retry: checkConnectivity };
}
