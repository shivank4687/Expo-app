import { Ionicons } from '@expo/vector-icons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export function SupplierTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
    return (
        <View style={styles.container}>
            <View style={styles.navbar}>
                {state.routes.map((route, index) => {
                    const { options } = descriptors[route.key];
                    const label =
                        options.tabBarLabel !== undefined
                            ? options.tabBarLabel
                            : options.title !== undefined
                                ? options.title
                                : route.name;

                    const isFocused = state.index === index;

                    const onPress = () => {
                        const event = navigation.emit({
                            type: 'tabPress',
                            target: route.key,
                            canPreventDefault: true,
                        });

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

                    // Get icon name based on route
                    const getIconName = () => {
                        switch (route.name) {
                            case 'index':
                                return 'home-outline';
                            case 'orders':
                                return 'receipt-outline';
                            case 'products':
                                return 'cube-outline';
                            case 'messages':
                                return 'storefront-outline';
                            case 'settings':
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
            <View style={styles.navigationHandle}>
                <View style={styles.handle} />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'column',
        alignItems: 'flex-start',
        padding: 0,
        width: '100%',
        height: 96,
        backgroundColor: '#FCF7EA',
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
