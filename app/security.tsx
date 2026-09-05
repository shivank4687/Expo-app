import { useRequireCustomerAuth } from '@/hooks/useRouteGuards';
import { SecurityScreen } from '@/features/account/screens/SecurityScreen';


export default function ProtectedSecurityScreen() {
    useRequireCustomerAuth();
    return <SecurityScreen />;
}

