import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAppSelector } from '@/store/hooks';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { theme } from '@/theme';

export default function Index() {
  const router = useRouter();
  const { isAuthenticated: isCustomerAuthenticated, isLoading: isCustomerLoading } = useAppSelector((state) => state.auth);
  const { isAuthenticated: isSupplierAuthenticated, isLoading: isSupplierLoading } = useAppSelector((state) => state.supplierAuth);

  useEffect(() => {
    const isLoading = isCustomerLoading || isSupplierLoading;
    if (isLoading) return;

    // Priority: Supplier authentication takes precedence
    if (isSupplierAuthenticated) {
      router.replace('/(supplier-drawer)/(supplier-tabs)');
    } else if (isCustomerAuthenticated) {
      router.replace('/(drawer)/(tabs)');
    } else {
      // Show shop home screen by default (not login)
      router.replace('/(drawer)/(tabs)');
    }
  }, [isCustomerAuthenticated, isSupplierAuthenticated, isCustomerLoading, isSupplierLoading, router]);

  // Show loading while checking auth
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={theme.colors.primary[500]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background.default,
  },
});
