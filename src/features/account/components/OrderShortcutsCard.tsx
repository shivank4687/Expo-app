import React from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ShippingTruckIcon, DollarToPayIcon, OrderProcessingIcon, DeliveredIcon, ReturnOrderIcon } from '@/assets/icons';

export const OrderShortcutsCard = () => {
    const router = useRouter();

    return (
        <View style={styles.container}>
            {/* Header Row */}
            <View style={styles.headerRow}>
                <View style={styles.headerTextContainer}>
                    <Text style={styles.title}>Orders</Text>
                    <Text style={styles.subtitle}>Track, reorder, or get support.</Text>
                </View>
                {/* All Orders */}
                <TouchableOpacity 
                    style={styles.actionChip} 
                    onPress={() => router.push('/orders-list')}
                >
                    <Text style={styles.actionText}>All</Text>
                </TouchableOpacity>
            </View>

            {/* Shortcuts Row */}
            <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.shortcutsScrollContent}
                style={styles.shortcutsScroll}
            >
                {/* To Pay */}
                <TouchableOpacity 
                    style={styles.shortcutBlock} 
                    onPress={() => router.push({ pathname: '/orders-list', params: { status: 'pending' } })}
                >
                    <DollarToPayIcon width={24} height={24} color="#00615E" />
                    <Text style={styles.shortcutLabel} numberOfLines={1}>To Pay</Text>
                </TouchableOpacity>

                {/* Processing */}
                <TouchableOpacity 
                    style={styles.shortcutBlock} 
                    onPress={() => router.push({ pathname: '/orders-list', params: { status: 'processing' } })}
                >
                    <OrderProcessingIcon width={24} height={24} color="#00615E" />
                    <Text style={styles.shortcutLabel} numberOfLines={1}>Processing</Text>
                </TouchableOpacity>

                {/* Shipped */}
                <TouchableOpacity 
                    style={styles.shortcutBlock} 
                    onPress={() => router.push({ pathname: '/orders-list', params: { status: 'shipped' } })}
                >
                    <ShippingTruckIcon width={24} height={24} color="#00615E" />
                    <Text style={styles.shortcutLabel} numberOfLines={1}>Shipped</Text>
                </TouchableOpacity>

                {/* Delivered */}
                <TouchableOpacity 
                    style={styles.shortcutBlock} 
                    onPress={() => router.push({ pathname: '/orders-list', params: { status: 'completed' } })}
                >
                    <DeliveredIcon width={24} height={24} color="#00615E" />
                    <Text style={styles.shortcutLabel} numberOfLines={1}>Delivered</Text>
                </TouchableOpacity>

                {/* Returns */}
                <TouchableOpacity 
                    style={styles.shortcutBlock} 
                    onPress={() => router.push({ pathname: '/orders-list', params: { status: 'canceled' } })}
                >
                    <ReturnOrderIcon width={24} height={24} color="#00615E" />
                    <Text style={styles.shortcutLabel} numberOfLines={1}>Returns</Text>
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
        width: 65.8,
        alignItems: 'flex-start',
    },
    shortcutLabel: {
        fontFamily: Platform.OS === 'ios' ? 'Inter' : 'sans-serif',
        fontWeight: '500',
        fontSize: 9,
        color: '#0A292D',
        lineHeight: 10.8,
    },
});
