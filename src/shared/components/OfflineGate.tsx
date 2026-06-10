import React, { useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { setNetworkStatus } from '@/store/slices/networkSlice';
import { useNetworkStatus } from '@/shared/hooks/useNetworkStatus';
import {
  SupplierOfflineScreen,
  CustomerOfflineScreen,
  GuestOfflineScreen,
} from '@/shared/components/OfflineScreens';

interface OfflineGateProps {
  children: React.ReactNode;
}

/**
 * OfflineGate
 *
 * Wraps its children and intercepts rendering when the device is offline.
 * Shows a role-appropriate offline screen based on authentication state:
 *  - Supplier (logged in)  → SupplierOfflineScreen
 *  - Customer (logged in)  → CustomerOfflineScreen
 *  - Guest (not logged in) → GuestOfflineScreen
 *
 * When online, renders children normally — zero overhead.
 */
export function OfflineGate({ children }: OfflineGateProps) {
  const dispatch = useAppDispatch();
  const { isConnected, isChecking, retry } = useNetworkStatus();

  const isSupplierAuthenticated = useAppSelector(
    (state) => state.supplierAuth.isAuthenticated
  );
  const isCustomerAuthenticated = useAppSelector(
    (state) => state.auth.isAuthenticated
  );

  // Sync to Redux so other parts of the app can read global network state
  useEffect(() => {
    dispatch(setNetworkStatus(isConnected));
  }, [isConnected, dispatch]);

  // Online — render normally
  if (isConnected) {
    return <>{children}</>;
  }

  // Offline — pick the right screen based on role
  if (isSupplierAuthenticated) {
    return <SupplierOfflineScreen isChecking={isChecking} onRetry={retry} />;
  }

  if (isCustomerAuthenticated) {
    return <CustomerOfflineScreen isChecking={isChecking} onRetry={retry} />;
  }

  return <GuestOfflineScreen isChecking={isChecking} onRetry={retry} />;
}
