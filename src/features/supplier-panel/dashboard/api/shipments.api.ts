import { restApiClient } from '@/services/api/client';

export interface CreateShipmentRequest {
    track_number?: string;
    tracking_photo?: {
        uri: string;
        type: string;
        name: string;
    };
}

export interface CreateShipmentResponse {
    success: boolean;
    message: string;
    data?: {
        shipment_id: number;
        order_id: number;
        track_number: string | null;
        carrier_title: string;
        status: string;
        created_at: string;
    };
    errors?: Record<string, string[]>;
    error?: string;
}

/**
 * Create a shipment for a specific order
 */
export const createShipment = async (
    orderId: number,
    data: CreateShipmentRequest
): Promise<CreateShipmentResponse> => {
    const endpoint = `/supplier-app/shipments/create/${orderId}`;

    // When no photo is included, prefer JSON payload to avoid multipart issues in some builds/devices.
    if (!data.tracking_photo) {
        const response = await restApiClient.post<CreateShipmentResponse>(
            endpoint,
            {
                ...(data.track_number ? { track_number: data.track_number } : {}),
            }
        );

        return response;
    }

    const formData = new FormData();

    if (data.track_number) {
        formData.append('track_number', data.track_number);
    }

    formData.append('tracking_photo', {
        uri: data.tracking_photo.uri,
        type: data.tracking_photo.type || 'image/jpeg',
        name: data.tracking_photo.name || 'tracking.jpg',
    } as any);

    const response = await restApiClient.post<CreateShipmentResponse>(
        endpoint,
        formData
    );

    return response;
};
