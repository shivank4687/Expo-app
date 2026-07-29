import { secureStorage } from './secureStorage';

const TOKEN_KEY = 'guest_cart_token';

/**
 * Standard UUID v4 generator in pure JavaScript/TypeScript
 */
function generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

export const guestCartToken = {
    /**
     * Get existing token or generate a new one.
     * Called once on app init — token persists across sessions.
     */
    async getOrCreate(): Promise<string> {
        let token = await secureStorage.getItem(TOKEN_KEY);
        if (!token) {
            token = generateUUID();
            await secureStorage.setItem(TOKEN_KEY, token);
        }
        return token;
    },

    async get(): Promise<string | null> {
        return await secureStorage.getItem(TOKEN_KEY);
    },

    async clear(): Promise<void> {
        await secureStorage.removeItem(TOKEN_KEY);
    },
};

export default guestCartToken;
