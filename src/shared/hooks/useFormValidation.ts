import { useState, useCallback } from 'react';

// Validation rule types
export type ValidationRule =
    | { type: 'required'; message?: string }
    | { type: 'minLength'; value: number; message?: string }
    | { type: 'maxLength'; value: number; message?: string }
    | { type: 'pattern'; value: RegExp; message?: string }
    | { type: 'custom'; validate: (value: any) => boolean; message: string };

export type FieldValidationRules = {
    [fieldName: string]: ValidationRule[];
};

export type ValidationErrors = {
    [fieldName: string]: string;
};

// Default error messages
const getDefaultMessage = (rule: ValidationRule, fieldName: string): string => {
    switch (rule.type) {
        case 'required':
            return rule.message || `${fieldName} is required`;
        case 'minLength':
            return rule.message || `${fieldName} must be at least ${rule.value} characters`;
        case 'maxLength':
            return rule.message || `${fieldName} must be at most ${rule.value} characters`;
        case 'pattern':
            return rule.message || `${fieldName} format is invalid`;
        case 'custom':
            return rule.message;
        default:
            return 'Invalid value';
    }
};

// Validate a single value against a rule
const validateRule = (value: any, rule: ValidationRule): boolean => {
    switch (rule.type) {
        case 'required':
            if (typeof value === 'string') {
                return value.trim().length > 0;
            }
            return value !== null && value !== undefined && value !== '';
        case 'minLength':
            return typeof value === 'string' && value.length >= rule.value;
        case 'maxLength':
            return typeof value === 'string' && value.length <= rule.value;
        case 'pattern':
            return typeof value === 'string' && rule.value.test(value);
        case 'custom':
            return rule.validate(value);
        default:
            return true;
    }
};

export const useFormValidation = (rules: FieldValidationRules) => {
    const [errors, setErrors] = useState<ValidationErrors>({});

    // Validate a single field
    const validateField = useCallback(
        (fieldName: string, value: any): string | null => {
            const fieldRules = rules[fieldName];
            if (!fieldRules || fieldRules.length === 0) {
                return null;
            }

            for (const rule of fieldRules) {
                if (!validateRule(value, rule)) {
                    return getDefaultMessage(rule, fieldName);
                }
            }

            return null;
        },
        [rules]
    );

    // Validate all fields
    const validate = useCallback(
        (values: { [fieldName: string]: any }): boolean => {
            const newErrors: ValidationErrors = {};
            let isValid = true;

            Object.keys(rules).forEach((fieldName) => {
                const error = validateField(fieldName, values[fieldName]);
                if (error) {
                    newErrors[fieldName] = error;
                    isValid = false;
                }
            });

            setErrors(newErrors);
            return isValid;
        },
        [rules, validateField]
    );

    // Clear error for a specific field
    const clearError = useCallback((fieldName: string) => {
        setErrors((prev) => {
            const newErrors = { ...prev };
            delete newErrors[fieldName];
            return newErrors;
        });
    }, []);

    // Set error for a specific field
    const setError = useCallback((fieldName: string, message: string) => {
        setErrors((prev) => ({
            ...prev,
            [fieldName]: message,
        }));
    }, []);

    // Clear all errors
    const clearAllErrors = useCallback(() => {
        setErrors({});
    }, []);

    // Check if there are any errors
    const hasErrors = Object.keys(errors).length > 0;

    return {
        errors,
        validate,
        validateField,
        clearError,
        setError,
        clearAllErrors,
        hasErrors,
    };
};
