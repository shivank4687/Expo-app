import { useRequireCustomerAuth } from '@/hooks/useRouteGuards';
import { WishlistScreen } from '@/features/wishlist/screens/WishlistScreen';


export default function ProtectedWishlistScreen() {
    useRequireCustomerAuth();
    return <WishlistScreen />;
}


