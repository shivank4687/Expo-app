import { SupplierTabBar } from "@/shared/components/SupplierTabBar";
import { Tabs } from "expo-router";

export default function SupplierTabsLayout() {
  let screens = [
    {
      name: "index",
      title: "Home"
    },
    {
      name: "orders",
      title: "Orders"
    },
    {
      name: "products",
      title: "Products"
    },
    {
      name: "shop",
      title: "Shop"
    },
    {
      name: "settings",
      title: "More"
    },
  ];
  return (
    <Tabs
      tabBar={(props) => <SupplierTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      {screens.map((screen) => (
        <Tabs.Screen
          key={screen.name}
          name={screen.name}
          options={{
            title: screen.title,
          }}
        />
      ))}
    </Tabs>
  );
}
