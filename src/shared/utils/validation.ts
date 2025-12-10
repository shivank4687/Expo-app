// Validation Utilities

export const validation = {
    /**
     * Validate email format
     */
    isValidEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },

    /**
     * Validate password strength
     * At least 8 characters, 1 uppercase, 1 lowercase, 1 number
     */
    isValidPassword(password: string): boolean {
        if (password.length < 8) return false;

        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumber = /[0-9]/.test(password);

        return hasUpperCase && hasLowerCase && hasNumber;
    },

    /**
     * Get password strength message
     */
    getPasswordStrengthMessage(password: string): string {
        if (password.length < 8) {
            return 'Password must be at least 8 characters';
        }
        if (!/[A-Z]/.test(password)) {
            return 'Password must contain at least one uppercase letter';
        }
        if (!/[a-z]/.test(password)) {
            return 'Password must contain at least one lowercase letter';
        }
        if (!/[0-9]/.test(password)) {
            return 'Password must contain at least one number';
        }
        return '';
    },

    /**
     * Validate required field
     */
    isRequired(value: string): boolean {
        return value.trim().length > 0;
    },

    /**
     * Validate minimum length
     */
    minLength(value: string, min: number): boolean {
        return value.trim().length >= min;
    },

    /**
     * Validate maximum length
     */
    maxLength(value: string, max: number): boolean {
        return value.trim().length <= max;
    },

    /**
     * Validate phone number (basic)
     */
    isValidPhone(phone: string): boolean {
        const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/;
        return phoneRegex.test(phone);
    },

    /**
     * Validate email or phone number (10 digits for phone, matching backend validation)
     */
    isValidEmailOrPhone(value: string): boolean {
        // Check if it's a valid email
        if (this.isValidEmail(value)) {
            return true;
        }
        // Check if it's a valid phone (10 digits, matching backend regex: /^[0-9]{10}$/)
        const phoneRegex = /^[0-9]{10}$/;
        return phoneRegex.test(value);
    },
};

export default validation;
