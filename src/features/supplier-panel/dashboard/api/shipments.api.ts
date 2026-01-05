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
    const formData = new FormData();

    // Add tracking number if provided
    if (data.track_number) {
        formData.append('track_number', data.track_number);
    }

    // Add tracking photo if provided
    if (data.tracking_photo) {
        formData.append('tracking_photo', {
            uri: data.tracking_photo.uri,
            type: data.tracking_photo.type,
            name: data.tracking_photo.name,
        } as any);
    }

    const response = await restApiClient.post<CreateShipmentResponse>(
        `/supplier-app/shipments/create/${orderId}`,
        formData,
        {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        }
    );

    return response;
};
