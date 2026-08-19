import { ActivityIndicator, StyleSheet, View } from "react-native";
import { TabBar } from "@/shared/components/TabBar";
import { useAppSelector } from "@/store/hooks";
import { Tabs } from "expo-router";
import React from "react";
import { theme } from "@/theme";
import { useTranslation } from "react-i18next";

export default function TabLayout() {
  const { isLoading, isAuthenticated } = useAppSelector((state) => state.auth);
  const { t } = useTranslation();

  const customerTabs = [
    { name: "index", label: t("tabs.home"), icon: "home-outline" },
    { name: "categories", label: t("tabs.categories"), icon: "apps-outline" },
    { name: "cart", label: t("tabs.cart"), icon: "cart-outline" },
    { name: "orders", label: t("tabs.orders"), icon: "receipt-outline" },
    { name: "profile", label: t("tabs.more"), icon: "person-circle-outline" },
  ];

  const customerDrawerOptions = [
    { name: "dashboard", label: t("tabs.dashboard") },
  ];

  const activeTabs = customerTabs.filter(
    (tab) => !["orders", "profile"].includes(tab.name) || isAuthenticated
  );

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
        <TabBar
          {...props}
          tabs={activeTabs as any}
          drawerOptions={customerDrawerOptions}
        />
      )}
      screenOptions={{
        headerShown: false,
      }}
    >
      {customerTabs.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.label,
            href: tab.name === "orders" && !isAuthenticated ? null : undefined,
          }}
        />
      ))}
      <Tabs.Screen
        name="dashboard"
        options={{
          href: null,
          title: t("tabs.dashboard"),
        }}
      />
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
