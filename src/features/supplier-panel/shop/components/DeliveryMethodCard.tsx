import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/features/supplier-panel/styles';

export const DeliveryMethodCard = () => {
    return (
        <View style={styles.container}>
            <View style={styles.headerRow}>
                <Text style={styles.title}>Delivery Method</Text>
                <View style={styles.mxBadge}>
                    <Text style={styles.mxText}>MX</Text>
                </View>
            </View>

            {/* Center Deposit section */}
            <View style={styles.sectionContainer}>
                <View style={[styles.badge, styles.recommendedBadge]}>
                    <Text style={styles.badgeText}>Recommended</Text>
                </View>
                <View style={styles.checkboxTitleRow}>
                    <View style={styles.checkbox} />
                    <View style={styles.flex1}>
                        <Text style={styles.sectionTitle}>Center Deposit</Text>
                        <View style={styles.rowSpaceBetween}>
                            <Text style={styles.description}>Nearby Centers</Text>
                            <Text style={styles.description}>Selection: 0</Text>
                        </View>
                    </View>
                </View>

                {/* Sub-card with list */}
                <View style={styles.whiteSubCard}>
                    <View style={styles.rowSpaceBetween}>
                        <Text style={styles.subTitle}>List Map</Text>
                        <Text style={styles.description}>Another address</Text>
                    </View>

                    {/* Reforma Shipping Center */}
                    <View style={styles.locationItem}>
                        <View style={styles.checkbox} />
                        <View style={styles.flex1}>
                            <Text style={styles.sectionTitle}>Reforma Shipping Center</Text>
                            <Text style={styles.description}>1.2 km Mon-Sat 9:00-18:00</Text>
                        </View>
                    </View>

                    {/* Roma Norte Drop-off Point */}
                    <View style={styles.locationItem}>
                        <View style={styles.checkbox} />
                        <View style={styles.flex1}>
                            <Text style={styles.sectionTitle}>Roma Norte Drop-off Point</Text>
                            <Text style={styles.description}>2.0 km Mon-Sun 10:00-20:00</Text>
                        </View>
                    </View>

                    <View>
                        <Text style={styles.sectionTitle}>You can select multiple centers.</Text>
                        <Text style={styles.description}>Recommendation minime1</Text>
                    </View>
                </View>
            </View>

            {/* Pick up at my address */}
            <View style={styles.sectionContainerSmall}>
                <View style={[styles.badge, styles.alternativeBadge]}>
                    <Text style={styles.badgeText}>Alternative</Text>
                </View>
                <View style={styles.checkboxTitleRow}>
                    <View style={styles.checkbox} />
                    <View style={styles.flex1}>
                        <Text style={styles.sectionTitle}>Pick up at my address</Text>
                        <Text style={styles.description}>
                            By default, we use the profile address. If you need another one, enable it and enter the new address
                        </Text>
                    </View>
                </View>
            </View>

            {/* Configure my shipping */}
            <View style={styles.sectionContainerSmall}>
                <View style={[styles.badge, styles.optionalBadge]}>
                    <Text style={styles.badgeText}>Optional</Text>
                </View>
                <View style={styles.checkboxTitleRow}>
                    <View style={styles.checkbox} />
                    <View style={styles.flex1}>
                        <Text style={styles.sectionTitle}>Configure my shipping</Text>
                        <Text style={styles.description}>
                            Create your carrier and pricing rules. For "bulky" items, shipping is pending until you confirm the amount.
                        </Text>
                    </View>
                </View>
            </View>

            {/* Buttons */}
            <View style={styles.buttonRow}>
                <TouchableOpacity style={styles.primaryButton}>
                    <Ionicons name="add" size={16} color="#F5F5F5" />
                    <Text style={styles.primaryButtonText}>Add</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.secondaryButton}>
                    <Ionicons name="list" size={16} color="#000000" />
                    <Text style={styles.secondaryButtonText}>Rules</Text>
                </TouchableOpacity>
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
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        width: '100%',
    },
    title: {
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '500',
        fontSize: 20,
        lineHeight: 24,
        color: '#000000',
    },
    mxBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        backgroundColor: '#E0FFFE',
        borderWidth: 1,
        borderColor: '#00615E',
        borderRadius: 70,
        justifyContent: 'center',
        alignItems: 'center',
    },
    mxText: {
        fontFamily: 'Inter',
        fontSize: 12,
        color: '#000000',
    },
    sectionContainer: {
        width: "100%",
        minHeight: 296,
        backgroundColor: '#FCF7EA',
        borderWidth: 1,
        borderColor: '#EEEEEF',
        borderRadius: 8,
        padding: 12, // Increased padding
        gap: 16,
    },
    sectionContainerSmall: {
        width: "100%",
        minHeight: 99,
        backgroundColor: '#FCF7EA',
        borderWidth: 1,
        borderColor: '#EEEEEF',
        borderRadius: 8,
        padding: 12, // Increased padding
        gap: 16,
    },
    checkboxTitleRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        paddingRight: 80, // Add padding right to avoid badge overlap
    },
    checkbox: {
        width: 16,
        height: 16,
        backgroundColor: '#EEEEEF',
        borderWidth: 1,
        borderColor: '#666666',
        borderRadius: 4,
        marginTop: 2,
    },
    flex1: {
        flex: 1,
    },
    sectionTitle: {
        fontFamily: 'Inter',
        fontWeight: '500',
        fontSize: 16,
        lineHeight: 19,
        color: '#000000',
    },
    description: {
        fontFamily: 'Inter',
        fontWeight: '400',
        fontSize: 14,
        lineHeight: 20,
        color: '#666666',
    },
    rowSpaceBetween: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
    },
    whiteSubCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        padding: 8,
        gap: 8,
    },
    subTitle: {
        fontFamily: 'Inter',
        fontWeight: '500',
        fontSize: 16,
        lineHeight: 19,
        color: '#000000',
    },
    locationItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: '#EEEEEF',
        borderRadius: 4,
        paddingHorizontal: 8,
    },
    badge: {
        position: 'absolute',
        top: 12, // Match section padding
        right: 12, // Match section padding
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 70,
        borderWidth: 1,
        zIndex: 10,
    },
    recommendedBadge: {
        backgroundColor: '#E0FFFE',
        borderColor: '#00615E',
    },
    alternativeBadge: {
        backgroundColor: '#E0FFFE',
        borderColor: '#00615E',
    },
    optionalBadge: {
        backgroundColor: '#E0FFFE',
        borderColor: '#00615E',
    },
    badgeText: {
        fontFamily: 'Inter',
        fontSize: 12,
        color: '#000000',
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 8,
        width: '100%',
    },
    primaryButton: {
        flex: 1,
        height: 40,
        backgroundColor: '#00615E',
        borderRadius: 8,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    secondaryButton: {
        flex: 1,
        height: 40,
        borderWidth: 1,
        borderColor: '#00615E',
        borderRadius: 8,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    primaryButtonText: {
        fontFamily: 'Inter',
        fontSize: 16,
        color: '#F5F5F5',
    },
    secondaryButtonText: {
        fontFamily: 'Inter',
        fontSize: 16,
        color: '#000000',
    }
});
