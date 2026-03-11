import { Ionicons } from '@expo/vector-icons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type DrawerOption = 'profile' | 'marketing' | 'reviews' | 'transactions' | 'rfq';

export function SupplierTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
    const insets = useSafeAreaInsets();
    // Some Android devices report 0 bottom inset with 3-button navigation.
    // Use a fallback gap to keep the tab bar above system buttons.
    const bottomInset = Platform.OS === 'android' ? Math.max(insets.bottom, 28) : 0;
    const [selectedOption, setSelectedOption] = useState<DrawerOption>('profile');
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const drawerHeight = useRef(new Animated.Value(0)).current;

    // Tracking previous focus state to handle auto-opening
    const prevIsMoreTabFocused = useRef(false);

    // Check if More tab or its sub-screens are focused
    const focusedRouteName = state.routes[state.index].name;
    const isMoreTabFocused = ['rfq', 'profile', 'marketing', 'reviews', 'transactions'].includes(focusedRouteName);

    // Sync drawer selection with route
    useEffect(() => {
        if (focusedRouteName === 'profile' || focusedRouteName === 'marketing' || focusedRouteName === 'reviews' || focusedRouteName === 'transactions' || focusedRouteName === 'rfq') {
            setSelectedOption(focusedRouteName as DrawerOption);
        }
    }, [focusedRouteName]);

    // Handle drawer visibility based on focus and manual toggle
    useEffect(() => {
        if (isMoreTabFocused) {
            // Ensure drawer is open when entering "More" screens
            // Use a slight check to avoid re-triggering if already open (manual toggle handled separately)
            setIsDrawerOpen(true);
        } else {
            // Aggressively close drawer when leaving "More" screens
            setIsDrawerOpen(false);
        }
    }, [isMoreTabFocused]);

    // Animation trigger
    useEffect(() => {
        // Use timing for more predictable close/open during tab switches
        Animated.timing(drawerHeight, {
            toValue: isDrawerOpen ? 60 : 0,
            duration: 200,
            useNativeDriver: false,
        }).start();
    }, [isDrawerOpen]);

    const handleDrawerOptionPress = (option: DrawerOption) => {
        setSelectedOption(option);
        navigation.navigate(option);
    };

    return (
        <View style={[styles.container, { paddingBottom: bottomInset }]}>
            {/* Drawer */}
            <Animated.View style={[styles.drawer, { height: drawerHeight }]}>
                <View style={styles.drawerContent}>

                    <TouchableOpacity
                        style={[
                            styles.drawerOption,
                            selectedOption === 'profile' && styles.drawerOptionActive
                        ]}
                        onPress={() => handleDrawerOptionPress('profile')}
                    >
                        <Text style={[
                            styles.drawerOptionText,
                            selectedOption === 'profile' && styles.drawerOptionTextActive
                        ]}>
                            Profile
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[
                            styles.drawerOption,
                            selectedOption === 'rfq' && styles.drawerOptionActive
                        ]}
                        onPress={() => handleDrawerOptionPress('rfq')}
                    >
                        <Text style={[
                            styles.drawerOptionText,
                            selectedOption === 'rfq' && styles.drawerOptionTextActive
                        ]}>
                            RFQ
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.drawerOption,
                            selectedOption === 'marketing' && styles.drawerOptionActive
                        ]}
                        onPress={() => handleDrawerOptionPress('marketing')}
                    >
                        <Text style={[
                            styles.drawerOptionText,
                            selectedOption === 'marketing' && styles.drawerOptionTextActive
                        ]}>
                            Marketing
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.drawerOption,
                            selectedOption === 'reviews' && styles.drawerOptionActive
                        ]}
                        onPress={() => handleDrawerOptionPress('reviews')}
                    >
                        <Text style={[
                            styles.drawerOptionText,
                            selectedOption === 'reviews' && styles.drawerOptionTextActive
                        ]}>
                            Reviews
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.drawerOption,
                            selectedOption === 'transactions' && styles.drawerOptionActive
                        ]}
                        onPress={() => handleDrawerOptionPress('transactions')}
                    >
                        <Text style={[
                            styles.drawerOptionText,
                            selectedOption === 'transactions' && styles.drawerOptionTextActive
                        ]}>
                            Payouts
                        </Text>
                    </TouchableOpacity>
                </View>
            </Animated.View>

            {/* Tab Bar */}
            <View style={styles.navbar}>
                {state.routes.map((route, index) => {
                    // Show Profile as the "More" tab, but hide Marketing, Reviews, Transactions and old Settings
                    if (route.name === 'marketing' || route.name === 'reviews' || route.name === 'transactions' || route.name === 'settings' || route.name === 'rfq') {
                        return null;
                    }

                    const { options } = descriptors[route.key];
                    const label =
                        options.tabBarLabel !== undefined
                            ? options.tabBarLabel
                            : options.title !== undefined
                                ? options.title
                                : route.name;

                    let isFocused = state.index === index;

                    // Special case: Highlight More tab (profile) if marketing, reviews, or transactions is focused
                    if (route.name === 'profile' && (focusedRouteName === 'marketing' || focusedRouteName === 'reviews' || focusedRouteName === 'transactions')) {
                        isFocused = true;
                    }

                    const onPress = () => {
                        const event = navigation.emit({
                            type: 'tabPress',
                            target: route.key,
                            canPreventDefault: true,
                        });

                        if (route.name === 'profile') {
                            if (isFocused) {
                                // Already on More screen, toggle drawer visibility
                                setIsDrawerOpen(prev => !prev);
                            } else {
                                // Navigating to More screen - useEffect will handle opening
                                navigation.navigate(route.name);
                            }
                            return;
                        }

                        if (!isFocused && !event.defaultPrevented) {
                            navigation.navigate(route.name);
                            // useEffect will handle closing
                        }
                    };

                    const onLongPress = () => {
                        navigation.emit({
                            type: 'tabLongPress',
                            target: route.key,
                        });
                    };

                    // Get icon name based on route
                    const getIconName = () => {
                        switch (route.name) {
                            case 'index':
                                return 'home-outline';
                            case 'orders':
                                return 'receipt-outline';
                            case 'products':
                                return 'cube-outline';
                            case 'shop':
                                return 'storefront-outline';
                            case 'profile':
                                return 'settings-outline';
                            default:
                                return 'home-outline';
                        }
                    };

                    return (
                        <TouchableOpacity
                            key={route.key}
                            accessibilityRole="button"
                            accessibilityState={isFocused ? { selected: true } : {}}
                            accessibilityLabel={options.tabBarAccessibilityLabel}
                            onPress={onPress}
                            onLongPress={onLongPress}
                            style={[styles.tab, isFocused && styles.tabActive]}
                        >
                            <Ionicons
                                name={getIconName() as any}
                                size={24}
                                color={isFocused ? '#00615E' : '#666666'}
                            />
                            <Text style={[styles.label, isFocused && styles.labelActive]}>
                                {typeof label === 'string' ? label : route.name}
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
        backgroundColor: '#FCF7EA',
    },
    drawer: {
        width: '100%',
        backgroundColor: '#FFFFFF',
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
        backgroundColor: '#F5F5F5',
    },
    drawerOptionActive: {
        backgroundColor: '#E0FFFE',
        borderWidth: 1,
        borderColor: '#00615E',
    },
    drawerOptionText: {
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '500',
        fontSize: 12,
        color: '#666666',
    },
    drawerOptionTextActive: {
        color: '#00615E',
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
        backgroundColor: '#FFFFFF',
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
    tabActive: {
        backgroundColor: '#E0FFFE',
        borderWidth: 1,
        borderColor: '#00615E',
    },
    label: {
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '400',
        fontSize: 9,
        lineHeight: 11,
        color: '#666666',
        textAlign: 'center',
    },
    labelActive: {
        color: '#000000',
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
