import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/features/supplier-panel/styles';
import { EssentialCard, PriceStockCard, PriceStockVariantsCard, DetailsCard } from '@/features/supplier-panel/add-product/components';

type TabType = 'basic' | 'advanced';

export default function AddProductScreen() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<TabType>('basic');
    const [resetKey, setResetKey] = useState(0);

    // Reset state when screen is focused
    useFocusEffect(
        React.useCallback(() => {
            setActiveTab('basic');
            setResetKey(prev => prev + 1); // Force remount of all components
        }, [])
    );

    return (
        <View style={styles.container}>
            {/* Fixed Header */}
            <View style={styles.header}>
                <View style={styles.headerContent}>
                    {/* Back Button */}
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => router.back()}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="arrow-back" size={16} color="#000000" />
                    </TouchableOpacity>

                    {/* Title */}
                    <View style={styles.titleContainer}>
                        <Text style={styles.headerTitle}>New Product</Text>
                    </View>
                </View>
            </View>

            {/* Content */}
            <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                {/* Tabs */}
                <View style={styles.tabsContainer}>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'basic' && styles.tabActive]}
                        onPress={() => setActiveTab('basic')}
                        activeOpacity={0.7}
                    >
                        <Text style={[styles.tabText, activeTab === 'basic' && styles.tabTextActive]}>Simple Product</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'advanced' && styles.tabActive]}
                        onPress={() => setActiveTab('advanced')}
                        activeOpacity={0.7}
                    >
                        <Text style={[styles.tabText, activeTab === 'advanced' && styles.tabTextActive]}>Product with Variants</Text>
                    </TouchableOpacity>
                </View>

                {/* Product Name */}
                <Text style={styles.productName}>Talavera Mugs</Text>

                {/* Essential Card */}
                <EssentialCard key={`essential-${resetKey}`} />

                {/* Price & Stock Card - Conditional based on tab */}
                {activeTab === 'basic' ? (
                    <PriceStockCard key={`price-stock-${resetKey}`} />
                ) : (
                    <PriceStockVariantsCard key={`price-stock-variants-${resetKey}`} />
                )}

                {/* Details Card */}
                <DetailsCard key={`details-${resetKey}`} />

                {/* Action Buttons */}
                <View style={styles.actionButtons}>
                    <TouchableOpacity style={styles.discardButton}>
                        <Text style={styles.actionButtonText}>Save Draft</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.previewButton}>
                        <Text style={styles.actionButtonText}>Preview</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.publishButton}>
                        <Text style={styles.publishButtonText}>Publish</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        backgroundColor: COLORS.background,
        paddingTop: 60,
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        height: 32,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
        width: 32,
        height: 32,
        backgroundColor: COLORS.white,
        borderRadius: 8,
    },
    titleContainer: {
        flexDirection: 'column',
        alignItems: 'flex-start',
        padding: 0,
        gap: 4,
        flex: 1,
        height: 16,
    },
    headerTitle: {
        width: '100%',
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '400',
        fontSize: 16,
        lineHeight: 16,
        color: '#000000',
    },
    content: {
        padding: 16,
        gap: 16,
    },
    tabsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 4,
        height: 42,
        backgroundColor: COLORS.white,
        borderRadius: 8,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 10,
        height: 34,
        borderRadius: 4,
    },
    tabActive: {
        backgroundColor: COLORS.primaryLight,
        borderWidth: 1,
        borderColor: COLORS.primary,
    },
    tabText: {
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '400',
        fontSize: 14,
        lineHeight: 14,
        color: '#000000',
    },
    tabTextActive: {
        color: '#000000',
    },
    productName: {
        width: '100%',
        height: 24,
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '700',
        fontSize: 24,
        lineHeight: 24,
        color: '#000000',
    },
    actionButtons: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        width: '100%',
        height: 40,
    },
    discardButton: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 12,
        height: 40,
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: COLORS.primary,
        borderRadius: 8,
    },
    previewButton: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 12,
        height: 40,
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: COLORS.primary,
        borderRadius: 8,
    },
    publishButton: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 12,
        height: 40,
        backgroundColor: COLORS.primary,
        borderRadius: 8,
    },
    actionButtonText: {
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '400',
        fontSize: 16,
        lineHeight: 16,
        color: '#000000',
    },
    publishButtonText: {
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '400',
        fontSize: 16,
        lineHeight: 16,
        color: '#F5F5F5',
    },
});
