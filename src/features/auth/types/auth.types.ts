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
    email_or_phone: string;
    password: string;
    device_name?: string;
    remember?: boolean;
    phone_country_id?: string;
}

export interface SignupRequest {
    first_name: string;
    last_name: string;
    email?: string;
    phone?: string;
    phone_country_id?: string;
    dial_code?: string;
    password: string;
    password_confirmation: string;
    is_subscribed?: boolean;
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

export interface OtpVerificationRequest {
    verification_token: string;
    otp: string;
    type?: 'customer' | 'supplier';
    device_name: string;
}

export interface OtpVerificationResponse extends AuthResponse {
    // Same as AuthResponse (user + token)
}

export interface ResendOtpRequest {
    verification_token: string;
    type?: 'customer' | 'supplier';
}

export interface ResendOtpResponse {
    message: string;
    otp_expiry: string;
    resend_available_at: string;
}

export interface SignupResponse {
    // OTP verification required
    requires_otp_verification?: boolean;
    verification_token?: string;
    type?: 'customer' | 'supplier';
    phone?: string;
    otp_expiry?: string;
    resend_available_at?: string;
    message?: string;
    // OR direct registration (no OTP)
    data?: User;
    token?: string;
    user?: User;
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
