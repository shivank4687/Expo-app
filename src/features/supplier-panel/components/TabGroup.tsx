import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '../styles/colors';

export interface Tab {
    id: string;
    label: string;
}

interface TabGroupProps {
    tabs: Tab[];
    activeTab: string;
    onTabChange: (tabId: string) => void;
}

/**
 * Reusable Tab Group Component
 * Displays a horizontal group of tabs with active/inactive states
 */
export const TabGroup: React.FC<TabGroupProps> = ({ tabs, activeTab, onTabChange }) => {
    return (
        <View style={styles.container}>
            {tabs.map((tab) => {
                const isActive = tab.id === activeTab;
                return (
                    <TouchableOpacity
                        key={tab.id}
                        style={[
                            styles.tab,
                            isActive && styles.tabActive,
                        ]}
                        onPress={() => onTabChange(tab.id)}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.tabText}>{tab.label}</Text>
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
        padding: 10,
        borderRadius: 4,
        height: 34,
    },
    tabActive: {
        backgroundColor: COLORS.primaryLight,
        borderWidth: 1,
        borderColor: COLORS.primary,
    },
    tabText: {
        fontFamily: 'Inter',
        fontWeight: '400',
        fontSize: 14,
        lineHeight: 14,
        color: COLORS.black,
    },
});
