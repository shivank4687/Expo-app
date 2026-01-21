import { restApiClient } from './client';
import * as FileSystem from 'expo-file-system/legacy';

export interface PhotoRoomOptions {
    // Background options
    background?: 'transparent' | string; // hex color or 'transparent'
    'background.prompt'?: string; // AI background generation
    'background.model'?: string; // AI model (e.g., 'studio')

    // Positioning and spacing
    padding?: number; // 0.0 to 1.0
    paddingLeft?: number;
    paddingRight?: number;
    paddingTop?: number;
    paddingBottom?: number;
    margin?: number;
    marginLeft?: number;
    marginRight?: number;
    marginTop?: number;
    marginBottom?: number;

    // Output options
    format?: 'png' | 'jpg' | 'webp';
    outputSize?: string; // 'auto' | '800x800' | '1500x1500' | '3000x3000' | 'originalImage' | 'croppedSubject' or any WxH format
    channels?: 'rgba' | 'rgb';

    // Adjustments
    shadow?: 'soft' | 'hard' | 'none' | 'ai.soft' | 'ai.hard';
    align?: 'center' | 'top' | 'bottom' | 'left' | 'right';
    horizontalAlignment?: 'left' | 'center' | 'right';
    verticalAlignment?: 'top' | 'center' | 'bottom';

    // Advanced options
    scale?: string;
    scaling?: 'fit' | 'fill';
    crop?: boolean;
    photoFix?: boolean;
    referenceBox?: 'originalImage' | 'subjectBox';
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
    // Check if it's a remote URL (http/https)
    if (fileUri.startsWith('http://') || fileUri.startsWith('https://')) {
        // Download the file first
        const filename = `temp_${Date.now()}.jpg`;
        const localUri = (FileSystem.documentDirectory || FileSystem.cacheDirectory || '') + filename;

        const downloadResult = await FileSystem.downloadAsync(fileUri, localUri);

        // Read the downloaded file as base64
        const base64 = await FileSystem.readAsStringAsync(downloadResult.uri, {
            encoding: FileSystem.EncodingType.Base64,
        });

        // Clean up the temporary file
        try {
            await FileSystem.deleteAsync(downloadResult.uri, { idempotent: true });
        } catch (error) {
            console.warn('Failed to delete temp file:', error);
        }

        return base64;
    }

    // For local files, read directly
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
