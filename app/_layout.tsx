import { Stack } from 'expo-router';
import { AuthProvider } from '@/features/auth/context/AuthContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack>
        <Stack.Screen name="(drawer)" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ title: 'Login', headerShown: false }} />
        <Stack.Screen name="signup" options={{ title: 'Sign Up', headerShown: false }} />
        <Stack.Screen
          name="product/[id]"
          options={{
            title: 'Product Details',
            headerBackTitle: 'Back'
          }}
        />
      </Stack>
    </AuthProvider>
  );
}
