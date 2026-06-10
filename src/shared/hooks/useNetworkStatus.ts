import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { useEffect, useState, useCallback } from 'react';
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
 */
export function useNetworkStatus(): NetworkStatus {
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [isChecking, setIsChecking] = useState<boolean>(false);

  const checkConnectivity = useCallback(async () => {
    setIsChecking(true);
    try {
      const state = await NetInfo.fetch();
      setIsConnected(state.isConnected === true && state.isInternetReachable !== false);
    } catch {
      setIsConnected(false);
    } finally {
      setIsChecking(false);
    }
  }, []);

  useEffect(() => {
    // Initial check
    checkConnectivity();

    // Real-time subscription
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      const connected = state.isConnected === true && state.isInternetReachable !== false;
      setIsConnected(connected);
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
    };
  }, [checkConnectivity]);

  return { isConnected, isChecking, retry: checkConnectivity };
}
