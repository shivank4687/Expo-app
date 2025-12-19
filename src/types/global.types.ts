// Global TypeScript Types

export interface ApiResponse<T = any> {
    data: T;
    message?: string;
    success: boolean;
}

export interface PaginatedResponse<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    meta?: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number;
        to: number;
    };
    links?: {
        first: string;
        last: string;
        prev: string | null;
        next: string | null;
    };
}

export interface ApiError {
    message: string;
    errors?: Record<string, string[]>;
    status?: number;
}
