import { useRequireSupplierAuth } from '@/hooks/useRouteGuards';
import React from 'react';
import OfflineAddEditProductScreen from '@/features/supplier-panel/product/offline/OfflineAddEditProductScreen';

export default function OfflineAddProduct() {
    useRequireSupplierAuth();

    return <OfflineAddEditProductScreen />;
}
