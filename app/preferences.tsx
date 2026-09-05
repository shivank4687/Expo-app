import { useRequireCustomerAuth } from '@/hooks/useRouteGuards';
import { PreferencesScreen } from '@/features/settings/screens/PreferencesScreen';


export default function ProtectedPreferencesScreen() {
    useRequireCustomerAuth();
    return <PreferencesScreen />;
}

