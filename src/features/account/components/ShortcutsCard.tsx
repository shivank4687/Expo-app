import React from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export const ShortcutsCard = () => {
    const router = useRouter();

    return (
        <View style={styles.container}>
            {/* Header Row */}
            <View style={styles.headerRow}>
                <View style={styles.headerTextContainer}>
                    <Text style={styles.title}>Shortcuts</Text>
                    <Text style={styles.subtitle}>One-tap access to what you use most.</Text>
                </View>
                <View style={styles.actionChip}>
                    <Text style={styles.actionText}>Fast</Text>
                </View>
            </View>

            {/* Shortcuts Row */}
            <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.shortcutsScrollContent}
                style={styles.shortcutsScroll}
            >
                {/* Messages */}
                <TouchableOpacity style={styles.shortcutBlock} onPress={() => router.push('/messages')}>
                    <Ionicons name="chatbubble-outline" size={24} color="#00615E" />
                    <Text style={styles.shortcutLabel}>Messages</Text>
                </TouchableOpacity>

                {/* Favorites */}
                <TouchableOpacity style={styles.shortcutBlock} onPress={() => router.push('/wishlist')}>
                    <Ionicons name="heart-outline" size={24} color="#00615E" />
                    <Text style={styles.shortcutLabel}>Favorites</Text>
                </TouchableOpacity>

                {/* Addresses */}
                <TouchableOpacity style={styles.shortcutBlock} onPress={() => router.push('/addresses')}>
                    <Ionicons name="location-outline" size={24} color="#00615E" />
                    <Text style={styles.shortcutLabel}>Addresses</Text>
                </TouchableOpacity>

                {/* Invoices */}
                <TouchableOpacity style={styles.shortcutBlock} onPress={() => router.push('/orders-list')}>
                    <Ionicons name="document-text-outline" size={24} color="#00615E" />
                    <Text style={styles.shortcutLabel}>Invoices</Text>
                </TouchableOpacity>
            </ScrollView>
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
    shortcutsScroll: {
        width: '100%',
    },
    shortcutsScrollContent: {
        gap: 4,
        flexGrow: 1,
        paddingRight: 16,
    },
    shortcutBlock: {
        borderWidth: 1,
        borderColor: '#E9E3D3',
        borderRadius: 8,
        padding: 8,
        flexDirection: 'column',
        gap: 4,
        width: 83.25,
    },
    shortcutLabel: {
        fontFamily: Platform.OS === 'ios' ? 'Inter' : 'sans-serif',
        fontWeight: '500',
        fontSize: 12,
        color: '#0A292D',
        lineHeight: 16.8,
    },
});
