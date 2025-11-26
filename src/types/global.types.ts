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
}

export interface ApiError {
    message: string;
    errors?: Record<string, string[]>;
    status?: number;
}
