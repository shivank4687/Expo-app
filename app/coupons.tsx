import { useRequireCustomerAuth } from '@/hooks/useRouteGuards';
import { PromotionsScreen } from '@/features/promotions/screens/PromotionsScreen';
 

export default function ProtectedPromotionsScreen() {
    useRequireCustomerAuth();
    return <PromotionsScreen />;
}

