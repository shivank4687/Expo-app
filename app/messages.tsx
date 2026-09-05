import { useRequireCustomerAuth } from '@/hooks/useRouteGuards';
import { MessagesListScreen } from '@/features/messages/screens/MessagesListScreen';


export default function ProtectedMessagesListScreen() {
    useRequireCustomerAuth();
    return <MessagesListScreen />;
}


