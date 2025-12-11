import { Drawer } from "expo-router/drawer";
import { SupplierDrawerContent } from "@/shared/components/SupplierDrawerContent";
import { SupplierHeader } from "@/shared/components/SupplierHeader";
import { theme } from "@/theme";

export default function SupplierDrawerLayout() {
  return (
    <Drawer
      drawerContent={(props) => <SupplierDrawerContent {...props} />}
      screenOptions={{
        header: ({ options }) => <SupplierHeader title={options.title} />,
        headerShown: true,
        drawerActiveTintColor: theme.colors.primary[500],
        drawerInactiveTintColor: theme.colors.text.primary,
        drawerLabelStyle: {
          marginLeft: -20,
          fontSize: theme.typography.fontSize.md,
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
    </Drawer>
  );
}
