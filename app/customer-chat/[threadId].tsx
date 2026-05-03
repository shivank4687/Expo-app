import { Stack } from 'expo-router';
import { ChatMessagesScreen } from '@/features/messages/screens/ChatMessagesScreen';

export default function CustomerChatScreen() {
    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <ChatMessagesScreen />
        </>
    );
}
