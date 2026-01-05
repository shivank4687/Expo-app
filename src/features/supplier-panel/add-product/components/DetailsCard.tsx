import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/features/supplier-panel/styles';

const MANUFACTURING_ORIGINS = [
    'Handmade', 'Semi industrial', 'Industrial', 'Locally Produced', 'Imported'
];

const FEATURES = [
    'Color', 'Culture', 'Technical', 'Event', 'Blue', 'Green', 'White', 'Red'
];

export default function DetailsCard() {
    const [selectedOrigins, setSelectedOrigins] = useState<string[]>([]);
    const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);

    const toggleOrigin = (origin: string) => {
        setSelectedOrigins(prev =>
            prev.includes(origin)
                ? prev.filter(o => o !== origin)
                : [...prev, origin]
        );
    };

    const toggleFeature = (feature: string) => {
        setSelectedFeatures(prev =>
            prev.includes(feature)
                ? prev.filter(f => f !== feature)
                : [...prev, feature]
        );
    };

    return (
        <View style={styles.card}>
            {/* Card Title with Badge */}
            <View style={styles.titleContainer}>
                <Text style={styles.cardTitle}>3) Details</Text>
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>Light + Fast</Text>
                </View>
            </View>

            {/* Main Content */}
            <View style={styles.content}>
                {/* Manufacturing Origin Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Manufacturing Origin</Text>

                    <View style={styles.chipsContainer}>
                        {MANUFACTURING_ORIGINS.map((origin, index) => (
                            <TouchableOpacity
                                key={index}
                                style={[
                                    styles.chip,
                                    selectedOrigins.includes(origin) && styles.chipActive
                                ]}
                                onPress={() => toggleOrigin(origin)}
                            >
                                <Text style={styles.chipText}>{origin}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <Text style={styles.tipText}>
                        Features: Select and add only the essentials.
                    </Text>
                </View>

                {/* Features Section */}
                <View style={styles.chipsContainer}>
                    {FEATURES.map((feature, index) => (
                        <TouchableOpacity
                            key={index}
                            style={[
                                styles.chip,
                                selectedFeatures.includes(feature) && styles.chipActive
                            ]}
                            onPress={() => toggleFeature(feature)}
                        >
                            <Text style={styles.chipText}>{feature}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Action Buttons */}
                <View style={styles.buttonGroup}>
                    <TouchableOpacity style={styles.primaryButton}>
                        <Ionicons name="add" size={16} color="#000000" />
                        <Text style={styles.buttonText}>Add Feature</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.secondaryButton}>
                        <Text style={styles.buttonText}>Create features and Values</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'flex-start',
        padding: 16,
        gap: 8,
        width: '100%',
        backgroundColor: COLORS.white,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 3,
        borderRadius: 16,
        position: 'relative',
    },
    titleContainer: {
        width: '100%',
        position: 'relative',
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
    badge: {
        position: 'absolute',
        right: 0,
        top: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 4,
        paddingHorizontal: 8,
        backgroundColor: COLORS.primaryLight,
        borderWidth: 1,
        borderColor: COLORS.primary,
        borderRadius: 70,
    },
    badgeText: {
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '400',
        fontSize: 12,
        lineHeight: 14,
        color: '#000000',
    },
    content: {
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 16,
        width: '100%',
    },
    section: {
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 4,
        width: '100%',
    },
    sectionTitle: {
        width: '100%',
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '500',
        fontSize: 16,
        lineHeight: 19,
        color: '#000000',
    },
    chipsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'flex-start',
        gap: 8,
        width: '100%',
    },
    chip: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        height: 40,
        backgroundColor: '#EEEEEF',
        borderRadius: 8,
    },
    chipActive: {
        backgroundColor: COLORS.primaryLight,
        borderWidth: 1,
        borderColor: COLORS.primary,
    },
    chipText: {
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '400',
        fontSize: 16,
        lineHeight: 16,
        color: '#666666',
    },
    tipText: {
        width: '100%',
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '400',
        fontSize: 14,
        lineHeight: 20,
        color: '#666666',
    },
    buttonGroup: {
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 8,
        width: '100%',
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
    secondaryButton: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 12,
        gap: 8,
        width: '100%',
        height: 40,
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
});
