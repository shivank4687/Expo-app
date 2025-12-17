// Environment Configuration
import { Platform } from "react-native";
//http://127.0.0.1:8000/api/v1'
//http://192.168.31.102:8000/

const getBaseUrl = () => {
  // return "https://artemayor.com";
  return Platform.OS === "android"
    ? "http://10.0.2.2:8000"
    : "http://192.168.31.102:8000";
};

const ENV = {
  development: {
    // Base URL without any API prefix
    baseUrl: getBaseUrl(),
    // REST API v1 - uses X-Locale header
    restApiUrl: `${getBaseUrl()}/api/v1`,
    // Shop API - uses ?locale= query parameter
    shopApiUrl: `${getBaseUrl()}/api`,
    timeout: 30000,
  },
  staging: {
    baseUrl: "https://staging.yourdomain.com",
    restApiUrl: "https://staging.yourdomain.com/api/v1",
    shopApiUrl: "https://staging.yourdomain.com/api",
    timeout: 30000,
  },
  production: {
    baseUrl: "https://api.yourdomain.com",
    restApiUrl: "https://api.yourdomain.com/api/v1",
    shopApiUrl: "https://api.yourdomain.com/api",
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

// For backward compatibility
export const apiUrl = config.restApiUrl;

export default config;
