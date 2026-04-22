import { useEffect } from 'react';
import { useRouter } from 'expo-router';
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

    useEffect(() => {
        // Wait for auth check to complete
        if (isLoading) return;

        // Redirect to home if not authenticated
        if (!isAuthenticated) {
            console.log('[useRequireAuth] User not authenticated, redirecting to home');
            // Use setTimeout to avoid navigation conflicts during state updates
            setTimeout(() => {
                router.replace('/');
            }, 0);
        }
    }, [isAuthenticated, isLoading, router]);

    return {
        isAuthenticated,
        isLoading,
        user,
    };
};

