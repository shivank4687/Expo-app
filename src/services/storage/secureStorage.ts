import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * Secure Storage Service
 * Uses expo-secure-store for secure storage on native platforms
 * Falls back to AsyncStorage for web (if needed)
 */

export const secureStorage = {
    /**
     * Save a key-value pair securely
     */
    async setItem(key: string, value: string): Promise<void> {
        try {
            if (Platform.OS === 'web') {
                // For web, use localStorage (not secure, but functional)
                localStorage.setItem(key, value);
            } else {
                await SecureStore.setItemAsync(key, value);
            }
        } catch (error) {
            console.error(`Error saving ${key}:`, error);
            throw error;
        }
    },

    /**
     * Get a value by key
     */
    async getItem(key: string): Promise<string | null> {
        try {
            if (Platform.OS === 'web') {
                return localStorage.getItem(key);
            } else {
                return await SecureStore.getItemAsync(key);
            }
        } catch (error) {
            console.error(`Error getting ${key}:`, error);
            return null;
        }
    },

    /**
     * Remove a key-value pair
     */
    async removeItem(key: string): Promise<void> {
        try {
            if (Platform.OS === 'web') {
                localStorage.removeItem(key);
            } else {
                await SecureStore.deleteItemAsync(key);
            }
        } catch (error) {
            console.error(`Error removing ${key}:`, error);
            throw error;
        }
    },

    /**
     * Clear all stored items
     */
    async clear(): Promise<void> {
        try {
            if (Platform.OS === 'web') {
                localStorage.clear();
            } else {
                // Note: SecureStore doesn't have a clear all method
                // You'll need to track keys and delete them individually
                console.warn('SecureStore clear not fully implemented');
            }
        } catch (error) {
            console.error('Error clearing storage:', error);
            throw error;
        }
    },
};

export default secureStorage;
