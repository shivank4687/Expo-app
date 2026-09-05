import { useRequireCustomerAuth } from '@/hooks/useRouteGuards';
import React from 'react';
import { QuoteDetailScreen } from '@/features/quotes/screens/QuoteDetailScreen';


export default function ProtectedQuoteDetailScreen() {
    useRequireCustomerAuth();
    return <QuoteDetailScreen />;
}


