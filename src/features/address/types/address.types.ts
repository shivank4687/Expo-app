// Address Types

export interface Address {
    id: number;
    customer_id: number;
    company_name?: string;
    first_name: string;
    last_name: string;
    address1: string[] | string;
    address?: string[]; // API returns 'address' field instead of 'address1'
    address2?: string;
    country: string;
    country_name?: string;
    state: string;
    city: string;
    postcode: string;
    phone: string;
    vat_id?: string;
    email?: string;
    default_address?: boolean;
    is_default?: boolean; // API returns 'is_default' field
    additional?: Record<string, any>;
    created_at?: string;
    updated_at?: string;
}

export interface AddressFormData {
    company_name?: string;
    first_name: string;
    last_name: string;
    email?: string;
    address1: string[];
    address2?: string;
    country: string;
    state: string;
    city: string;
    postcode: string;
    phone: string;
    vat_id?: string;
    default_address?: boolean;
}

export interface Country {
    id: string;
    code: string;
    name: string;
}

export interface State {
    id: string;
    code: string;
    name: string;
    country_code: string;
}

