import { SupplierDrawerContent } from "@/shared/components/SupplierDrawerContent";
import { SupplierHeader } from "@/shared/components/SupplierHeader";
import { supplierTheme } from "@/theme";
import { Drawer } from "expo-router/drawer";
import { StatusBar } from "expo-status-bar";

export default function SupplierDrawerLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Drawer
        drawerContent={(props) => <SupplierDrawerContent {...props} />}
        screenOptions={{
          header: ({ options }) => <SupplierHeader title={options.title} />,
          headerShown: false,
          drawerActiveTintColor: supplierTheme.colors.primary[500],
          drawerInactiveTintColor: supplierTheme.colors.text.primary,
          drawerLabelStyle: {
            marginLeft: -20,
            fontSize: supplierTheme.typography.fontSize.md,
          },
        }}
      >
        <Drawer.Screen
          name="(supplier-tabs)"
          options={{
            drawerLabel: "Dashboard",
            title: "Supplier Dashboard",
          }}
        />
        <Drawer.Screen
          name="(messaging)"
          options={{
            drawerLabel: "Messaging",
            drawerItemStyle: { display: 'none' },
          }}
        />
        <Drawer.Screen
          name="notifications"
          options={{
            drawerLabel: "Notifications",
            drawerItemStyle: { display: 'none' },
          }}
        />
      </Drawer>
    </>
  );
}
