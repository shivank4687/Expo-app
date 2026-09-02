import { restApiClient } from '@/services/api/client';
import { formatFileUri, multipartFetch } from '@/services/api/fetchClient';

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
    gallery: string[];
    twitter?: string;
    facebook?: string;
    youtube?: string;
    instagram?: string;
    skype?: string;
    linked_in?: string;
    pinterest?: string;
    shareable_link?: string;
    // Sales Shipping fields
    minimum_order_amount?: number | null;
    free_shipping_threshold?: number | null;
    preparation_time_days?: number | null;
    standard_delivery_days?: number | null;
    automatic_validation_enabled?: boolean;
    special_price_from_wholesale?: boolean;
    wholesale_price_multiplier?: number | null;
    return_policy_days?: number | null;
    custom_orders_enabled?: boolean;
    custom_order_message?: string | null;
    buyer_spend_discounts?: any[];
    holiday_start_date?: string | null;
    holiday_end_date?: string | null;
    discount_special_percentage?: number | null;
    discount_special_max_amount?: number | null;
    discount_special_start_date?: string | null;
    discount_special_end_date?: string | null;
    b2c_free_shipping_enabled?: boolean;
    b2c_free_shipping_threshold?: number | null;
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
    // Sales Shipping fields
    minimum_order_amount?: number | null;
    free_shipping_threshold?: number | null;
    preparation_time_days?: number | null;
    standard_delivery_days?: number | null;
    automatic_validation_enabled?: boolean;
    special_price_from_wholesale?: boolean;
    wholesale_price_multiplier?: number | null;
    return_policy_days?: number | null;
    custom_orders_enabled?: boolean;
    custom_order_message?: string | null;
    buyer_spend_discounts?: any[];
    holiday_start_date?: string | null;
    holiday_end_date?: string | null;
    discount_special_percentage?: number | null;
    discount_special_max_amount?: number | null;
    discount_special_start_date?: string | null;
    discount_special_end_date?: string | null;
    b2c_free_shipping_enabled?: boolean;
    b2c_free_shipping_threshold?: number | null;
    gallery?: string[]; // Array of URIs: local file:// URIs for new uploads, https:// for existing remote items
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
    // Helper function to check if a value is a local file URI
    const isLocalFileUri = (uri: string | null | undefined): boolean => {
        return !!uri && (uri.startsWith('file://') || uri.startsWith('content://'));
    };

    const hasGalleryChange = Array.isArray(data.gallery);

    const hasImageUpload =
        isLocalFileUri(data.banner) ||
        isLocalFileUri(data.logo) ||
        isLocalFileUri(data.profile) ||
        (hasGalleryChange && (data.gallery ?? []).some(isLocalFileUri));

    const hasImageDelete =
        data.banner === null ||
        data.logo === null ||
        data.profile === null;

    const extractProfile = (response: any): SupplierProfile => {
        return response?.data ?? response;
    };

    // Date fields that must be sent as null (not empty string) for backend validation
    const dateFields = ['holiday_start_date', 'holiday_end_date', 'discount_special_start_date', 'discount_special_end_date'];

    // Prefer JSON payload when images are unchanged.
    // This avoids multipart issues seen in some Android release builds.
    if (!hasImageUpload && !hasImageDelete && !hasGalleryChange) {
        const payload: Record<string, any> = {};

        Object.keys(data).forEach((key) => {
            let value = data[key as keyof SupplierProfileUpdateData];
            // Normalize empty/null-string dates to actual null so Laravel's
            // nullable|date validation passes (request()->merge() doesn't
            // affect JSON request data in Laravel)
            if (dateFields.includes(key) && (value === '' || value === 'null')) {
                value = null;
            }
            if (value !== undefined) {
                payload[key] = value;
            }
        });

        const response = await restApiClient.put<any>(
            '/supplier-app/profile',
            payload
        );
        return extractProfile(response);
    }

    const formData = new FormData();

    // Append all text fields to FormData
    Object.keys(data).forEach((key) => {
        const value = data[key as keyof SupplierProfileUpdateData];

        // Skip image fields and gallery - we'll handle them separately
        if (key === 'logo' || key === 'banner' || key === 'profile' || key === 'gallery') {
            return;
        }

        if (value !== undefined && value !== null) {
            // Serialize arrays and objects as JSON, otherwise convert to string
            const serializedValue = typeof value === 'object'
                ? JSON.stringify(value)
                : String(value);
            formData.append(key, serializedValue);
        } else if (value === null && dateFields.includes(key)) {
            // Send empty string for null date fields so backend can clear them
            formData.append(key, '');
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
                uri: formatFileUri(uri),
                type,
                name: filename,
            } as any;

            formData.append('banner[]', file);
        } else if (data.banner === null) {
            // Image removed - send deletion flag
            formData.append('delete_banner', '1');
        }
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
                uri: formatFileUri(uri),
                type,
                name: filename,
            } as any;

            formData.append('logo[]', file);
        } else if (data.logo === null) {
            formData.append('delete_logo', '1');
        }
    }

    // Handle profile image
    if (data.profile !== undefined) {
        if (isLocalFileUri(data.profile)) {
            const uri = data.profile as string;
            const filename = uri.split('/').pop() || 'profile.jpg';
            const match = /\.(\w+)$/.exec(filename);
            const type = match ? `image/${match[1]}` : 'image/jpeg';

            // Create a file-like object for React Native FormData
            const file = {
                uri: formatFileUri(uri),
                type,
                name: filename,
            } as any;

            formData.append('profile[]', file);
        } else if (data.profile === null) {
            formData.append('delete_profile', '1');
        }
    }

    // Handle gallery
    if (hasGalleryChange && Array.isArray(data.gallery)) {
        const videoExtensions = ['mp4', 'mov', 'avi', 'mkv', 'webm', 'm4v'];
        const isVideoUri = (uri: string) => {
            const ext = uri.split('.').pop()?.toLowerCase() ?? '';
            return videoExtensions.includes(ext);
        };

        const remoteUrls: string[] = [];
        const localUris: string[] = [];

        data.gallery.forEach((uri) => {
            if (isLocalFileUri(uri)) {
                localUris.push(uri);
            } else if (uri) {
                remoteUrls.push(uri);
            }
        });

        // Tell backend which existing files to retain
        formData.append('keep_gallery_images', JSON.stringify(remoteUrls));

        // Upload new local files
        localUris.forEach((uri, index) => {
            const filename = uri.split('/').pop() || `gallery_${index}`;
            const ext = filename.split('.').pop()?.toLowerCase() ?? 'jpg';
            const isVideo = isVideoUri(uri);
            const mimeType = isVideo ? `video/${ext === 'mov' ? 'quicktime' : ext}` : `image/${ext === 'jpg' ? 'jpeg' : ext}`;

            const file = {
                uri: formatFileUri(uri),
                type: mimeType,
                name: filename,
            } as any;

            formData.append('gallery[]', file);
        });
    }

    // For PUT request via FormData, use POST with _method override
    formData.append('_method', 'PUT');

    // Use POST instead of PUT for FormData (Laravel requirement) via multipartFetch
    const response = await multipartFetch<{ data: SupplierProfile; message: string }>(
        '/supplier-app/profile',
        formData
    );
    return extractProfile(response);
};
