// Authentication Types

export interface User {
    id: number;
    name: string;
    email: string;
    phone?: string;
    avatar?: string;
    created_at?: string;
}

export interface LoginRequest {
    email: string;
    password: string;
    device_name?: string;
    remember?: boolean;
}

export interface SignupRequest {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
}

export interface AuthResponse {
    token: string;
    user: User;
    expires_in?: number;
}

export interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (credentials: LoginRequest) => Promise<void>;
    signup: (data: SignupRequest) => Promise<void>;
    logout: () => Promise<void>;
    updateUser: (user: User) => void;
}
