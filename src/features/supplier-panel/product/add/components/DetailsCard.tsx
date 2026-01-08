import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/features/supplier-panel/styles';
import { forwardRef, useImperativeHandle } from 'react';
import { InputModal } from '@/shared/components';
import { useToast } from '@/shared/components/Toast';
import { productAttributesApi } from '../api/product-attributes.api';

const MANUFACTURING_ORIGINS = [
    'Handmade', 'Semi industrial', 'Industrial', 'Locally Produced', 'Imported'
];

const FEATURES = [
    'Color', 'Culture', 'Technical', 'Event', 'Blue', 'Green', 'White', 'Red'
];

import { ProductAttribute } from '../api/product-attributes.api';

export interface DetailsCardRef {
    getData: () => any;
}

export interface DetailsCardProps {
    attributes: ProductAttribute[];
    onAttributesRefresh?: () => Promise<void>;
}

const DetailsCard = forwardRef<DetailsCardRef, DetailsCardProps>(({ attributes, onAttributesRefresh }, ref) => {
    const [selectedOrigins, setSelectedOrigins] = useState<string[]>([]);
    const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
    const [showOriginModal, setShowOriginModal] = useState(false);
    const [showFeatureModal, setShowFeatureModal] = useState(false);
    const [isAddingOrigin, setIsAddingOrigin] = useState(false);
    const [isAddingFeature, setIsAddingFeature] = useState(false);

    const { showToast } = useToast();

    const originOptions = attributes.find(a => a.code === 'manufacturing_origin')?.options || [];
    const featureOptions = attributes.find(a => a.code === 'manufacturing_value')?.options || [];

    useImperativeHandle(ref, () => ({
        getData: () => ({
            manufacturing_origin: selectedOrigins,
            manufacturing_value: selectedFeatures,
        })
    }));

    const toggleOrigin = (id: string) => {
        setSelectedOrigins(prev =>
            prev.includes(id)
                ? prev.filter(o => o !== id)
                : [...prev, id]
        );
    };

    const toggleFeature = (id: string) => {
        setSelectedFeatures(prev =>
            prev.includes(id)
                ? prev.filter(f => f !== id)
                : [...prev, id]
        );
    };

    const handleSubmitOrigin = async (originName: string) => {
        setIsAddingOrigin(true);
        try {
            const newOption = await productAttributesApi.createAttributeOption(
                'manufacturing_origin',
                originName
            );

            setSelectedOrigins(prev => [...prev, newOption.id.toString()]);

            if (onAttributesRefresh) {
                await onAttributesRefresh();
            }

            showToast({
                message: `Origin "${originName}" has been added!`,
                type: 'success',
            });
        } catch (error) {
            console.error('Error adding origin:', error);
            showToast({
                message: 'Failed to add origin. Please try again.',
                type: 'error',
            });
            throw error;
        } finally {
            setIsAddingOrigin(false);
        }
    };

    const handleSubmitFeature = async (featureName: string) => {
        setIsAddingFeature(true);
        try {
            const newOption = await productAttributesApi.createAttributeOption(
                'manufacturing_value',
                featureName
            );

            setSelectedFeatures(prev => [...prev, newOption.id.toString()]);

            if (onAttributesRefresh) {
                await onAttributesRefresh();
            }

            showToast({
                message: `Feature "${featureName}" has been added!`,
                type: 'success',
            });
        } catch (error) {
            console.error('Error adding feature:', error);
            showToast({
                message: 'Failed to add feature. Please try again.',
                type: 'error',
            });
            throw error;
        } finally {
            setIsAddingFeature(false);
        }
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
                        {(originOptions.length > 0 ? originOptions : MANUFACTURING_ORIGINS).map((option, index) => {
                            const label = typeof option === 'string' ? option : option.admin_name;
                            const value = typeof option === 'string' ? option : option.id.toString();
                            return (
                                <TouchableOpacity
                                    key={index}
                                    style={[
                                        styles.chip,
                                        selectedOrigins.includes(value) && styles.chipActive
                                    ]}
                                    onPress={() => toggleOrigin(value)}
                                >
                                    <Text style={styles.chipText}>{label}</Text>
                                </TouchableOpacity>
                            );
                        })}
                        <TouchableOpacity style={styles.addButton} onPress={() => setShowOriginModal(true)}>
                            <Ionicons name="add" size={24} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.tipText}>
                        Features: Select and add only the essentials.
                    </Text>
                </View>

                {/* Features Section */}
                <View style={styles.chipsContainer}>
                    {(featureOptions.length > 0 ? featureOptions : FEATURES).map((option, index) => {
                        const label = typeof option === 'string' ? option : option.admin_name;
                        const value = typeof option === 'string' ? option : option.id.toString();
                        return (
                            <TouchableOpacity
                                key={index}
                                style={[
                                    styles.chip,
                                    selectedFeatures.includes(value) && styles.chipActive
                                ]}
                                onPress={() => toggleFeature(value)}
                            >
                                <Text style={styles.chipText}>{label}</Text>
                            </TouchableOpacity>
                        );
                    })}
                    <TouchableOpacity style={styles.addButton} onPress={() => setShowFeatureModal(true)}>
                        <Ionicons name="add" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
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

            {/* Origin Input Modal */}
            <InputModal
                visible={showOriginModal}
                onClose={() => setShowOriginModal(false)}
                onSubmit={handleSubmitOrigin}
                title="Add Manufacturing Origin"
                placeholder="Enter origin name..."
                submitButtonText="Add Origin"
                isLoading={isAddingOrigin}
            />

            {/* Feature Input Modal */}
            <InputModal
                visible={showFeatureModal}
                onClose={() => setShowFeatureModal(false)}
                onSubmit={handleSubmitFeature}
                title="Add Feature/Value"
                placeholder="Enter feature name..."
                submitButtonText="Add Feature"
                isLoading={isAddingFeature}
            />
        </View>
    );
});

export default DetailsCard;

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
    addButton: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        width: 40,
        height: 40,
        backgroundColor: COLORS.primary,
        borderRadius: 8,
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
