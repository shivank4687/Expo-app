import { SortOption } from '@/types/filters.types';

export const SORT_OPTIONS: SortOption[] = [
    { label: 'Price: Low to High', value: 'price-asc' },
    { label: 'Price: High to Low', value: 'price-desc' },
    { label: 'Name: A to Z', value: 'name-asc' },
    { label: 'Name: Z to A', value: 'name-desc' },
    { label: 'Newest First', value: 'created_at-desc' },
    { label: 'Oldest First', value: 'created_at-asc' },
];
