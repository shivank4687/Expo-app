import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    StyleProp,
    TextStyle,
    ViewStyle,
    ReactNode,
} from 'react-native';
import { COLORS } from '@features/supplier-panel/styles/colors';

export interface Tab {
    id: string;
    label: string;
}

interface TabGroupProps {
    tabs: Tab[];
    activeTab: string;
    onTabChange: (tabId: string) => void;
    containerStyle?: StyleProp<ViewStyle>;
    tabStyle?: StyleProp<ViewStyle>;
    activeTabStyle?: StyleProp<ViewStyle>;
    tabTextStyle?: StyleProp<TextStyle>;
    activeTabTextStyle?: StyleProp<TextStyle>;
    renderTabBadge?: (tab: Tab, isActive: boolean) => ReactNode;
}

/**
 * Reusable Tab Group Component
 * Displays a horizontal group of tabs with active/inactive states
 */
export const TabGroup: React.FC<TabGroupProps> = ({
    tabs,
    activeTab,
    onTabChange,
    containerStyle,
    tabStyle,
    activeTabStyle,
    tabTextStyle,
    activeTabTextStyle,
    renderTabBadge,
}) => {
    return (
        <View style={[styles.container, containerStyle]}>
            {tabs.map((tab) => {
                const isActive = tab.id === activeTab;
                return (
                    <TouchableOpacity
                        key={tab.id}
                        style={[
                            styles.tab,
                            tabStyle,
                            isActive && [
                                styles.tabActive,
                                activeTabStyle,
                            ],
                        ]}
                        onPress={() => onTabChange(tab.id)}
                        activeOpacity={0.7}
                    >
                        <Text
                            style={[
                                styles.tabText,
                                tabTextStyle,
                                isActive && [
                                    styles.tabTextActive,
                                    activeTabTextStyle,
                                ],
                            ]}
                        >
                            {tab.label}
                        </Text>
                        {renderTabBadge?.(tab, isActive)}
                    </TouchableOpacity>
                );
            })}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 4,
        backgroundColor: COLORS.white,
        borderRadius: 8,
        gap: 0,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 0,
        borderRadius: 4,
        height: 34,
    },
    tabActive: {
        backgroundColor: '#00615E',
        borderWidth: 1,
        borderColor: '#00615E',
    },
    tabText: {
        fontFamily: 'Inter',
        fontWeight: '500',
        fontSize: 14,
        lineHeight: 18,
        color: COLORS.black,
    },
    tabTextActive: {
        color: '#FFFFFF',
    },
});
