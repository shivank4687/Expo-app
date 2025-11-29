import { Drawer } from "expo-router/drawer";
import { CustomDrawerContent } from "@/shared/components/CustomDrawerContent";
import { ShopHeader } from "@/shared/components/ShopHeader";
import { theme } from "@/theme";

export default function DrawerLayout() {
  return (
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
  );
}
