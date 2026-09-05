import { useRequireSupplierAuth } from '@/hooks/useRouteGuards';
import React from 'react';
import OfflineAddEditProductScreen from '@/features/supplier-panel/product/offline/OfflineAddEditProductScreen';

export default function OfflineEditProduct() {
    useRequireSupplierAuth();

    // localId is picked up via useLocalSearchParams() inside the screen
    return <OfflineAddEditProductScreen />;
}
