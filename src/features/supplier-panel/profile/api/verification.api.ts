import { restApiClient } from '@/services/api/client';
import { API_ENDPOINTS } from '@/config/constants';
import { formatFileUri, multipartFetch } from '@/services/api/fetchClient';

export interface SupplierVerificationStatus {
    email: string;
    is_verified: boolean;
    identity_verification_status: string;
    identity_verification_notes: string | null;
    identity_document_exists: boolean;
    identity_video_exists: boolean;
    identity_document_url: string | null;
    identity_video_url: string | null;
    is_identity_verified: boolean;
    is_identity_pending: boolean;
    is_identity_rejected: boolean;
    identity_verified_at: string | null;
    identity_verified_by: string | null;
}

interface FilePayload {
    uri: string;
    name: string;
    mimeType?: string;
}

const getMimeType = (name: string, fallback: string): string => {
    const extension = name.split('.').pop()?.toLowerCase();

    switch (extension) {
        case 'pdf':
            return 'application/pdf';
        case 'jpg':
        case 'jpeg':
            return 'image/jpeg';
        case 'png':
            return 'image/png';
        case 'mp4':
            return 'video/mp4';
        case 'webm':
            return 'video/webm';
        default:
            return fallback;
    }
};

const appendFile = (formData: FormData, fieldName: string, file: FilePayload) => {
    const mimeType = file.mimeType || getMimeType(file.name, 'application/octet-stream');

    formData.append(fieldName, {
        uri: formatFileUri(file.uri),
        name: file.name,
        type: mimeType,
    } as any);
};

export const supplierVerificationApi = {
    async getStatus(): Promise<SupplierVerificationStatus> {
        const response = await restApiClient.get<{ data: SupplierVerificationStatus }>(
            API_ENDPOINTS.SUPPLIER_VERIFICATION_STATUS
        );

        return response.data;
    },

    async resendVerificationEmail(): Promise<{ message: string }> {
        return restApiClient.post<{ message: string }>(
            API_ENDPOINTS.SUPPLIER_VERIFICATION_RESEND
        );
    },

    async updateIdentityVerification(payload: {
        document: FilePayload;
        video: FilePayload;
    }): Promise<any> {
        const formData = new FormData();
        appendFile(formData, 'identity_document', payload.document);
        appendFile(formData, 'identity_video', payload.video);

        return multipartFetch<any>(
            API_ENDPOINTS.SUPPLIER_VERIFICATION_IDENTITY,
            formData
        );
    },
};

export default supplierVerificationApi;
