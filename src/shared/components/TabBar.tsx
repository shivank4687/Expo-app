import { supplierTheme, theme } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppSelector } from '@/store/hooks';

type TabDefinition = {
    name: string;
    label: string;
    icon: React.ComponentProps<typeof Ionicons>['name'];
};

type DrawerOptionDefinition = {
    name: string;
    label: string;
};

const DEFAULT_TABS: TabDefinition[] = [
    { name: 'index', label: 'Home', icon: 'home-outline' },
    { name: 'orders', label: 'Orders', icon: 'receipt-outline' },
    { name: 'products', label: 'Products', icon: 'cube-outline' },
    { name: 'shop', label: 'Shop', icon: 'storefront-outline' },
    { name: 'profile', label: 'More', icon: 'settings-outline' },
];

const DEFAULT_DRAWER_OPTIONS: DrawerOptionDefinition[] = [
    { name: 'profile', label: 'Profile' },
    { name: 'rfq', label: 'RFQ' },
    { name: 'marketing', label: 'Marketing' },
    { name: 'reviews', label: 'Reviews' },
    { name: 'transactions', label: 'Payouts' },
];

const PRIMARY_COLOR = supplierTheme.colors.primary[500];
const TAB_BACKGROUND_COLOR = supplierTheme.colors.background.default;
const WHITE_COLOR = supplierTheme.colors.white;
const TEXT_SECONDARY_COLOR = supplierTheme.colors.text.secondary;
const TEXT_PRIMARY_COLOR = supplierTheme.colors.text.primary;
const TAB_ACTIVE_BACKGROUND = supplierTheme.colors.background.light_green;
const DRAWER_OPTION_BG = supplierTheme.colors.secondary[50];

type TabBarProps = BottomTabBarProps & {
    tabs?: TabDefinition[];
    drawerOptions?: DrawerOptionDefinition[];
};

type TabRoute = BottomTabBarProps['state']['routes'][number];

