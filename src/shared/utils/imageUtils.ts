import { config } from '@/config/env';

/**
 * Bundled placeholder image (same as used in Bagisto web application)
 * This is bundled with the app, so it works offline
 */
export const PLACEHOLDER_IMAGE = require('../../../assets/images/small-product-placeholder.webp');

/**
 * Convert relative image URL to absolute URL
 * @param imageUrl - The image URL (can be relative or absolute)
 * @returns Absolute image URL, bundled placeholder, or the required image object
 */
export const getAbsoluteImageUrl = (imageUrl?: string): any => {
    // If no image provided or empty string, use bundled placeholder
    if (!imageUrl || imageUrl.trim() === '') {
        return PLACEHOLDER_IMAGE;
    }

    // If already absolute URL (starts with http:// or https://), return as is
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
        return imageUrl;
    }

    // If relative URL, prepend base URL
    // Remove leading slash if present to avoid double slashes
    const cleanPath = imageUrl.startsWith('/') ? imageUrl.slice(1) : imageUrl;
    
    return `${config.baseUrl}/${cleanPath}`;
};

/**
 * Convert an array of image objects with relative URLs to absolute URLs
 */
export const normalizeImageUrls = <T extends { image?: string }>(images: T[]): any[] => {
    return images.map(img => ({
        ...img,
        image: getAbsoluteImageUrl(img.image),
    }));
};

import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

/**
 * Request media library permissions and return status.
 */
export const requestMediaLibraryPermission = async (): Promise<boolean> => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    return status === 'granted';
};

/**
 * Request camera permissions and return status.
 */
export const requestCameraPermission = async (): Promise<boolean> => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    return status === 'granted';
};

/**
 * Asynchronously query the actual disk size of a local asset file.
 */
export const getActualFileSize = async (uri: string): Promise<number> => {
    try {
        const fileInfo = await FileSystem.getInfoAsync(uri);
        return fileInfo.exists ? fileInfo.size : 0;
    } catch (err) {
        console.error('Failed to get actual file size:', err);
        return 0;
    }
};

/**
 * Launch standard single image library picker with OS-specific crop configuration.
 */
export const pickSingleImage = async (aspect: [number, number]): Promise<ImagePicker.ImagePickerAsset | null> => {
    const isAndroid = Platform.OS === 'android';
    const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: !isAndroid, // iOS native crop
        aspect: aspect,
        quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
        return result.assets[0];
    }
    return null;
};

