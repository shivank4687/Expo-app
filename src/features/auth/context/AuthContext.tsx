import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { authApi } from '@/services/api/auth.api';
import { secureStorage } from '@/services/storage/secureStorage';
import { STORAGE_KEYS } from '@/config/constants';
import {
    User,
    LoginRequest,
    SignupRequest,
    AuthContextType,
    AuthResponse,
} from '../types/auth.types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Check for existing auth on mount
    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const token = await secureStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
            const userData = await secureStorage.getItem(STORAGE_KEYS.USER_DATA);

            if (token && userData) {
                setUser(JSON.parse(userData));
            }
        } catch (error) {
            console.error('Error checking auth:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (credentials: LoginRequest) => {
        try {
            const response: AuthResponse = await authApi.login(credentials);

            // Store token and user data
            await secureStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, response.token);
            await secureStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(response.user));

            setUser(response.user);
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    };

    const signup = async (data: SignupRequest) => {
        try {
            const response: AuthResponse = await authApi.register(data);

            // Store token and user data
            await secureStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, response.token);
            await secureStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(response.user));

            setUser(response.user);
        } catch (error) {
            console.error('Signup error:', error);
            throw error;
        }
    };

    const logout = async () => {
        try {
            await authApi.logout();
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            // Clear local data regardless of API call success
            await secureStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
            await secureStorage.removeItem(STORAGE_KEYS.USER_DATA);
            setUser(null);
        }
    };

    const updateUser = (updatedUser: User) => {
        setUser(updatedUser);
        secureStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(updatedUser));
    };

    const value: AuthContextType = {
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        signup,
        logout,
        updateUser,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export default AuthContext;
