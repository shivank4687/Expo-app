import React from 'react';
import { View, Text, StyleSheet, TextInput, Image, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

interface ShopMediaCardProps {
    data: {
        banner?: string | null;
    };
    onChange: (field: string, value: string | null) => void;
}

export const ShopMediaCard: React.FC<ShopMediaCardProps> = ({ data, onChange }) => {
    const pickBanner = async () => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

            if (status !== 'granted') {
                Alert.alert('Permission Denied', 'Please allow access to your media library to upload images.');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: 'images',
                allowsEditing: true,
                aspect: [16, 9],
                quality: 0.8,
            });

            if (!result.canceled) {
                onChange('banner', result.assets[0].uri);
            }
        } catch (error) {
            console.error('Error picking banner:', error);
            Alert.alert('Error', 'Failed to pick banner. Please try again.');
        }
    };

    const removeBanner = () => {
        Alert.alert(
            'Remove Banner',
            'Are you sure you want to remove this banner?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: () => onChange('banner', null)
                }
            ]
        );
    };

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

                <TouchableOpacity
                    style={styles.bannerPreviewContainer}
                    onPress={pickBanner}
                    activeOpacity={0.7}
                >
                    {data.banner ? (
                        <>
                            <Image source={{ uri: data.banner }} style={styles.bannerImage} />
                            <View style={styles.editIconOverlay}>
                                <TouchableOpacity onPress={removeBanner} style={styles.removeButton}>
                                    <Ionicons name="trash" size={16} color="#FFFFFF" />
                                </TouchableOpacity>
                                <Ionicons name="camera" size={20} color="#FFFFFF" />
                            </View>
                        </>
                    ) : (
                        <View style={styles.addBannerPlaceholder}>
                            <Ionicons name="add" size={40} color="#666666" />
                            <Text style={styles.addBannerText}>Add Banner</Text>
                        </View>
                    )}
                </TouchableOpacity>

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
    bannerPreviewContainer: {
        width: 329,
        height: 180,
        backgroundColor: '#EEEEEF',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        marginVertical: 8,
    },
    bannerImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    addBannerPlaceholder: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    addBannerText: {
        fontFamily: 'Inter',
        fontSize: 14,
        color: '#666666',
        marginTop: 8,
    },
    editIconOverlay: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: 8,
        borderTopLeftRadius: 12,
        flexDirection: 'row',
        gap: 8,
        alignItems: 'center',
    },
    removeButton: {
        padding: 2,
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
