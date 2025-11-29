// Environment Configuration
import { Platform } from "react-native";
//http://127.0.0.1:8000/api/v1'
//http://192.168.31.102:8000/
const ENV = {
  development: {
    // Use 10.0.2.2 for Android emulator, 127.0.0.1 for iOS simulator/web
    apiUrl:
      Platform.OS === "android"
        ? "http://10.0.2.2:8000/api/v1"
        : "http://192.168.31.102:8000/api/v1",
    timeout: 30000,
  },
  staging: {
    apiUrl: "https://staging.yourdomain.com/api/v1",
    timeout: 30000,
  },
  production: {
    apiUrl: "https://api.yourdomain.com/api/v1",
    timeout: 30000,
  },
};

// Determine current environment
const getEnvVars = () => {
  if (__DEV__) {
    return ENV.development;
  }
  // You can add logic to differentiate staging vs production
  return ENV.production;
};

export const config = getEnvVars();

export default config;
