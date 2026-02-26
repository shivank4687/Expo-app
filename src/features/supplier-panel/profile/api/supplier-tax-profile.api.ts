import { restApiClient } from '@/services/api/client';

export interface SupplierTaxProfile {
    business_type: string;
    tax_mode: boolean;
    tax_id: string;
    tax_percentage: number;
    fiscal_regime: string;
    phone?: string | null;
    address?: string | null;
    city?: string | null;
    state?: string | null;
    country?: string | null;
    postcode?: string | null;
}

export type SupplierTaxProfilePayload = Pick<
    SupplierTaxProfile,
    'business_type' | 'tax_mode' | 'tax_id' | 'tax_percentage' | 'fiscal_regime'
> & {
    phone?: string | null;
    address?: string | null;
    city?: string | null;
    state?: string | null;
    country?: string | null;
    postcode?: string | null;
};

const TAX_PROFILE_ENDPOINT = '/supplier-app/tax-profile';

export const getSupplierTaxProfile = async (): Promise<SupplierTaxProfile> => {
    const response = await restApiClient.get<{ data: SupplierTaxProfile }>(
        TAX_PROFILE_ENDPOINT
    );

    return response.data;
};

export const updateSupplierTaxProfile = async (
    data: SupplierTaxProfilePayload
): Promise<SupplierTaxProfile> => {
    const response = await restApiClient.put<{ data: SupplierTaxProfile }>(
        TAX_PROFILE_ENDPOINT,
        data
    );

    return response.data;
};
