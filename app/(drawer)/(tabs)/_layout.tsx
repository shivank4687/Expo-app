import { ActivityIndicator, StyleSheet, View } from "react-native";
import { SupplierTabBar } from "@/shared/components/SupplierTabBar";
import { useRequireAuth } from "@/shared/hooks/useRequireAuth";
import { Tabs } from "expo-router";
import React from "react";
import { theme } from "@/theme";

const CUSTOMER_TABS = [
  { name: "index", label: "Home", icon: "home-outline" },
  { name: "categories", label: "Categories", icon: "apps-outline" },
  { name: "cart", label: "Cart", icon: "cart-outline" },
  { name: "orders", label: "Orders", icon: "receipt-outline" },
  { name: "profile", label: "More", icon: "person-circle-outline" },
];

const CUSTOMER_DRAWER_OPTIONS = [{ name: "profile", label: "Profile" }];

export default function TabLayout() {
  const { isLoading } = useRequireAuth();

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={theme.colors.primary[500]} />
      </View>
    );
  }

  return (
    <Tabs
      tabBar={(props) => (
        <SupplierTabBar
          {...props}
          tabs={CUSTOMER_TABS}
          drawerOptions={CUSTOMER_DRAWER_OPTIONS}
        />
      )}
      screenOptions={{
        headerShown: false,
      }}
    >
      {CUSTOMER_TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.label,
          }}
        />
      ))}
    </Tabs>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.colors.background.default,
  },
});
