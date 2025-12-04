// Authentication Types

export interface User {
    id: number;
    name: string;
    first_name?: string;
    last_name?: string;
    email: string;
    phone?: string;
    avatar?: string;
    gender?: string;
    date_of_birth?: string;
    subscribed_to_news_letter?: boolean;
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

export interface UpdateProfileRequest {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    gender: 'Male' | 'Female' | 'Other';
    date_of_birth?: string;
    subscribed_to_news_letter?: boolean;
    image?: {
        uri: string;
        name: string;
        type: string;
    };
}

export interface NewsletterSubscriptionRequest {
    email: string;
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
