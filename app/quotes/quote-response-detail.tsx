import { useRequireCustomerAuth } from '@/hooks/useRouteGuards';
import React from 'react';
import { QuoteResponseDetailScreen } from '@/features/quotes/screens/QuoteResponseDetailScreen';


export default function ProtectedQuoteResponseDetailScreen() {
    useRequireCustomerAuth();
    return <QuoteResponseDetailScreen />;
}

