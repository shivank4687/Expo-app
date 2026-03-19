import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { RFQ_TABS, RFQStatus } from '../api/rfq.api';

interface RFQTabBarProps {
    selectedTab: RFQStatus;
    onTabPress: (tab: RFQStatus) => void;
}

export function RFQTabBar({ selectedTab, onTabPress }: RFQTabBarProps) {
    return (
        <View style={styles.wrapper}>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {RFQ_TABS.map(tab => {
                    const isActive = tab.key === selectedTab;
                    return (
                        <TouchableOpacity
                            key={tab.key}
                            style={[styles.pill, isActive && styles.pillActive]}
                            onPress={() => onTabPress(tab.key)}
                            activeOpacity={0.75}
                        >
                            <Text style={[styles.pillText, isActive && styles.pillTextActive]}>
                                {tab.label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E9E3D3',

    },
    scrollContent: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 5,

        gap: 8,
    },
    pill: {
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 20,
        backgroundColor: '#F5F5F5',
    },
    pillActive: {
        backgroundColor: '#E0FFFE',
        borderWidth: 1,
        borderColor: '#00615E',
    },
    pillText: {
        fontFamily: 'Inter',
        fontWeight: '500',
        fontSize: 13,
        color: '#666666',
    },
    pillTextActive: {
        color: '#00615E',
        fontWeight: '600',
    },
});
