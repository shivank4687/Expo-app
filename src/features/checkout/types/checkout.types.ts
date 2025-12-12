/**
 * Checkout Types
 * Type definitions for checkout flow
 */

import { CartAddress } from '@/features/cart/types/cart.types';

export type CheckoutStep = 'address' | 'shipping' | 'payment' | 'review';

export interface SupplierBreakdown {
    store_name: string;
    formatted_price: string;
    base_amount: number;
}

export interface ShippingRate {
    id?: number;
    carrier: string;
    carrier_title: string;
    method: string;
    method_title: string;
    method_description?: string;
    price: number;
    base_price: number;
    formatted_price: string;
    base_formatted_price: string;
    supplier_breakdown?: SupplierBreakdown[];
}

export interface ShippingMethod {
    carrier_title: string;
    rates: ShippingRate[];
}

export interface PaymentMethod {
    method: string;
    method_title: string;
    description?: string;
    sort?: number;
}

export interface CheckoutAddress extends CartAddress {
    use_for_shipping?: boolean;
    save_as_address?: boolean;
}

export interface SaveAddressPayload {
    billing: CheckoutAddress;
    shipping?: CheckoutAddress;
}

export interface SaveShippingMethodPayload {
    shipping_method: string;
}

export interface SavePaymentMethodPayload {
    payment: {
        method: string;
        [key: string]: any;
    };
}

export interface CheckoutState {
    currentStep: CheckoutStep;
    completedSteps: CheckoutStep[];
    addresses: {
        billing: CheckoutAddress | null;
        shipping: CheckoutAddress | null;
        sameAsBilling: boolean;
    };
    shippingMethods: Record<string, ShippingMethod> | null;
    selectedShippingMethod: string | null;
    paymentMethods: PaymentMethod[] | null;
    selectedPaymentMethod: string | null;
}

