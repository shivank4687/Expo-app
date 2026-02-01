import React from 'react';
import { View, Text, StyleSheet, TextInput, Image, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

interface ShopDetailsCardProps {
    data: {
        company_overview?: string;
        logo?: string | null;
        phone?: string;
    };
    onChange: (field: string, value: string | null) => void;
}

export const ShopDetailsCard: React.FC<ShopDetailsCardProps> = ({ data, onChange }) => {
    const pickImage = async () => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

            if (status !== 'granted') {
                Alert.alert('Permission Denied', 'Please allow access to your media library to upload a logo.');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: 'images',
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (!result.canceled) {
                onChange('logo', result.assets[0].uri);
            }
        } catch (error) {
            console.error('Error picking image:', error);
            Alert.alert('Error', 'Failed to pick image. Please try again.');
        }
    };

    const removeLogo = () => {
        Alert.alert(
            'Remove Logo',
            'Are you sure you want to remove this logo?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: () => onChange('logo', null)
                }
            ]
        );
    };

    return (
        <View style={styles.container}>
            {/* Overview */}
            <View style={styles.fieldContainerLarge}>
                <Text style={styles.label}>Overview</Text>
                <View style={styles.inputContainerLarge}>
                    <TextInput
                        style={styles.inputLarge}
                        placeholder="Overview"
                        placeholderTextColor="#666666"
                        multiline
                        textAlignVertical="top"
                        value={data.company_overview}
                        onChangeText={(val) => onChange('company_overview', val)}
                    />
                </View>
                <Text style={styles.tipText}>
                    Tip: Add origin, technique, materials, time spent, and "made in...".
                </Text>
            </View>

            {/* Logo (optional) */}
            <View style={styles.fieldContainerLogo}>
                <Text style={styles.label}>Logo (optional)</Text>
                <TouchableOpacity
                    style={styles.logoPreviewContainer}
                    onPress={pickImage}
                    activeOpacity={0.7}
                >
                    {data.logo ? (
                        <>
                            <Image source={{ uri: data.logo }} style={styles.logoImage} />
                            <View style={styles.editIconOverlay}>
                                <TouchableOpacity onPress={removeLogo} style={styles.removeButton}>
                                    <Ionicons name="trash" size={14} color="#FFFFFF" />
                                </TouchableOpacity>
                                <Ionicons name="camera" size={16} color="#FFFFFF" />
                            </View>
                        </>
                    ) : (
                        <View style={styles.addLogoPlaceholder}>
                            <Ionicons name="add" size={32} color="#666666" />
                        </View>
                    )}
                </TouchableOpacity>
            </View>

            {/* WhatsApp (for customers) */}
            <View style={styles.fieldContainerSmall}>
                <Text style={styles.label}>WhatsApp (for customers)</Text>
                <View style={styles.inputContainerSmall}>
                    <TextInput
                        style={styles.inputSmall}
                        placeholder="Enter here..."
                        placeholderTextColor="#666666"
                        keyboardType="phone-pad"
                        value={data.phone}
                        onChangeText={(val) => onChange('phone', val)}
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
    fieldContainerLarge: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        padding: 0,
        gap: 8,
        width: 329,
        height: 187,
    },
    fieldContainerSmall: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        padding: 0,
        gap: 8,
        width: 329,
        height: 67,
    },
    fieldContainerLogo: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        padding: 0,
        gap: 8,
        width: 329,
    },
    logoPreviewContainer: {
        width: 100,
        height: 100,
        backgroundColor: '#EEEEEF',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    logoImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    addLogoPlaceholder: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    editIconOverlay: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: 4,
        borderTopLeftRadius: 8,
        flexDirection: 'row',
        gap: 4,
        alignItems: 'center',
    },
    removeButton: {
        padding: 2,
    },
    label: {
        width: 329,
        height: 19,
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '500',
        fontSize: 16,
        lineHeight: 19,
        color: '#000000',
    },
    inputContainerLarge: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'flex-start',
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 52,
        gap: 10,
        width: 329,
        height: 112,
        backgroundColor: '#EEEEEF',
        borderRadius: 8,
    },
    inputContainerSmall: {
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
    inputLarge: {
        flex: 1,
        height: 48,
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '400',
        fontSize: 16,
        lineHeight: 16,
        color: '#666666',
        padding: 0,
    },
    inputSmall: {
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
    tipText: {
        width: 329,
        height: 40,
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '400',
        fontSize: 14,
        lineHeight: 20,
        color: '#666666',
    }
});
