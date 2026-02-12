/**
 * Decode a base64 string
 * React Native doesn't have a global atob, and we want to avoid extra dependencies if possible
 */
const decodeBase64 = (str: string): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    let output = '';

    str = String(str).replace(/=+$/, '');

    if (str.length % 4 === 1) {
        throw new Error("'atob' failed: The string to be decoded is not correctly encoded.");
    }

    for (
        let bc = 0, bs = 0, buffer, idx = 0;
        (buffer = str.charAt(idx++));
        ~buffer && ((bs = bc % 4 ? bs * 64 + buffer : buffer), bc++ % 4)
            ? (output += String.fromCharCode(255 & (bs >> ((-2 * bc) & 6))))
            : 0
    ) {
        buffer = chars.indexOf(buffer);
    }

    return output;
};

/**
 * Checks if a JWT token is expired
 * @param token JWT token string
 * @param bufferInSeconds Buffer time in seconds (default 30s)
 * @returns boolean true if expired or invalid
 */
export const isTokenExpired = (token: string | null, bufferInSeconds = 30): boolean => {
    if (!token) return true;

    try {
        const parts = token.split('.');
        if (parts.length !== 3) return true;

        // Decode payload (second part of JWT)
        // JWT uses base64url encoding, so we need to replace '-' with '+' and '_' with '/'
        const base64Url = parts[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeBase64(base64);

        const payload = JSON.parse(jsonPayload);

        if (!payload.exp) return false; // If no exp claim, consider it valid (session token)

        const currentTime = Math.floor(Date.now() / 1000);
        return payload.exp < (currentTime + bufferInSeconds);
    } catch (error) {
        console.error('Error checking token expiration:', error);
        return true; // Consider expired/invalid on error
    }
};
