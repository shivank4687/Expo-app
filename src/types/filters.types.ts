export interface FilterState {
    price: string | null; // "min,max" format
    attributes: Record<string, number[]>; // { color: [1,2], brand: [3] }
}

export interface SortOption {
    label: string;
    value: string;
}

export interface FilterAttribute {
    code: string;
    name: string;
    type: 'price' | 'select' | 'multiselect';
    options: FilterOption[];
}

export interface FilterOption {
    id: number;
    name: string;
    count?: number; // Product count with this option
}

export interface FilterResponse {
    data: FilterAttribute[];
}

export interface MaxPriceResponse {
    data: {
        max_price: number;
    };
}
