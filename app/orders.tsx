import { useRequireCustomerAuth } from '@/hooks/useRouteGuards';
import { OrdersScreen } from '@/features/account/screens/OrdersScreen';

export default function OrdersRoute() {
    useRequireCustomerAuth();

    return <OrdersScreen standalone />;
}