export function TabBar({
    state,
    descriptors,
    navigation,
    tabs,
    drawerOptions,
}: TabBarProps) {
    const insets = useSafeAreaInsets();
    const selectedUserType = useAppSelector((state) => state.auth.selectedUserType);
    const bottomInset = Platform.OS === 'android' ? Math.max(insets.bottom, 28) : 0;

    const tabsList = useMemo(() => (tabs && tabs.length > 0 ? tabs : DEFAULT_TABS), [tabs]);
    const drawerOptionsList = useMemo(
        () => (drawerOptions && drawerOptions.length > 0 ? drawerOptions : DEFAULT_DRAWER_OPTIONS),
        [drawerOptions],
    );

    const drawerRouteNames = useMemo(
        () => new Set(drawerOptionsList.map((option) => option.name)),
        [drawerOptionsList],
    );
    const defaultDrawerOptionName = useMemo(() => {
        const customerDashboardOption = drawerOptionsList.find((option) => option.name === 'dashboard');

        if (selectedUserType === 'customer' && customerDashboardOption) {
            return customerDashboardOption.name;
        }

        return drawerOptionsList[0]?.name ?? 'profile';
    }, [drawerOptionsList, selectedUserType]);

    const focusedRouteName = state.routes[state.index]?.name ?? '';
    const isMoreTabFocused = drawerRouteNames.has(focusedRouteName);
    const cartItemsCount = useAppSelector((state) => state.cart.cart?.items_count || 0);

    const [selectedOption, setSelectedOption] = useState<string>(defaultDrawerOptionName);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const drawerHeight = useRef(new Animated.Value(0)).current;
    const visibleTabs = tabsList
        .map((tab) => {
            const route = state.routes.find((route) => route.name === tab.name);
            if (!route) return null;
            return { tab, route };
        })
        .filter((entry): entry is { tab: TabDefinition; route: TabRoute } => Boolean(entry));

    useEffect(() => {
        setSelectedOption(defaultDrawerOptionName);
    }, [defaultDrawerOptionName]);

    useEffect(() => {
        if (focusedRouteName && drawerRouteNames.has(focusedRouteName)) {
            setSelectedOption(focusedRouteName);
        }
    }, [focusedRouteName, drawerRouteNames]);

    useEffect(() => {
        if (isMoreTabFocused) {
            setIsDrawerOpen(true);
        } else {
            setIsDrawerOpen(false);
        }
    }, [isMoreTabFocused]);

    useEffect(() => {
        Animated.timing(drawerHeight, {
            toValue: isDrawerOpen ? 60 : 0,
            duration: 200,
            useNativeDriver: false,
        }).start();
    }, [isDrawerOpen]);

    const handleDrawerOptionPress = (option: DrawerOptionDefinition) => {
        setSelectedOption(option.name);
        navigation.navigate(option.name);
    };

    return (
        <View style={[styles.container, { paddingBottom: bottomInset }]}>
            {/* Drawer */}
            <Animated.View style={[styles.drawer, { height: drawerHeight }]}>
                <View style={styles.drawerContent}>
                    {drawerOptionsList.map((option) => (
                        <TouchableOpacity
                            key={option.name}
                            style={[
                                styles.drawerOption,
                                selectedOption === option.name && styles.drawerOptionActive,
                            ]}
                            activeOpacity={1}
                            onPress={() => handleDrawerOptionPress(option)}
                        >
                            <Text
                                style={[
                                    styles.drawerOptionText,
                                    selectedOption === option.name && styles.drawerOptionTextActive,
                                ]}
                            >
                                {option.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </Animated.View>

            {/* Tab Bar */}
            <View style={styles.navbar}>
                {visibleTabs.map(({ tab, route }) => {
                    const { options } = descriptors[route.key];
                    const label = tab.label || (options.title as string) || route.name;
                    let isFocused = focusedRouteName === route.name;
                    if (tab.name === 'profile' && drawerRouteNames.has(focusedRouteName)) {
                        isFocused = true;
                    }

                    const onPress = () => {
                        const event = navigation.emit({
                            type: 'tabPress',
                            target: route.key,
                            canPreventDefault: true,
                        });

                        if (tab.name === 'profile') {
                            if (isFocused) {
                                setIsDrawerOpen((prev) => !prev);
                            } else if (!event.defaultPrevented) {
                                setSelectedOption(defaultDrawerOptionName);
                                navigation.navigate(defaultDrawerOptionName);
                            }
                            return;
                        }

                        if (!isFocused && !event.defaultPrevented) {
                            navigation.navigate(route.name);
                        }
                    };

                    const onLongPress = () => {
                        navigation.emit({
                            type: 'tabLongPress',
                            target: route.key,
                        });
                    };

                    return (
                        <TouchableOpacity
                            key={route.key}
                            accessibilityRole="button"
                            accessibilityState={isFocused ? { selected: true } : {}}
                            accessibilityLabel={options.tabBarAccessibilityLabel}
                            onPress={onPress}
                            onLongPress={onLongPress}
                            activeOpacity={1}
                            style={[styles.tab, isFocused && styles.tabActive]}
                        >
                            <View style={styles.iconWrapper}>
                                <Ionicons
                                    name={tab.icon}
                                    size={24}
                                    color={isFocused ? PRIMARY_COLOR : TEXT_SECONDARY_COLOR}
                                />
                                {tab.name === 'cart' && cartItemsCount > 0 && (
                                    <View style={styles.badge}>
                                        <Text style={styles.badgeText}>
                                            {cartItemsCount > 99 ? '99+' : cartItemsCount}
                                        </Text>
                                    </View>
                                )}
                            </View>
                            <Text style={[styles.label, isFocused && styles.labelActive]}>
                                {label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
            {Platform.OS === 'ios' && (
                <View style={styles.navigationHandle}>
                    <View style={styles.handle} />
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'column',
        alignItems: 'flex-start',
        padding: 0,
        width: '100%',
        backgroundColor: TAB_BACKGROUND_COLOR,
    },
    drawer: {
        width: '100%',
        backgroundColor: WHITE_COLOR,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        overflow: 'hidden',
    },
    drawerContent: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        gap: 8,
    },
    drawerOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 20,
        backgroundColor: DRAWER_OPTION_BG,
    },
    drawerOptionActive: {
        backgroundColor: TAB_ACTIVE_BACKGROUND,
        borderWidth: 1,
        borderColor: PRIMARY_COLOR,
    },
    drawerOptionText: {
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '500',
        fontSize: 12,
        color: TEXT_SECONDARY_COLOR,
    },
    drawerOptionTextActive: {
        color: PRIMARY_COLOR,
        fontWeight: '600',
    },
    navbar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 8,
        gap: 10,
        width: '100%',
        height: 72,
        backgroundColor: WHITE_COLOR,
        borderRadius: 16,
    },
    tab: {
        flexDirection: 'column',
        alignItems: 'center',
        padding: 6,
        paddingHorizontal: 12,
        gap: 4,
        flex: 1,
        height: 56,
        borderRadius: 8,
    },
    iconWrapper: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    badge: {
        position: 'absolute',
        top: -2,
        right: -12,
        minWidth: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: theme.colors.error.main,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
    },
    badgeText: {
        color: supplierTheme.colors.white,
        fontSize: 10,
        fontWeight: '600',
    },
    tabActive: {
        backgroundColor: TAB_ACTIVE_BACKGROUND,
        borderWidth: 1,
        borderColor: PRIMARY_COLOR,
    },
    label: {
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '400',
        fontSize: 9,
        lineHeight: 11,
        color: TEXT_SECONDARY_COLOR,
        textAlign: 'center',
    },
    labelActive: {
        color: TEXT_PRIMARY_COLOR,
    },
    navigationHandle: {
        width: '100%',
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    handle: {
        width: 108,
        height: 4,
        backgroundColor: '#1D1B20',
        borderRadius: 12,
    },
});
