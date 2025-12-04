import { restApiClient } from './client';
import { API_ENDPOINTS } from '@/config/constants';
import { LoginRequest, SignupRequest, AuthResponse, UpdateProfileRequest, NewsletterSubscriptionRequest, User } from '@/features/auth/types/auth.types';

/**
 * Authentication API Service
 * Uses REST API v1 endpoints
 */

export const authApi = {
    /**
     * Login user
     */
    async login(credentials: LoginRequest): Promise<AuthResponse> {
        return restApiClient.post<AuthResponse>(API_ENDPOINTS.LOGIN, {
            ...credentials,
            device_name: credentials.device_name || 'mobile_app',
        });
    },

    /**
     * Register new user
     */
    async register(data: SignupRequest): Promise<AuthResponse> {
        return restApiClient.post<AuthResponse>(API_ENDPOINTS.REGISTER, data);
    },

    /**
     * Logout user
     */
    async logout(): Promise<void> {
        return restApiClient.post(API_ENDPOINTS.LOGOUT);
    },

    /**
     * Refresh authentication token
     */
    async refreshToken(refreshToken: string): Promise<AuthResponse> {
        return restApiClient.post<AuthResponse>(API_ENDPOINTS.REFRESH_TOKEN, {
            refresh_token: refreshToken,
        });
    },

    /**
     * Update user profile
     */
    async updateProfile(data: UpdateProfileRequest): Promise<{ data: User; message: string }> {
        // If image is present, use FormData
        if (data.image) {
            const formData = new FormData();
            
            // Add all fields to FormData
            formData.append('first_name', data.first_name);
            formData.append('last_name', data.last_name);
            formData.append('email', data.email);
            formData.append('phone', data.phone);
            formData.append('gender', data.gender);
            
            if (data.date_of_birth) {
                formData.append('date_of_birth', data.date_of_birth);
            }
            
            if (data.subscribed_to_news_letter !== undefined) {
                formData.append('subscribed_to_news_letter', data.subscribed_to_news_letter ? '1' : '0');
            }
            
            // Add image file
            const imageFile = {
                uri: data.image.uri,
                name: data.image.name,
                type: data.image.type,
            } as any;
            
            formData.append('image[]', imageFile);
            
            // For PUT request via FormData, we need to use POST with _method override
            formData.append('_method', 'PUT');
            
            return restApiClient.post(API_ENDPOINTS.UPDATE_PROFILE, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
        }
        
        // Regular JSON request if no image
        // Remove image field to prevent it from being sent as undefined
        const { image, ...dataWithoutImage } = data;
        return restApiClient.put(API_ENDPOINTS.UPDATE_PROFILE, dataWithoutImage);
    },

    /**
     * Subscribe to newsletter
     */
    async subscribeNewsletter(data: NewsletterSubscriptionRequest): Promise<{ message: string }> {
        return restApiClient.post(API_ENDPOINTS.NEWSLETTER_SUBSCRIPTION, data);
    },
};

export default authApi;
