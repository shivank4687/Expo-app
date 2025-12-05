import { Stack } from "expo-router";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { store, persistor } from "@/store/store";
import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { checkAuthThunk } from "@/store/slices/authSlice";
import { fetchCoreConfig } from "@/store/slices/coreSlice";
import { fetchWishlistThunk } from "@/store/slices/wishlistSlice";
import { ActivityIndicator, View } from "react-native";
import "@/i18n/config";
import { LocaleSync } from "@/i18n/LocaleSync";
import { ToastProvider, ToastContainer } from "@/shared/components/Toast";

function AppContent() {
  const dispatch = useAppDispatch();
  const { isAuthenticated, isLoading } = useAppSelector((state) => state.auth);

  useEffect(() => {
    // Initialize core config (locale, currency, channels) on app start
    dispatch(fetchCoreConfig());
    // Check authentication status
    dispatch(checkAuthThunk());
  }, [dispatch]);

  // Load wishlist when user is authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      console.log('✅ User authenticated, loading wishlist...');
      dispatch(fetchWishlistThunk());
    }
  }, [isAuthenticated, isLoading, dispatch]);

  return (
    <ToastProvider>
      <LocaleSync />
      <Stack>
        <Stack.Screen name="(drawer)" options={{ headerShown: false }} />
        <Stack.Screen
          name="login"
          options={{ 
            title: "Login",
            headerBackTitle: "Back",
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
      </Stack>
      <ToastContainer />
    </ToastProvider>
  );
}

export default function RootLayout() {
  return (
    <Provider store={store}>
      <PersistGate
        loading={
          <View
            style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
          >
            <ActivityIndicator size="large" />
          </View>
        }
        persistor={persistor}
      >
        <AppContent />
      </PersistGate>
    </Provider>
  );
}
