import React from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/features/supplier-panel/styles';

export const ShopMediaCard = () => {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Photos, Banner, and Videos</Text>

            {/* Main Banner section */}
            <View style={styles.sectionContainer}>
                <View style={styles.headerRow}>
                    <Text style={styles.label}>Main Banner</Text>
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>Edit (app)</Text>
                    </View>
                </View>
                <View style={styles.inputContainer}>
                    <Ionicons name="attach" size={16} color="#666666" />
                    <TextInput
                        style={styles.input}
                        placeholder="Enter here..."
                        placeholderTextColor="#666666"
                    />
                </View>
                <Text style={styles.description}>
                    Recommended: Horizontal photo (workshop, stand, artisan at work).
                </Text>
            </View>

            {/* Gallery section */}
            <View style={styles.sectionContainer}>
                <View style={styles.headerRow}>
                    <Text style={styles.label}>Gallery (photos + videos)</Text>
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>Retouch (2 max)</Text>
                    </View>
                </View>
                <View style={styles.inputContainer}>
                    <Ionicons name="attach" size={16} color="#666666" />
                    <TextInput
                        style={styles.input}
                        placeholder="Enter here..."
                        placeholderTextColor="#666666"
                    />
                </View>
                <Text style={styles.description}>
                    Max. 8 images (photos + videos). Video 20s max (to show process).
                </Text>

                {/* Photo Grid */}
                <View style={styles.photoGrid}>
                    {[1, 2, 3, 4, 5].map((item) => (
                        <View key={item} style={styles.photoSlot}>
                            <Ionicons name="add" size={24} color="#666666" />
                        </View>
                    ))}
                </View>
            </View>

            {/* Social Media */}
            <View style={styles.fieldContainer}>
                <Text style={styles.label}>Social Media (Instagram / Facebook)</Text>
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter here..."
                        placeholderTextColor="#666666"
                    />
                </View>
            </View>

            {/* Shareable Link */}
            <View style={styles.fieldContainer}>
                <Text style={styles.label}>Shareable Link</Text>
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter here..."
                        placeholderTextColor="#666666"
                    />
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        padding: 0,
        gap: 16,
        alignSelf: 'stretch',
    },
    title: {
        width: 329,
        height: 24,
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '500',
        fontSize: 20,
        lineHeight: 24,
        color: '#000000',
    },
    sectionContainer: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        padding: 0,
        gap: 8,
        width: 329,
        position: 'relative',
    },
    fieldContainer: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        padding: 0,
        gap: 8,
        width: 329,
        height: 67,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        height: 22,
    },
    label: {
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '500',
        fontSize: 16,
        lineHeight: 19,
        color: '#000000',
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        backgroundColor: '#E0FFFE',
        borderWidth: 1,
        borderColor: '#00615E',
        borderRadius: 70,
        justifyContent: 'center',
        alignItems: 'center',
    },
    badgeText: {
        fontFamily: 'Inter',
        fontSize: 12,
        color: '#000000',
    },
    inputContainer: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 10,
        width: 329,
        height: 40,
        backgroundColor: '#EEEEEF',
        borderRadius: 8,
    },
    input: {
        flex: 1,
        height: 16,
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '400',
        fontSize: 16,
        lineHeight: 16,
        color: '#666666',
        padding: 0,
    },
    description: {
        width: 329,
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '400',
        fontSize: 14,
        lineHeight: 20,
        color: '#666666',
    },
    photoGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        width: 329,
        marginTop: 8,
    },
    photoSlot: {
        width: 59.4,
        height: 60,
        backgroundColor: '#EEEEEF',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
