// Formatter Utilities

export const formatters = {
    /**
     * Format price with currency symbol
     */
    formatPrice(price: number, currency: string = '$'): string {
        return `${currency}${price.toFixed(2)}`;
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
