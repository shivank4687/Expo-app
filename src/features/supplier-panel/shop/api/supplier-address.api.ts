import { restApiClient } from '@/services/api/client';

export interface SupplierAddress {
    phone: string;
    address1: string;
    address2?: string | null;
    city: string;
    country: string;
    state: string;
    postcode: string;
}

export interface SupplierAddressUpdateData {
    phone: string;
    address1: string;
    address2?: string | null | undefined;
    city: string;
    country: string;
    state: string;
    postcode: string;
}

const SUPPLIER_ADDRESS_ENDPOINT = '/supplier-app/profile/address';

export const getSupplierAddress = async (): Promise<SupplierAddress> => {
    const response = await restApiClient.get<{ data: SupplierAddress }>(
        SUPPLIER_ADDRESS_ENDPOINT
    );

    return response.data;
};

export const updateSupplierAddress = async (
    data: SupplierAddressUpdateData
): Promise<SupplierAddress> => {
    const response = await restApiClient.put<{ data: SupplierAddress }>(
        SUPPLIER_ADDRESS_ENDPOINT,
        data
    );

    return response.data;
};
