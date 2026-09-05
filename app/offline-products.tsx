import { useRequireSupplierAuth } from '@/hooks/useRouteGuards';
import React from 'react';
import { OfflineProductsScreen } from '@/features/supplier-panel/product/offline/OfflineProductsScreen';

export default function OfflineProducts() {
    useRequireSupplierAuth();

    return <OfflineProductsScreen />;
}
