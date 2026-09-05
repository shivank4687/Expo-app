import "@/i18n/config";
import { LocaleSync } from "@/i18n/LocaleSync";
import { expoPushNotificationService } from "@/services/notifications/expo-push-notification.service";
import { supplierPushNotificationService } from "@/services/notifications/supplier-push-notification.service";
import { ToastContainer, ToastProvider } from "@/shared/components/Toast";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { checkAuthThunk } from "@/store/slices/authSlice";
import { fetchCategories } from "@/store/slices/categorySlice";
import { fetchCoreConfig } from "@/store/slices/coreSlice";
import { checkSupplierAuthThunk } from "@/store/slices/supplierAuthSlice";
import { fetchWishlistThunk } from "@/store/slices/wishlistSlice";
import { persistor, store } from "@/store/store";
import { guestCartToken } from "@/services/storage/guestCartToken";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { ActivityIndicator, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { useTranslation } from "react-i18next";
import { supplierTheme, theme } from "@/theme";

// Track if app has been initialized (outside component to persist across all instances)
let appInitialized = false;

function AppContent() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { isAuthenticated: isCustomerAuthenticated, isLoading: isCustomerLoading, user } = useAppSelector((state) => state.auth);
  const { isAuthenticated: isSupplierAuthenticated, isLoading: isSupplierLoading, supplier } = useAppSelector((state) => state.supplierAuth);
  const { selectedLocale } = useAppSelector((state) => state.core);
  const hasRefreshedCategories = useRef(false);

  // Setup CUSTOMER push notification handlers on app start
  useEffect(() => {
    console.log('🔔 Setting up customer push notification handlers...');
    expoPushNotificationService.setupNotificationHandlers();

    return () => {
      console.log('🔕 Cleaning up customer push notification handlers...');
      expoPushNotificationService.cleanup();
    };
  }, []);

  // Setup SUPPLIER push notification handlers when supplier is authenticated
  useEffect(() => {
    if (!isSupplierAuthenticated) return;

    console.log('🔔 Setting up supplier push notification handlers...');
    supplierPushNotificationService.setupNotificationHandlers();

    return () => {
      console.log('🔕 Cleaning up supplier push notification handlers...');
      supplierPushNotificationService.cleanup();
    };
  }, [isSupplierAuthenticated]);

  // Load wishlist when customer is authenticated
  useEffect(() => {
    if (isCustomerAuthenticated && !isCustomerLoading) {
      console.log('✅ Customer authenticated, loading wishlist...');
      dispatch(fetchWishlistThunk());
    }
  }, [isCustomerAuthenticated, isCustomerLoading, dispatch]);




  useEffect(() => {
    if (!selectedLocale?.code) return;

    const shouldForceRefresh = !hasRefreshedCategories.current;
    if (shouldForceRefresh) {
      hasRefreshedCategories.current = true;
    }

    dispatch(
      fetchCategories({
        locale: selectedLocale.code,
        forceRefresh: shouldForceRefresh,
      })
    );
  }, [dispatch, selectedLocale?.code]);

  const teal = supplierTheme.colors.primary[500];
  const inverseText = supplierTheme.colors.text.inverse;

  const commonHeaderOptions = {
    title: "",
    headerBackTitle: "Back",
    headerStyle: {
      backgroundColor: teal,
      shadowColor: 'transparent',
      elevation: 0,
    },
    headerTintColor: inverseText,
    headerTitleStyle: {
      color: inverseText,
      fontWeight: '600' as const,
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
        <Ionicons name="arrow-back" size={20} color={inverseText} />
      </View>
    ),
  };

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
            ...commonHeaderOptions,
            title: t('auth.signIn'),
          }}
        />
        <Stack.Screen
          name="signup"
          options={{
            ...commonHeaderOptions,
            title: t('auth.signUp'),
          }}
        />
        <Stack.Screen
          name="otp-verification"
          options={{
            ...commonHeaderOptions,
            title: t('auth.verifyOtp', 'Verify OTP'),
          }}
        />
        <Stack.Screen
          name="add-phone"
          options={{
            ...commonHeaderOptions,
            title: t('auth.addPhone', 'Add Phone'),
          }}
        />
        <Stack.Screen
          name="forgot-password"
          options={{
            ...commonHeaderOptions,
            title: t('auth.forgotPassword'),
          }}
        />
        <Stack.Screen
          name="reset-password"
          options={commonHeaderOptions}
        />
        <Stack.Screen
          name="contact-us"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="product/[id]"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="product/[id]/reviews"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="wishlist"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="category/[id]"
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
          name="orders"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="orders-list"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="orders/[id]"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="security"
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
        <Stack.Screen
          name="addresses"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="account-info"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="preferences"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="language-selection"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="currency-selection"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="coupons"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="offline-products"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="offline-add-product"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="offline-edit-product"
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

      // Initialize guest cart token on startup
      guestCartToken.getOrCreate();

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
              style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: theme.colors.background.default }}
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
