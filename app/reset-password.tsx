import { Stack } from 'expo-router';
import ResetPasswordScreen from '@/features/auth/screens/ResetPasswordScreen';

export default function ResetPassword() {
    return (
        <>
            <Stack.Screen
                options={{
                    title: 'Reset Password',
                    headerShown: true,
                    headerBackTitle: 'Back',
                }}
            />
            <ResetPasswordScreen />
        </>
    );
}
