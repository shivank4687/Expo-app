// Formatter Utilities

export const formatters = {
    /**
     * Format price with currency symbol
     * Handles both number and string inputs from API
     */
    formatPrice(price: number | string | undefined | null, currency: string = '$'): string {
        if (price === undefined || price === null) {
            return `${currency}0.00`;
        }
        
        // Convert string to number if needed
        const numPrice = typeof price === 'string' ? parseFloat(price) : price;
        
        // Check if valid number
        if (isNaN(numPrice)) {
            return `${currency}0.00`;
        }
        
        return `${currency}${numPrice.toFixed(2)}`;
    },

    /**
     * Format date
     */
    formatDate(date: string | Date, format: 'short' | 'long' = 'short'): string {
        const dateObj = typeof date === 'string' ? new Date(date) : date;

        if (format === 'short') {
            return dateObj.toLocaleDateString();
        }

        return dateObj.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    },

    /**
     * Truncate text
     */
    truncate(text: string, maxLength: number): string {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    },

    /**
     * Format phone number
     */
    formatPhone(phone: string): string {
        const cleaned = phone.replace(/\D/g, '');
        const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);

        if (match) {
            return `(${match[1]}) ${match[2]}-${match[3]}`;
        }

        return phone;
    },

    /**
     * Capitalize first letter
     */
    capitalize(text: string): string {
        return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
    },
};

export default formatters;
