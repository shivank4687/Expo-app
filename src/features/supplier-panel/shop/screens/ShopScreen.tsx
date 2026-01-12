import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { IdentityCard, ShopDetailsCard, SalesShippingCard, DeliveryMethodCard, ShopMediaCard } from '../components';
import { COLORS } from '@/features/supplier-panel/styles';

export default function ShopScreen() {
    return (
        <View style={styles.mainContainer}>
            <SafeAreaView style={styles.safeArea} edges={['top']}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>My Shop</Text>
                </View>
            </SafeAreaView>

            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.card}>
                    <IdentityCard />
                    <ShopDetailsCard />
                </View>

                <View style={styles.card}>
                    <SalesShippingCard />
                </View>

                <View style={styles.card}>
                    <DeliveryMethodCard />
                </View>

                <View style={styles.card}>
                    <ShopMediaCard />
                </View>

                {/* Action Buttons */}
                <View style={styles.actionRow}>
                    <TouchableOpacity style={styles.previewButton}>
                        <Ionicons name="eye-outline" size={16} color="#000000" />
                        <Text style={styles.previewButtonText}>Preview</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.saveButton}>
                        <Ionicons name="checkmark-outline" size={16} color="#F5F5F5" />
                        <Text style={styles.saveButtonText}>Save</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    safeArea: {
        backgroundColor: COLORS.background,
    },
    header: {
        paddingHorizontal: 16,
        paddingVertical: 16,
        backgroundColor: COLORS.background,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    headerTitle: {
        fontFamily: 'Inter',
        fontWeight: '700',
        fontSize: 24,
        lineHeight: 24,
        color: '#000000',
    },
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    content: {
        padding: 16,
        paddingTop: 8,
        gap: 16,
        alignItems: 'center',
    },
    card: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'flex-start',
        padding: 16,
        gap: 16,
        width: 361,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        shadowColor: '#000000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 3,
        alignSelf: 'stretch',
    },
    actionRow: {
        flexDirection: 'row',
        gap: 8,
        width: 361,
        height: 40,
        alignSelf: 'stretch',
        marginTop: 8,
        marginBottom: 32,
    },
    previewButton: {
        flex: 1,
        height: 40,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#00615E',
        borderRadius: 8,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    saveButton: {
        flex: 1,
        height: 40,
        backgroundColor: '#00615E',
        borderRadius: 8,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    previewButtonText: {
        fontFamily: 'Inter',
        fontSize: 16,
        color: '#000000',
    },
    saveButtonText: {
        fontFamily: 'Inter',
        fontSize: 16,
        color: '#F5F5F5',
    }
});
