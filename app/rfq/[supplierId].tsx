import { useRequireCustomerAuth } from '@/hooks/useRouteGuards';
import React from 'react';
import { RFQScreen } from '@/features/rfq/screens/RFQScreen';


export default function ProtectedRFQScreen() {
    useRequireCustomerAuth();
    return <RFQScreen />;
}


