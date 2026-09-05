import { Drawer } from "expo-router/drawer";
import { CustomDrawerContent } from "@/shared/components/CustomDrawerContent";
import { ShopHeader } from "@/shared/components/ShopHeader";
import { theme } from "@/theme";
import { StatusBar } from "expo-status-bar";
import { OfflineGate } from "@/shared/components/OfflineGate";
import { useCustomerGuard } from "@/hooks/useRouteGuards";

export default function DrawerLayout() {
  useCustomerGuard();

  return (
    <>
      <StatusBar style="light" />
      <OfflineGate>
        <Drawer
          drawerContent={(props) => <CustomDrawerContent {...props} />}
          screenOptions={{
            header: ({ options }) => <ShopHeader title={options.title} />,
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
            name="(tabs)"
            options={{
              drawerLabel: "Home",
              title: "Shop",
            }}
          />
        </Drawer>
      </OfflineGate>
    </>
  );
}
