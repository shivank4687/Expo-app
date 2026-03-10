import { restApiClient } from '@/services/api/client';
import { formatFileUri, multipartFetch } from '@/services/api/fetchClient';

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
        tracking_photo_url: string | null;
        created_at: string;
    };
    errors?: Record<string, string[]>;
    error?: string;
}

/**
 * Create a shipment for a specific order
 * 
 * NOTE: This function uses `multipartFetch` (fetch fallback) for uploads with images
 * to avoid "Network Error" issues in standalone Android builds.
 */
export const createShipment = async (
    orderId: number,
    data: CreateShipmentRequest
): Promise<CreateShipmentResponse> => {
    const endpoint = `/supplier-app/shipments/create/${orderId}`;

    // CASE 1 — No image: Use Axios
    if (!data.tracking_photo) {
        return await restApiClient.post<CreateShipmentResponse>(
            endpoint,
            { ...(data.track_number ? { track_number: data.track_number } : {}) }
        );
    }

    // CASE 2 — Image present: Use fetch fallback
    const formData = new FormData();

    if (data.track_number) {
        formData.append('track_number', data.track_number);
    }

    formData.append('tracking_photo', {
        uri: formatFileUri(data.tracking_photo.uri),
        type: data.tracking_photo.type || 'image/jpeg',
        name: data.tracking_photo.name || 'tracking.jpg',
    } as any);

    return await multipartFetch<CreateShipmentResponse>(endpoint, formData);
};

export interface CreateSkydropxShipmentRequest {
    consignment_note: string;
    package_type: string;
}

/**
 * Create a Skydropx shipment for a specific order
 */
export const createSkydropxShipment = async (
    orderId: number,
    data: CreateSkydropxShipmentRequest
): Promise<CreateShipmentResponse> => {
    const endpoint = `/supplier-app/shipments/create/skydropx/${orderId}`;
    return await restApiClient.post<CreateShipmentResponse>(endpoint, data);
};

export interface UpdateShipmentStatusResponse {
    success: boolean;
    message: string;
    data?: {
        shipment_id: number;
        status: string;
    };
    errors?: Record<string, string[]>;
    error?: string;
}

/**
 * Update the status of a specific manual shipment
 */
export const updateShipmentStatus = async (
    shipmentId: number,
    status: string
): Promise<UpdateShipmentStatusResponse> => {
    const endpoint = `/supplier-app/shipments/${shipmentId}/status`;
    return await restApiClient.put<UpdateShipmentStatusResponse>(endpoint, { status });
};
