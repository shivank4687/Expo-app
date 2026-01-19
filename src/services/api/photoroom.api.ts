import { restApiClient } from './client';
import * as FileSystem from 'expo-file-system/legacy';

export interface PhotoRoomOptions {
    background?: 'transparent' | string; // hex color or 'transparent'
    padding?: number; // 0.0 to 1.0
    format?: 'png' | 'jpg' | 'webp';
    shadow?: 'soft' | 'hard' | 'none';
    align?: 'center' | 'top' | 'bottom' | 'left' | 'right';
    scale?: string;
    channels?: 'rgba' | 'rgb';
}

export interface PhotoRoomResponse {
    success: boolean;
    processed_image?: string;
    error?: string;
}

/**
 * Convert base64 image to local file URI
 */
export const base64ToFileUri = async (base64: string, filename: string): Promise<string> => {
    const fileUri = (FileSystem.documentDirectory || FileSystem.cacheDirectory || '') + filename;
    await FileSystem.writeAsStringAsync(fileUri, base64, {
        encoding: FileSystem.EncodingType.Base64,
    });
    return fileUri;
};

/**
 * Convert file URI to base64 string
 */
export const fileUriToBase64 = async (fileUri: string): Promise<string> => {
    const base64 = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.Base64,
    });
    return base64;
};

/**
 * PhotoRoom API client
 */
export const photoRoomApi = {
    /**
     * Process image with PhotoRoom API
     */
    processImage: async (imageUri: string, options: PhotoRoomOptions): Promise<PhotoRoomResponse> => {
        try {
            // Convert image URI to base64
            const base64Image = await fileUriToBase64(imageUri);

            // Make API request to supplier-specific endpoint
            const response = await restApiClient.post<PhotoRoomResponse>('/supplier/photoroom/process-image', {
                image: base64Image,
                options,
            });

            return response;
        } catch (error: any) {
            console.error('PhotoRoom API Error:', error);
            return {
                success: false,
                error: error.response?.data?.error || error.message || 'Failed to process image',
            };
        }
    },
};
