import { Stack } from 'expo-router';

export default function MessagingLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="messages" />
            <Stack.Screen name="chat/[threadId]" />
        </Stack>
    );
}
