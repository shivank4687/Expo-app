import { useRequireCustomerAuth } from '@/hooks/useRouteGuards';
import { AddressesScreen } from '@/features/address/screens/AddressesScreen';


export default function ProtectedAddressesScreen() {
    useRequireCustomerAuth();
    return <AddressesScreen />;
}


