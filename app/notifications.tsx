import { useRequireCustomerAuth } from '@/hooks/useRouteGuards';
import { NotificationsScreen } from '@/features/notifications/screens/NotificationsScreen';


export default function ProtectedNotificationsScreen() {
    useRequireCustomerAuth();
    return <NotificationsScreen />;
}

