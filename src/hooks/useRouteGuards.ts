import { useCallback } from 'react';
import { useRouter, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useAppSelector } from '@/store/hooks';

/**
 * Guard for the Supplier Dashboard.
 * Ensures only authenticated suppliers can access this area.
 * Redirects to /add-phone if phone number is missing.
 * Redirects to the customer dashboard if they are not a supplier.
 */
export const useSupplierGuard = () => {
    const router = useRouter();
    const { isAuthenticated: isCustomerAuthenticated } = useAppSelector((state) => state.auth);
    const { isAuthenticated: isSupplierAuthenticated, isLoading, supplier } = useAppSelector((state) => state.supplierAuth);

    useFocusEffect(
        useCallback(() => {
            if (isLoading) return;

            if (isSupplierAuthenticated) {
                // Check for missing phone
                if (supplier && !supplier.phone) {
                    console.log('➡️ Supplier Guard: Redirecting to /add-phone');
                    router.replace('/add-phone');
                }
            } else {
                console.log('➡️ Supplier Guard: Not authenticated as supplier, redirecting to Shop');
                router.replace('/(drawer)/(tabs)');
            }
        }, [isSupplierAuthenticated, isLoading, supplier, router])
    );
};

/**
 * Guard for the Customer Dashboard / Shop.
 * Redirects suppliers to the supplier dashboard.
 * Redirects to /add-phone if phone number is missing.
 */
export const useCustomerGuard = () => {
    const router = useRouter();
    const { isAuthenticated: isCustomerAuthenticated, isLoading: isCustomerLoading, user } = useAppSelector((state) => state.auth);
    const { isAuthenticated: isSupplierAuthenticated, isLoading: isSupplierLoading } = useAppSelector((state) => state.supplierAuth);

    useFocusEffect(
        useCallback(() => {
            if (isCustomerLoading || isSupplierLoading) return;

            // Redirect supplier to supplier dashboard
            if (isSupplierAuthenticated) {
                console.log('➡️ Customer Guard: Supplier authenticated, redirecting to Supplier Dashboard');
                router.replace('/(supplier-drawer)/(supplier-tabs)');
                return;
            }

            // Check for missing phone for customer
            if (isCustomerAuthenticated && user && !user.phone) {
                console.log('➡️ Customer Guard: Redirecting to /add-phone');
                router.replace('/add-phone');
            }
        }, [isCustomerAuthenticated, isSupplierAuthenticated, isCustomerLoading, isSupplierLoading, user, router])
    );
};

/**
 * Guard for Auth screens (Login, Signup, etc).
 * Redirects already authenticated users to their respective dashboards.
 */
export const useAuthScreenGuard = () => {
    const router = useRouter();
    const params = useLocalSearchParams<{ redirect?: string }>();
    const { isAuthenticated: isCustomerAuthenticated, isLoading: isCustomerLoading } = useAppSelector((state) => state.auth);
    const { isAuthenticated: isSupplierAuthenticated, isLoading: isSupplierLoading } = useAppSelector((state) => state.supplierAuth);

    useFocusEffect(
        useCallback(() => {
            if (isCustomerLoading || isSupplierLoading) return;

            if (isSupplierAuthenticated) {
                console.log('➡️ Auth Guard: Supplier already authenticated, redirecting to Supplier Dashboard');
                if (router.canGoBack()) router.dismissAll();
                router.replace('/(supplier-drawer)/(supplier-tabs)');
            } else if (isCustomerAuthenticated) {
                console.log('➡️ Auth Guard: Customer already authenticated, redirecting to Shop');
                if (router.canGoBack()) router.dismissAll();
                if (params.redirect === 'cart') {
                    router.replace('/(drawer)/(tabs)/cart');
                } else {
                    router.replace('/(drawer)/(tabs)');
                }
            }
        }, [isCustomerAuthenticated, isSupplierAuthenticated, isCustomerLoading, isSupplierLoading, router, params.redirect])
    );
};

/**
 * Strict Guard for standalone screens that require Customer Authentication.
 * Redirects to /login if unauthenticated, or supplier dashboard if supplier.
 */
export const useRequireCustomerAuth = () => {
    const router = useRouter();
    const { isAuthenticated: isCustomerAuthenticated, isLoading: isCustomerLoading } = useAppSelector((state) => state.auth);
    const { isAuthenticated: isSupplierAuthenticated, isLoading: isSupplierLoading } = useAppSelector((state) => state.supplierAuth);

    useFocusEffect(
        useCallback(() => {
            if (isCustomerLoading || isSupplierLoading) return;

            if (isSupplierAuthenticated) {
                console.log('➡️ Require Customer Auth: Supplier authenticated, redirecting to Supplier Dashboard');
                if (router.canGoBack()) router.dismissAll();
                router.replace('/(supplier-drawer)/(supplier-tabs)');
            } else if (!isCustomerAuthenticated) {
                console.log('➡️ Require Customer Auth: Not authenticated, redirecting to Login');
                router.replace('/login');
            }
        }, [isCustomerAuthenticated, isSupplierAuthenticated, isCustomerLoading, isSupplierLoading, router])
    );
};

/**
 * Strict Guard for standalone screens that require Supplier Authentication.
 * Redirects to /login if unauthenticated or not a supplier.
 */
export const useRequireSupplierAuth = () => {
    const router = useRouter();
    const { isAuthenticated: isSupplierAuthenticated, isLoading: isSupplierLoading } = useAppSelector((state) => state.supplierAuth);

    useFocusEffect(
        useCallback(() => {
            if (isSupplierLoading) return;

            if (!isSupplierAuthenticated) {
                console.log('➡️ Require Supplier Auth: Not authenticated as supplier, redirecting to Login');
                router.replace({
                    pathname: '/login',
                    params: { type: 'supplier' }
                });
            }
        }, [isSupplierAuthenticated, isSupplierLoading, router])
    );
};
