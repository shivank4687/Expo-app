import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface TrackingInfoCardProps {
    onSubmit?: (trackingNumber: string, photoUri: string) => void;
}

export default function TrackingInfoCard({ onSubmit }: TrackingInfoCardProps) {
    const [trackingNumber, setTrackingNumber] = useState('');
    const [photoUri, setPhotoUri] = useState('');

    const handleSubmit = () => {
        if (onSubmit) {
            onSubmit(trackingNumber, photoUri);
        }
    };

    const handlePhotoUpload = () => {
        // TODO: Implement photo upload functionality
        console.log('Photo upload clicked');
    };

    return (
        <View style={styles.container}>
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
                    />
                </View>
            </View>

            {/* Upload Photo Section */}
            <View style={styles.fieldContainer}>
                <Text style={styles.label}>Upload photo</Text>
                <TouchableOpacity
                    style={styles.inputContainer}
                    onPress={handlePhotoUpload}
                    activeOpacity={0.7}
                >
                    <Ionicons name="attach-outline" size={16} color="#0A292D" />
                    <Text style={styles.input}>Enter here...</Text>
                </TouchableOpacity>
            </View>

            {/* Submit Button */}
            <View style={styles.buttonContainer}>
                <TouchableOpacity
                    style={styles.submitButton}
                    onPress={handleSubmit}
                    activeOpacity={0.8}
                >
                    <Text style={styles.buttonText}>Submit</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'column',
        alignItems: 'center',
        padding: 8,
        gap: 8,
        width: '100%',
        borderWidth: 1,
        borderColor: '#E9E3D3',
        borderRadius: 8,
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
        lineHeight: 19.2, // 120% of 16px
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
        height: 40,
        backgroundColor: '#F3F0E7',
        borderRadius: 8,
        alignSelf: 'stretch',
    },
    input: {
        flex: 1,
        fontFamily: 'Inter',
        fontWeight: '500',
        fontSize: 16,
        lineHeight: 16, // 100% of 16px
        color: '#0A292D',
    },
    buttonContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: 0,
        gap: 8,
        height: 40,
        alignSelf: 'stretch',
    },
    submitButton: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 12,
        gap: 8,
        height: 40,
        backgroundColor: '#00615E',
        borderRadius: 8,
    },
    buttonText: {
        fontFamily: 'Inter',
        fontWeight: '400',
        fontSize: 16,
        lineHeight: 16, // 100% of 16px
        color: '#F5F5F5',
    },
});
