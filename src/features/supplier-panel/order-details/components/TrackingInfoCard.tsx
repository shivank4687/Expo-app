import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { OrderShipment } from '../../orders/api/orders.api';

interface TrackingInfoCardProps {
    shipments?: OrderShipment[];
    isSubmitting?: boolean;
    onSubmit?: (trackingNumber: string, photoUri: string) => void;
}

export default function TrackingInfoCard({ shipments = [], isSubmitting = false, onSubmit }: TrackingInfoCardProps) {
    const [trackingNumber, setTrackingNumber] = useState('');
    const [photoUri, setPhotoUri] = useState('');

    const handleSubmit = () => {
        if (onSubmit && trackingNumber) {
            onSubmit(trackingNumber, photoUri);
        }
    };

    const handlePhotoUpload = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        });

        if (!result.canceled) {
            setPhotoUri(result.assets[0].uri);
        }
    };

    const removePhoto = () => {
        setPhotoUri('');
    };

    return (
        <View style={styles.container}>
            {/* Existing Shipments Section */}
            {shipments.length > 0 && (
                <View style={styles.existingShipments}>
                    <Text style={styles.sectionTitle}>Existing Shipments</Text>
                    {shipments.map((shipment) => (
                        <View key={shipment.id} style={styles.shipmentItem}>
                            <View style={styles.shipmentInfo}>
                                <Text style={styles.shipmentLabel}>ID: #{shipment.id}</Text>
                                <Text style={styles.shipmentText}>Carrier: {shipment.carrier_title}</Text>
                                <Text style={styles.shipmentText}>Tracking: {shipment.track_number}</Text>
                                <Text style={styles.shipmentDate}>
                                    {new Date(shipment.created_at).toLocaleDateString()}
                                </Text>
                            </View>
                            <Ionicons name="checkmark-circle" size={24} color="#00615E" />
                        </View>
                    ))}
                </View>
            )}

            {/* Form Section - Hidden if shipments already exist */}
            {shipments.length === 0 && (
                <View style={styles.formContainer}>
                    <Text style={styles.sectionTitle}>Add Tracking Information</Text>

                    {/* Tracking Number Section */}
                    <View style={styles.fieldContainer}>
                        <Text style={styles.label}>Tracking number</Text>
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter here..."
                                placeholderTextColor="#0A292D"
                                value={trackingNumber}
                                onChangeText={setTrackingNumber}
                                editable={!isSubmitting}
                            />
                        </View>
                    </View>

                    {/* Upload Photo Section */}
                    <View style={styles.fieldContainer}>
                        <Text style={styles.label}>Upload photo</Text>
                        {photoUri ? (
                            <View style={styles.photoPreviewContainer}>
                                <Image source={{ uri: photoUri }} style={styles.photoPreview} />
                                <TouchableOpacity style={styles.removePhotoButton} onPress={removePhoto}>
                                    <Ionicons name="close-circle" size={24} color="#EF4444" />
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <TouchableOpacity
                                style={styles.inputContainer}
                                onPress={handlePhotoUpload}
                                activeOpacity={0.7}
                                disabled={isSubmitting}
                            >
                                <Ionicons name="attach-outline" size={16} color="#0A292D" />
                                <Text style={styles.input}>Select a photo...</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Submit Button */}
                    <View style={styles.buttonContainer}>
                        <TouchableOpacity
                            style={[
                                styles.submitButton,
                                (!trackingNumber || isSubmitting) && styles.disabledButton
                            ]}
                            onPress={handleSubmit}
                            activeOpacity={0.8}
                            disabled={!trackingNumber || isSubmitting}
                        >
                            {isSubmitting ? (
                                <ActivityIndicator size="small" color="#F5F5F5" />
                            ) : (
                                <Text style={styles.buttonText}>Submit</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        gap: 16,
    },
    existingShipments: {
        padding: 16,
        backgroundColor: '#F8FBFB',
        borderWidth: 1,
        borderColor: '#E9E3D3',
        borderRadius: 8,
        gap: 12,
    },
    shipmentItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E9E3D3',
    },
    shipmentInfo: {
        flex: 1,
        gap: 2,
    },
    shipmentLabel: {
        fontFamily: 'Inter',
        fontWeight: '600',
        fontSize: 14,
        color: '#00615E',
    },
    shipmentText: {
        fontFamily: 'Inter',
        fontWeight: '400',
        fontSize: 14,
        color: '#333333',
    },
    shipmentDate: {
        fontFamily: 'Inter',
        fontWeight: '400',
        fontSize: 12,
        color: '#666666',
        marginTop: 4,
    },
    formContainer: {
        flexDirection: 'column',
        alignItems: 'center',
        padding: 16,
        gap: 16,
        width: '100%',
        borderWidth: 1,
        borderColor: '#E9E3D3',
        borderRadius: 8,
        backgroundColor: '#FFFFFF',
    },
    sectionTitle: {
        fontFamily: 'Inter',
        fontWeight: '600',
        fontSize: 18,
        color: '#000000',
        alignSelf: 'stretch',
        marginBottom: 4,
    },
    fieldContainer: {
        flexDirection: 'column',
        alignItems: 'flex-start',
        padding: 0,
        gap: 8,
        alignSelf: 'stretch',
    },
    label: {
        fontFamily: 'Inter',
        fontWeight: '500',
        fontSize: 16,
        lineHeight: 19.2,
        color: '#000000',
        alignSelf: 'stretch',
    },
    inputContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 10,
        height: 44,
        backgroundColor: '#F3F0E7',
        borderRadius: 8,
        alignSelf: 'stretch',
    },
    input: {
        flex: 1,
        fontFamily: 'Inter',
        fontWeight: '500',
        fontSize: 16,
        color: '#0A292D',
    },
    photoPreviewContainer: {
        position: 'relative',
        width: '100%',
        height: 200,
        borderRadius: 8,
        overflow: 'hidden',
    },
    photoPreview: {
        width: '100%',
        height: '100%',
    },
    removePhotoButton: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        borderRadius: 12,
    },
    buttonContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: 0,
        gap: 8,
        height: 48,
        alignSelf: 'stretch',
    },
    submitButton: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 12,
        gap: 8,
        height: 48,
        backgroundColor: '#00615E',
        borderRadius: 8,
    },
    disabledButton: {
        opacity: 0.6,
    },
    buttonText: {
        fontFamily: 'Inter',
        fontWeight: '600',
        fontSize: 16,
        color: '#F5F5F5',
    },
});
