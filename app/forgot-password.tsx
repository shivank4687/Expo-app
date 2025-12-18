import { Stack } from 'expo-router';
import ForgotPasswordScreen from '@/features/auth/screens/ForgotPasswordScreen';

export default function ForgotPassword() {
    return (
        <>
            <Stack.Screen
                options={{
                    title: 'Forgot Password',
                    headerShown: true,
                    headerBackTitle: 'Back',
                }}
            />
            <ForgotPasswordScreen />
        </>
    );
}
