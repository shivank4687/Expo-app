import "@/i18n/config";
import { LocaleSync } from "@/i18n/LocaleSync";
import { expoPushNotificationService } from "@/services/notifications/expo-push-notification.service";
import { ToastContainer, ToastProvider } from "@/shared/components/Toast";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { checkAuthThunk } from "@/store/slices/authSlice";
import { fetchCoreConfig } from "@/store/slices/coreSlice";
import { checkSupplierAuthThunk } from "@/store/slices/supplierAuthSlice";
import { fetchWishlistThunk } from "@/store/slices/wishlistSlice";
import { persistor, store } from "@/store/store";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";

// Track if app has been initialized (outside component to persist across all instances)
let appInitialized = false;

function AppContent() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const segments = useSegments();
  const { isAuthenticated: isCustomerAuthenticated, isLoading: isCustomerLoading } = useAppSelector((state) => state.auth);
  const { isAuthenticated: isSupplierAuthenticated, isLoading: isSupplierLoading } = useAppSelector((state) => state.supplierAuth);

  // Setup push notification handlers on app start
  useEffect(() => {
    console.log('🔔 Setting up push notification handlers...');
    expoPushNotificationService.setupNotificationHandlers();

    // Cleanup on unmount
    return () => {
      console.log('🔕 Cleaning up push notification handlers...');
      expoPushNotificationService.cleanup();
    };
  }, []);

  // Load wishlist when customer is authenticated
  useEffect(() => {
    if (isCustomerAuthenticated && !isCustomerLoading) {
      console.log('✅ Customer authenticated, loading wishlist...');
      dispatch(fetchWishlistThunk());
    }
  }, [isCustomerAuthenticated, isCustomerLoading, dispatch]);


  // Handle navigation based on authentication state (for route protection)
  useEffect(() => {
    const isLoading = isCustomerLoading || isSupplierLoading;
    if (isLoading) return;

    const isAuthScreen = segments[0] === 'login' || segments[0] === 'signup' || segments[0] === 'otp-verification' || segments[0] === 'index';
    const isOnSupplierDashboard = segments[0] === '(supplier-drawer)';
    const isOnCustomerDashboard = segments[0] === '(drawer)';

    // If supplier is authenticated but on customer dashboard, redirect
    if (isSupplierAuthenticated && isOnCustomerDashboard) {
      console.log('✅ Supplier authenticated, redirecting from customer to supplier dashboard...');
      router.replace('/(supplier-drawer)/(supplier-tabs)');
    }
    // If customer is authenticated but on supplier dashboard, redirect
    else if (isCustomerAuthenticated && !isSupplierAuthenticated && isOnSupplierDashboard) {
      console.log('✅ Customer authenticated, redirecting from supplier to customer dashboard...');
      router.replace('/(drawer)/(tabs)');
    }
    // If neither is authenticated and on supplier dashboard, redirect to shop home
    else if (!isCustomerAuthenticated && !isSupplierAuthenticated && isOnSupplierDashboard) {
      console.log('❌ Not authenticated, redirecting to shop home...');
      router.replace('/(drawer)/(tabs)');
    }
    // Customer dashboard (shop) is accessible without authentication, so no redirect needed
  }, [isCustomerAuthenticated, isSupplierAuthenticated, isCustomerLoading, isSupplierLoading, segments, router]);

  return (
    <ToastProvider>
      <LocaleSync />
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(drawer)" options={{ headerShown: false }} />
        <Stack.Screen name="(supplier-drawer)" options={{ headerShown: false }} />
        <Stack.Screen
          name="login"
          options={{
            title: "",
            headerBackTitle: "Back",
            headerStyle: {
              backgroundColor: '#00615E',
              shadowColor: 'transparent',
              elevation: 0,
            },
            headerTintColor: '#FFFFFF',
            headerTitleStyle: {
              color: '#FFFFFF',
              fontWeight: '600',
            },
            headerBackImage: () => (
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginLeft: 4,
                }}
              >
                <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
              </View>
            ),
          }}
        />
        <Stack.Screen
          name="signup"
          options={{
            title: "Sign Up",
            headerBackTitle: "Back",
          }}
        />
        <Stack.Screen
          name="otp-verification"
          options={{
            title: "Verify OTP",
            headerBackTitle: "Back",
          }}
        />
        <Stack.Screen
          name="contact-us"
          options={{
            title: "Contact Us",
            headerBackTitle: "Back",
          }}
        />
        <Stack.Screen
          name="product/[id]"
          options={{
            title: "Product Details",
            headerBackTitle: "Back",
          }}
        />
        <Stack.Screen
          name="wishlist"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="notifications"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="messages"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="chat/[threadId]"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="supplier/[url]"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="rfq/[supplierId]"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="quotes"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="quotes/[quoteId]"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="quotes/quote-response-detail"
          options={{
            headerShown: false,
          }}
        />
      </Stack>
      <ToastContainer />
    </ToastProvider>
  );
}

export default function RootLayout() {
  // Initialize app once after persistor rehydrates
  const handleBeforeLift = () => {
    if (!appInitialized) {
      console.log('✨ Initializing app after rehydration...');
      appInitialized = true;

      // Initialize core config (locale, currency, channels) on app start
      store.dispatch(fetchCoreConfig());
      // Check both customer and supplier authentication status
      store.dispatch(checkAuthThunk());
      store.dispatch(checkSupplierAuthThunk());
    }
  };

  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <PersistGate
          loading={
            <View
              style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
            >
              <ActivityIndicator size="large" />
            </View>
          }
          persistor={persistor}
          onBeforeLift={handleBeforeLift}
        >
          <AppContent />
        </PersistGate>
      </SafeAreaProvider>
    </Provider>
  );
}
