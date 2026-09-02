import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    TouchableOpacity,
    Alert,
    Platform,
    Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useToast } from '@/shared/components/Toast/ToastContext';
import { ImageCropModal } from '@/shared/components';
import { requestMediaLibraryPermission, pickSingleImage, getActualFileSize } from '@/shared/utils/imageUtils';
import * as ImagePicker from 'expo-image-picker';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GALLERY_COLS = 4;
const GALLERY_SLOT_SIZE = Math.floor((SCREEN_WIDTH - 48 - (GALLERY_COLS - 1) * 8) / GALLERY_COLS);
const VIDEO_EXTENSIONS = ['mp4', 'mov', 'avi', 'mkv', 'webm', 'm4v'];
const MAX_GALLERY = 8;
const MAX_VIDEOS = 2;

const isVideoUri = (uri: string): boolean => {
    const ext = uri.split('.').pop()?.toLowerCase() ?? '';
    return VIDEO_EXTENSIONS.includes(ext);
};

interface ShopMediaCardProps {
    data: {
        banner?: string | null;
        gallery?: string[];
    };
    onChange: (field: string, value: any) => void;
}

export const ShopMediaCard: React.FC<ShopMediaCardProps> = ({ data, onChange }) => {
    const { showToast } = useToast();
    const MAX_IMAGE_SIZE = 1.5 * 1024 * 1024; // 1.5 MB
    const [cropImageUri, setCropImageUri] = useState<string | null>(null);

    const gallery: string[] = data.gallery ?? [];
    const videoCount = gallery.filter(isVideoUri).length;

    // ── Banner ───────────────────────────────────────────────────────────────

    const pickBanner = async () => {
        try {
            const hasPermission = await requestMediaLibraryPermission();
            if (!hasPermission) {
                Alert.alert('Permission Denied', 'Please allow access to your media library.');
                return;
            }

            const asset = await pickSingleImage([16, 9]);
            if (asset) {
                if (Platform.OS === 'android') {
                    setCropImageUri(asset.uri);
                } else {
                    if ((asset.fileSize ?? 0) > MAX_IMAGE_SIZE) {
                        showToast({ message: 'Image size exceeds 1.5 MB limit.', type: 'warning' });
                        return;
                    }
                    onChange('banner', asset.uri);
                }
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to pick banner. Please try again.');
        }
    };

    const removeBanner = () => {
        Alert.alert('Remove Banner', 'Are you sure you want to remove this banner?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Remove', style: 'destructive', onPress: () => onChange('banner', null) },
        ]);
    };

    // ── Gallery ──────────────────────────────────────────────────────────────

    const pickGalleryMedia = async () => {
        if (gallery.length >= MAX_GALLERY) {
            showToast({ message: `Gallery is full (max ${MAX_GALLERY} items).`, type: 'warning' });
            return;
        }

        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Denied', 'Please allow access to your media library.');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images', 'videos'],
                allowsMultipleSelection: false,
                quality: 0.85,
                videoMaxDuration: 20,
            });

            if (result.canceled || !result.assets || result.assets.length === 0) return;

            const asset = result.assets[0];
            const uri = asset.uri;
            const isVideo = asset.type === 'video' || isVideoUri(uri);

            if (isVideo && videoCount >= MAX_VIDEOS) {
                showToast({
                    message: `Maximum ${MAX_VIDEOS} videos allowed in gallery.`,
                    type: 'warning',
                });
                return;
            }

            // File size check for images (videos skip — they can be larger)
            if (!isVideo) {
                const size = asset.fileSize ?? 0;
                if (size > MAX_IMAGE_SIZE && size > 0) {
                    showToast({ message: 'Image size exceeds 1.5 MB limit.', type: 'warning' });
                    return;
                }
            }

            const updated = [...gallery, uri];
            onChange('gallery', updated);
        } catch (error) {
            Alert.alert('Error', 'Failed to pick media. Please try again.');
        }
    };

    const removeGalleryItem = (index: number) => {
        Alert.alert('Remove Media', 'Remove this item from the gallery?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Remove',
                style: 'destructive',
                onPress: () => {
                    const updated = gallery.filter((_, i) => i !== index);
                    onChange('gallery', updated);
                },
            },
        ]);
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Photos, Banner, and Videos</Text>

            {/* ── Main Banner ─────────────────────────────────────────────── */}
            <View style={styles.sectionContainer}>
                <View style={styles.headerRow}>
                    <Text style={styles.label}>Main Banner</Text>
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
                    Recommended: Horizontal photo (workshop, stand, artisan at work). 16:9 ratio.
                </Text>
            </View>

            {/* ── Gallery ─────────────────────────────────────────────────── */}
            <View style={styles.sectionContainer}>
                <View style={styles.headerRow}>
                    <Text style={styles.label}>Gallery</Text>
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>
                            {gallery.length}/{MAX_GALLERY}
                        </Text>
                    </View>
                </View>

                <Text style={styles.description}>
                    Up to {MAX_GALLERY} items (images + videos). Max {MAX_VIDEOS} videos, 20 s each.
                </Text>

                <View style={styles.photoGrid}>
                    {gallery.map((uri, index) => {
                        const isVideo = isVideoUri(uri);
                        return (
                            <View key={`gallery-${index}-${uri.slice(-8)}`} style={styles.photoSlot}>
                                <Image
                                    source={{ uri }}
                                    style={styles.photoThumb}
                                    resizeMode="cover"
                                />
                                {isVideo && (
                                    <View style={styles.videoOverlay}>
                                        <Ionicons name="play-circle" size={22} color="#FFFFFF" />
                                    </View>
                                )}
                                <TouchableOpacity
                                    style={styles.photoRemoveBtn}
                                    onPress={() => removeGalleryItem(index)}
                                    hitSlop={{ top: 4, left: 4, bottom: 4, right: 4 }}
                                >
                                    <Ionicons name="close-circle" size={18} color="#FFFFFF" />
                                </TouchableOpacity>
                            </View>
                        );
                    })}

                    {gallery.length < MAX_GALLERY && (
                        <TouchableOpacity
                            style={[styles.photoSlot, styles.addSlot]}
                            onPress={pickGalleryMedia}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="add" size={28} color="#666666" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* ── Banner crop modal ────────────────────────────────────────── */}
            <ImageCropModal
                visible={cropImageUri !== null}
                imageUri={cropImageUri || ''}
                aspectRatio={16 / 9}
                targetWidth={1600}
                targetHeight={900}
                onCancel={() => setCropImageUri(null)}
                onSave={async (croppedUri) => {
                    setCropImageUri(null);
                    const size = await getActualFileSize(croppedUri);
                    if (size > MAX_IMAGE_SIZE) {
                        showToast({ message: 'Image size exceeds 1.5 MB limit.', type: 'warning' });
                        return;
                    }
                    onChange('banner', croppedUri);
                }}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'column',
        alignItems: 'flex-start',
        padding: 0,
        gap: 16,
        alignSelf: 'stretch',
    },
    title: {
        width: '100%',
        fontFamily: 'Inter',
        fontWeight: '500',
        fontSize: 20,
        lineHeight: 24,
        color: '#000000',
    },
    sectionContainer: {
        flexDirection: 'column',
        alignItems: 'flex-start',
        padding: 0,
        gap: 8,
        width: '100%',
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
    },
    label: {
        fontFamily: 'Inter',
        fontWeight: '500',
        fontSize: 16,
        lineHeight: 19,
        color: '#000000',
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
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
    description: {
        width: '100%',
        fontFamily: 'Inter',
        fontWeight: '400',
        fontSize: 14,
        lineHeight: 20,
        color: '#666666',
    },
    // Banner
    bannerPreviewContainer: {
        width: '100%',
        height: 180,
        backgroundColor: '#EEEEEF',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        marginVertical: 4,
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
    // Gallery grid
    photoGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        width: '100%',
        marginTop: 4,
    },
    photoSlot: {
        width: GALLERY_SLOT_SIZE,
        height: GALLERY_SLOT_SIZE,
        borderRadius: 8,
        overflow: 'hidden',
        backgroundColor: '#EEEEEF',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    photoThumb: {
        width: '100%',
        height: '100%',
    },
    videoOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.25)',
    },
    photoRemoveBtn: {
        position: 'absolute',
        top: 3,
        right: 3,
        backgroundColor: 'rgba(0,0,0,0.55)',
        borderRadius: 10,
    },
    addSlot: {
        borderStyle: 'dashed',
        borderWidth: 1.5,
        borderColor: '#AAAAAA',
        backgroundColor: '#F8F8F8',
    },
});
