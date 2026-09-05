import { useRequireCustomerAuth } from '@/hooks/useRouteGuards';
import React from 'react';
import { RequestedQuotesListScreen } from '@/features/quotes/screens/RequestedQuotesListScreen';


export default function ProtectedRequestedQuotesListScreen() {
    useRequireCustomerAuth();
    return <RequestedQuotesListScreen />;
}


