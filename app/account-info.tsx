import { useRequireCustomerAuth } from '@/hooks/useRouteGuards';
import { AccountInformationScreen } from '@/features/auth/screens/AccountInformationScreen';


export default function ProtectedAccountInformationScreen() {
    useRequireCustomerAuth();
    return <AccountInformationScreen />;
}

