import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/features/supplier-panel/styles';
import { EditIcon, ToggleIcon, CopyIcon } from '@/assets/icons';

export default function ProductViewScreen() {
    const params = useLocalSearchParams();
    const router = useRouter();
    const { id, name } = params;

    const [selectedImageIndex, setSelectedImageIndex] = useState(0);

    // Placeholder images - will be replaced with actual product images
    const productImages = [
        'https://via.placeholder.com/400x250',
        'https://via.placeholder.com/400x250',
        'https://via.placeholder.com/400x250',
        'https://via.placeholder.com/400x250',
    ];

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
                        <Text style={styles.headerTitle}>Products</Text>
                    </View>
                </View>
            </View>

            {/* Content */}
            <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                {/* Product Name */}
                <Text style={styles.productName}>{name || 'Product Name'}</Text>

                {/* Main Product Image */}
                <View style={styles.mainImageContainer}>
                    <Image
                        source={{ uri: productImages[selectedImageIndex] }}
                        style={styles.mainImage}
                        resizeMode="cover"
                    />
                </View>

                {/* Thumbnail Gallery */}
                <View style={styles.thumbnailGallery}>
                    {productImages.map((image, index) => (
                        <TouchableOpacity
                            key={index}
                            style={styles.thumbnailContainer}
                            onPress={() => setSelectedImageIndex(index)}
                            activeOpacity={0.7}
                        >
                            <Image
                                source={{ uri: image }}
                                style={styles.thumbnail}
                                resizeMode="cover"
                            />
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Action Buttons */}
                <View style={styles.actionsContainer}>
                    {/* First Row - 3 Buttons */}
                    <View style={styles.buttonRow}>
                        <TouchableOpacity style={styles.actionButton}>
                            <EditIcon width={16} height={16} color="#000000" />
                            <Text style={styles.buttonText}>Edit</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.actionButton}>
                            <CopyIcon width={16} height={16} color="#000000" />
                            <Text style={styles.buttonText}>Duplicate</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.actionButton}>
                            <ToggleIcon width={16} height={16} color="#000000" />
                            <Text style={styles.buttonText}>Disable</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Second Row - Full Width Button */}
                    <TouchableOpacity style={styles.primaryButton}>
                        <EditIcon width={16} height={16} color="#000000" />
                        <Text style={styles.buttonText}>Quick edit price/stock</Text>
                    </TouchableOpacity>
                </View>

                {/* Pricing & Inventory Card */}
                <View style={styles.infoCard}>
                    <Text style={styles.cardTitle}>Pricing & Inventory</Text>

                    {/* Price tiers */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Price tiers:</Text>
                        <View style={styles.inputContainer}>
                            <Text style={styles.inputPlaceholder}>Enter here...</Text>
                            <Ionicons name="chevron-down" size={16} color="#666666" />
                        </View>
                    </View>

                    {/* Flash Discount Toggle */}
                    <View style={styles.toggleRow}>
                        <Text style={styles.toggleLabel}>Flash Discount: -18%</Text>
                        <ToggleIcon width={24} height={24} color="#000000" />
                    </View>

                    {/* Stock */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Stock</Text>
                        <View style={styles.inputContainer}>
                            <Text style={styles.inputPlaceholder}>Enter here...</Text>
                        </View>
                    </View>

                    {/* Made to Order Toggle */}
                    <View style={styles.toggleRow}>
                        <Text style={styles.toggleLabel}>Made to Order: [Yes/No]</Text>
                        <ToggleIcon width={24} height={24} color="#000000" />
                    </View>
                </View>

                {/* Production & Shipping Card */}
                <View style={styles.infoCard}>
                    <Text style={styles.cardTitle}>Production & Shipping</Text>

                    {/* Production time */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Production time:</Text>
                        <View style={styles.inputContainer}>
                            <Text style={styles.inputPlaceholder}>Enter here...</Text>
                            <Ionicons name="chevron-down" size={16} color="#666666" />
                        </View>
                    </View>

                    {/* Shipping method */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Shipping method:</Text>
                        <View style={styles.inputContainer}>
                            <Text style={styles.inputPlaceholder}>Enter here...</Text>
                            <Ionicons name="chevron-down" size={16} color="#666666" />
                        </View>
                    </View>

                    {/* Shipping logic */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Shipping logic:</Text>
                        <View style={styles.inputContainer}>
                            <Text style={styles.inputPlaceholder}>Enter here...</Text>
                        </View>
                    </View>

                    {/* Free shipping threshold */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Free shipping threshold:</Text>
                        <View style={styles.thresholdRow}>
                            <View style={styles.thresholdChip}>
                                <Text style={styles.chipText}>MX$50</Text>
                            </View>
                            <View style={styles.thresholdChip}>
                                <Text style={styles.chipText}>MX$50</Text>
                            </View>
                            <View style={styles.thresholdChip}>
                                <Text style={styles.chipText}>MX$50</Text>
                            </View>
                        </View>
                    </View>

                    {/* Estimated arrival */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Estimated arrival:</Text>
                        <View style={styles.inputContainer}>
                            <Text style={styles.inputPlaceholder}>Enter here...</Text>
                            <Ionicons name="calendar-outline" size={16} color="#666666" />
                        </View>
                    </View>
                </View>

                {/* Bottom Action Buttons */}
                <View style={styles.bottomActions}>
                    <TouchableOpacity style={styles.secondaryActionButton}>
                        <Text style={styles.buttonText}>Save Draft</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.secondaryActionButton}>
                        <Text style={styles.buttonText}>Preview</Text>
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
    productName: {
        width: '100%',
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '700',
        fontSize: 24,
        lineHeight: 24,
        color: '#000000',
    },
    mainImageContainer: {
        width: '100%',
        height: 250,
        backgroundColor: COLORS.white,
        borderRadius: 16,
        overflow: 'hidden',
    },
    mainImage: {
        width: '100%',
        height: '100%',
    },
    thumbnailGallery: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        width: '100%',
        height: 60,
    },
    thumbnailContainer: {
        flex: 1,
        height: 60,
        backgroundColor: COLORS.white,
        borderRadius: 8,
        overflow: 'hidden',
    },
    thumbnail: {
        width: '100%',
        height: '100%',
    },
    actionsContainer: {
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 8,
        width: '100%',
    },
    buttonRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        width: '100%',
        height: 40,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 12,
        gap: 8,
        height: 40,
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: COLORS.primary,
        borderRadius: 8,
    },
    primaryButton: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 12,
        gap: 8,
        width: '100%',
        height: 40,
        backgroundColor: COLORS.primaryLight,
        borderWidth: 1,
        borderColor: COLORS.primary,
        borderRadius: 8,
    },
    buttonText: {
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '400',
        fontSize: 16,
        lineHeight: 16,
        color: '#000000',
    },
    infoCard: {
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'flex-start',
        padding: 16,
        gap: 16,
        width: '100%',
        backgroundColor: COLORS.white,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 3,
        borderRadius: 16,
    },
    cardTitle: {
        width: '100%',
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '500',
        fontSize: 20,
        lineHeight: 24,
        color: '#000000',
    },
    inputGroup: {
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 8,
        width: '100%',
    },
    inputLabel: {
        width: '100%',
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '500',
        fontSize: 16,
        lineHeight: 19,
        color: '#000000',
    },
    inputContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 12,
        paddingHorizontal: 16,
        width: '100%',
        height: 40,
        backgroundColor: '#EEEEEF',
        borderRadius: 8,
    },
    inputPlaceholder: {
        flex: 1,
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '400',
        fontSize: 16,
        lineHeight: 16,
        color: '#666666',
    },
    toggleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        height: 24,
    },
    toggleLabel: {
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '500',
        fontSize: 16,
        lineHeight: 19,
        color: '#000000',
    },
    thresholdRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'flex-start',
        gap: 8,
        width: '100%',
        height: 40,
    },
    thresholdChip: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 12,
        paddingHorizontal: 16,
        height: 40,
        backgroundColor: '#EEEEEF',
        borderRadius: 8,
    },
    chipText: {
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '400',
        fontSize: 16,
        lineHeight: 16,
        color: '#666666',
    },
    bottomActions: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        width: '100%',
        height: 40,
    },
    secondaryActionButton: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 12,
        gap: 8,
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
        gap: 8,
        height: 40,
        backgroundColor: COLORS.primary,
        borderRadius: 8,
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
