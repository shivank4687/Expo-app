import React from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export const BuyerToolsCard = () => {
    const router = useRouter();

    return (
        <View style={styles.container}>
            {/* Header Row */}
            <View style={styles.headerRow}>
                <View style={styles.headerTextContainer}>
                    <Text style={styles.title}>Buyer tools</Text>
                    <Text style={styles.subtitle}>Everything you need for repeat purchasing.</Text>
                </View>
                <View style={styles.actionChip}>
                    <Text style={styles.actionText}>B2B</Text>
                </View>
            </View>

            {/* List */}
            <View style={styles.listContainer}>
                {/* 1. Coupons & credits */}
                <TouchableOpacity style={styles.listItem} onPress={() => router.push('/coupons')}>
                    <View style={styles.iconContainer}>
                        <Ionicons name="pricetag-outline" size={20} color="#00615E" />
                    </View>
                    <View style={styles.itemTextContainer}>
                        <Text style={styles.itemTitle}>Coupons & credits</Text>
                        <Text style={styles.itemSubtitle}>Apply discounts at checkout.</Text>
                    </View>
                    <View style={styles.valueChip}>
                        <Text style={styles.valueText}>€ 25</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color="#000000" />
                </TouchableOpacity>

                {/* 2. Payment methods */}
                <TouchableOpacity style={styles.listItem}>
                    <View style={styles.iconContainer}>
                        <Ionicons name="card-outline" size={20} color="#00615E" />
                    </View>
                    <View style={styles.itemTextContainer}>
                        <Text style={styles.itemTitle}>Payment methods</Text>
                        <Text style={styles.itemSubtitle}>Card, bank transfer, net terms.</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color="#000000" />
                </TouchableOpacity>

                {/* 3. Security */}
                <TouchableOpacity style={styles.listItem} onPress={() => router.push('/security')}>
                    <View style={styles.iconContainer}>
                        <Ionicons name="lock-closed-outline" size={20} color="#00615E" />
                    </View>
                    <View style={styles.itemTextContainer}>
                        <Text style={styles.itemTitle}>Security</Text>
                        <Text style={styles.itemSubtitle}>Password, 2FA, login devices.</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color="#000000" />
                </TouchableOpacity>

                {/* 4. Support center */}
                <TouchableOpacity style={styles.listItem} onPress={() => router.push('/support-center')}>
                    <View style={styles.iconContainer}>
                        <Ionicons name="headset-outline" size={20} color="#00615E" />
                    </View>
                    <View style={styles.itemTextContainer}>
                        <Text style={styles.itemTitle}>Support center</Text>
                        <Text style={styles.itemSubtitle}>Returns, disputes, shipping help.</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color="#000000" />
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E9E3D3',
        borderRadius: 8,
        padding: 8,
        marginHorizontal: 16,
        marginTop: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        width: '100%',
        gap: 12,
    },
    headerTextContainer: {
        flex: 1,
        flexDirection: 'column',
        gap: 4,
    },
    title: {
        fontFamily: Platform.OS === 'ios' ? 'Inter' : 'sans-serif',
        fontWeight: '700',
        fontSize: 16,
        color: '#000000',
        lineHeight: 16,
    },
    subtitle: {
        fontFamily: Platform.OS === 'ios' ? 'Inter' : 'sans-serif',
        fontWeight: '500',
        fontSize: 14,
        color: '#0A292D',
        lineHeight: 16.8,
    },
    actionChip: {
        backgroundColor: '#BB5625',
        borderRadius: 50,
        paddingVertical: 4,
        paddingHorizontal: 8,
        justifyContent: 'center',
        alignItems: 'center',
        height: 23,
    },
    actionText: {
        fontFamily: Platform.OS === 'ios' ? 'Inter' : 'sans-serif',
        fontWeight: '600',
        fontSize: 11,
        color: '#FFFFFF',
        lineHeight: 15.4,
    },
    listContainer: {
        flexDirection: 'column',
        gap: 4,
        width: '100%',
    },
    listItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
        gap: 8,
        borderWidth: 1,
        borderColor: '#E9E3D3',
        borderRadius: 8,
        width: '100%',
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 50,
        backgroundColor: 'rgba(0, 97, 94, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    itemTextContainer: {
        flex: 1,
        flexDirection: 'column',
        gap: 4,
    },
    itemTitle: {
        fontFamily: Platform.OS === 'ios' ? 'Inter' : 'sans-serif',
        fontWeight: '600',
        fontSize: 14,
        color: '#000000',
        lineHeight: 16,
    },
    itemSubtitle: {
        fontFamily: Platform.OS === 'ios' ? 'Inter' : 'sans-serif',
        fontWeight: '400',
        fontSize: 12,
        color: '#0A292D',
        lineHeight: 14.4,
    },
    valueChip: {
        backgroundColor: 'rgba(0, 97, 94, 0.1)',
        borderRadius: 50,
        paddingVertical: 4,
        paddingHorizontal: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    valueText: {
        fontFamily: Platform.OS === 'ios' ? 'Inter' : 'sans-serif',
        fontWeight: '600',
        fontSize: 11,
        color: '#00615E',
        lineHeight: 15.4,
    },
});
