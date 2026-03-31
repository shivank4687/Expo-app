import { Platform } from 'react-native';

/**
 * Safe wrapper for @react-native-google-signin/google-signin
 * Handles missing native module gracefully in environments like Expo Go.
 */

let GoogleSignin: any;
let statusCodes: any;
let isNativeModuleAvailable = false;

try {
  // Use require for dynamic import to prevent top-level crash if module is missing
  const GoogleModule = require('@react-native-google-signin/google-signin');
  GoogleSignin = GoogleModule.GoogleSignin;
  statusCodes = GoogleModule.statusCodes;
  
  // Even if import works, the native module part might be missing if not rebuild
  if (GoogleSignin) {
    isNativeModuleAvailable = true;
  }
} catch (error) {
  console.warn('Google Sign-In native module not found or failed to load. Fallback to mock.');
  
  // Provide mock status codes
  statusCodes = {
    SIGN_IN_CANCELLED: 'SIGN_IN_CANCELLED',
    IN_PROGRESS: 'IN_PROGRESS',
    PLAY_SERVICES_NOT_AVAILABLE: 'PLAY_SERVICES_NOT_AVAILABLE',
    SIGN_IN_REQUIRED: 'SIGN_IN_REQUIRED',
  };

  // Provide mock implementation that logs warnings but doesn't crash the app
  GoogleSignin = {
    configure: (config: any) => {
      console.log('[GoogleSignin Mock] configure:', config);
    },
    hasPlayServices: async () => {
      console.log('[GoogleSignin Mock] hasPlayServices called');
      return true;
    },
    signIn: async () => {
      console.warn('[GoogleSignin Mock] signIn called. Feature requires a custom development build.');
      throw {
        code: 'NATIVE_MODULE_MISSING',
        message: 'Google Sign-In requires a native development build. Run npx expo run:android or run:ios to create one.'
      };
    },
    signOut: async () => {
      console.log('[GoogleSignin Mock] signOut called');
    },
    isSignedIn: async () => false,
    getCurrentUser: async () => null,
  };
}

export { GoogleSignin, statusCodes, isNativeModuleAvailable };
