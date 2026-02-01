import { restApiClient } from '@/services/api/client';

export interface SupplierProfile {
    id: number;
    company_name: string;
    url: string;
    company_tag_line: string;
    registerd_in: string;
    designation: string;
    team_size: string;
    certification: string;
    response_time: string;
    shipping_policy: string;
    privacy_policy: string;
    return_policy: string;
    phone: string;
    address1: string;
    address2: string;
    city: string;
    country: string;
    state: string;
    postcode: string;
    company_overview: string;
    logo: string | null;
    banner: string | null;
    profile: string | null;
    twitter?: string;
    facebook?: string;
    youtube?: string;
    instagram?: string;
    skype?: string;
    linked_in?: string;
    pinterest?: string;
    shareable_link?: string;
}

export interface SupplierProfileUpdateData {
    company_name?: string;
    url?: string;
    company_tag_line?: string;
    registerd_in?: string;
    designation?: string;
    team_size?: string;
    certification?: string;
    response_time?: string;
    shipping_policy?: string;
    privacy_policy?: string;
    return_policy?: string;
    phone?: string;
    address1?: string;
    address2?: string;
    city?: string;
    country?: string;
    state?: string;
    postcode?: string;
    company_overview?: string;
    logo?: string | null;
    banner?: string | null;
    profile?: string | null;
    twitter?: string;
    facebook?: string;
    youtube?: string;
    instagram?: string;
    skype?: string;
    linked_in?: string;
    pinterest?: string;
    shareable_link?: string;
}

/**
 * Get supplier profile data
 */
export const getSupplierProfile = async (): Promise<SupplierProfile> => {
    const response = await restApiClient.get<{ data: SupplierProfile }>(
        '/supplier-app/profile'
    );
    return response.data;
};

/**
 * Update supplier profile
 */
export const updateSupplierProfile = async (
    data: SupplierProfileUpdateData
): Promise<SupplierProfile> => {
    const formData = new FormData();

    // Helper function to check if a value is a local file URI
    const isLocalFileUri = (uri: string | null | undefined): boolean => {
        return !!uri && (uri.startsWith('file://') || uri.startsWith('content://'));
    };

    // Append all text fields to FormData
    Object.keys(data).forEach((key) => {
        const value = data[key as keyof SupplierProfileUpdateData];

        // Skip image fields - we'll handle them separately
        if (key === 'logo' || key === 'banner' || key === 'profile') {
            return;
        }

        if (value !== undefined && value !== null) {
            formData.append(key, String(value));
        }
    });

    // Handle banner image
    if (data.banner !== undefined) {
        if (isLocalFileUri(data.banner)) {
            // New image selected - upload it
            const uri = data.banner as string;
            const filename = uri.split('/').pop() || 'banner.jpg';
            const match = /\.(\w+)$/.exec(filename);
            const type = match ? `image/${match[1]}` : 'image/jpeg';

            // Create a file-like object for React Native FormData
            const file = {
                uri,
                type,
                name: filename,
            } as any;

            formData.append('banner[]', file);
        } else if (data.banner === null) {
            // Image removed - send deletion flag
            formData.append('delete_banner', '1');
        }
        // If it's a URL (existing image), don't send anything
    }

    // Handle logo image
    if (data.logo !== undefined) {
        if (isLocalFileUri(data.logo)) {
            const uri = data.logo as string;
            const filename = uri.split('/').pop() || 'logo.jpg';
            const match = /\.(\w+)$/.exec(filename);
            const type = match ? `image/${match[1]}` : 'image/jpeg';

            // Create a file-like object for React Native FormData
            const file = {
                uri,
                type,
                name: filename,
            } as any;

            formData.append('logo[]', file);
        } else if (data.logo === null) {
            formData.append('delete_logo', '1');
        }
    }

    // Handle profile image (kept for backend compatibility, not used in mobile UI)
    if (data.profile !== undefined) {
        if (isLocalFileUri(data.profile)) {
            const uri = data.profile as string;
            const filename = uri.split('/').pop() || 'profile.jpg';
            const match = /\.(\w+)$/.exec(filename);
            const type = match ? `image/${match[1]}` : 'image/jpeg';

            // Create a file-like object for React Native FormData
            const file = {
                uri,
                type,
                name: filename,
            } as any;

            formData.append('profile[]', file);
        } else if (data.profile === null) {
            formData.append('delete_profile', '1');
        }
    }

    // For PUT request via FormData, use POST with _method override
    formData.append('_method', 'PUT');

    // Use POST instead of PUT for FormData (Laravel requirement)
    const response = await restApiClient.post<{ data: SupplierProfile; message: string }>(
        '/supplier-app/profile',
        formData
    );
    return response.data;
};
