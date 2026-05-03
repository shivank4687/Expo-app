import { useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { useAppSelector } from '@/store/hooks';

/**
 * useRequireAuth Hook
 * Redirects to login page if user is not authenticated
 * Use this hook in any screen that requires authentication
 * 
 * @returns { isAuthenticated, isLoading, user }
 */
export const useRequireAuth = () => {
    const router = useRouter();
    const { isAuthenticated, isLoading, user } = useAppSelector((state) => state.auth);
    const { isAuthenticated: isSupplierAuthenticated, isLoading: isSupplierLoading } = useAppSelector((state) => state.supplierAuth);
    const segments = useSegments();

    useEffect(() => {
        // Wait for auth check to complete
        if (isLoading || isSupplierLoading) return;

        // Check if we are on an auth screen
        const isAuthScreen = ['login', 'signup', 'otp-verification', 'forgot-password', 'reset-password', 'index'].includes(segments[0] as string);

        // Redirect to home if not authenticated and NOT on an auth screen
        if (!isAuthenticated && !isSupplierAuthenticated && !isAuthScreen) {
            console.log('[useRequireAuth] User not authenticated on protected route, redirecting to home');
            // Use setTimeout to avoid navigation conflicts during state updates
            setTimeout(() => {
                router.replace('/');
            }, 0);
        }
    }, [isAuthenticated, isSupplierAuthenticated, isLoading, isSupplierLoading, router, segments]);

    return {
        isAuthenticated,
        isLoading,
        user,
    };
};

