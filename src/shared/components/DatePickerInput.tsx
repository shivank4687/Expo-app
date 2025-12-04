import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/theme';
import { DatePickerModal } from './DatePickerModal';

interface DatePickerInputProps {
    label: string;
    value: Date | undefined;
    onChange: (date: Date) => void;
    placeholder?: string;
    maximumDate?: Date;
    minimumDate?: Date;
    required?: boolean;
    error?: string;
}

export const DatePickerInput: React.FC<DatePickerInputProps> = ({
    label,
    value,
    onChange,
    placeholder = 'Select date',
    maximumDate,
    minimumDate,
    required = false,
    error,
}) => {
    const [showPicker, setShowPicker] = useState(false);

    const handleConfirm = (date: Date) => {
        onChange(date);
        setShowPicker(false);
    };

    const handleCancel = () => {
        setShowPicker(false);
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    return (
        <View style={styles.container}>
            <Text style={styles.label}>
                {label} {required && <Text style={styles.required}>*</Text>}
            </Text>
            
            <TouchableOpacity
                style={[styles.button, error && styles.buttonError]}
                onPress={() => setShowPicker(true)}
                activeOpacity={0.7}
            >
                <Text style={[styles.buttonText, !value && styles.placeholderText]}>
                    {value ? formatDate(value) : placeholder}
                </Text>
                <Ionicons 
                    name="calendar-outline" 
                    size={20} 
                    color={error ? '#EF4444' : theme.colors.primary[500]} 
                />
            </TouchableOpacity>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <DatePickerModal
                visible={showPicker}
                value={value}
                onConfirm={handleConfirm}
                onCancel={handleCancel}
                maximumDate={maximumDate}
                minimumDate={minimumDate}
                title={label}
            />
        </View>
    );
};

const styles = StyleSheet.create<{
    container: ViewStyle;
    label: TextStyle;
    required: TextStyle;
    button: ViewStyle;
    buttonError: ViewStyle;
    buttonText: TextStyle;
    placeholderText: TextStyle;
    errorText: TextStyle;
}>({
    container: {
        marginBottom: theme.spacing.lg,
    },
    label: {
        fontSize: theme.typography.fontSize.sm,
        fontWeight: theme.typography.fontWeight.medium,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.xs,
    },
    required: {
        color: '#EF4444',
        fontWeight: theme.typography.fontWeight.bold,
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: theme.spacing.sm,
        paddingHorizontal: theme.spacing.md,
        borderWidth: 1,
        borderColor: theme.colors.gray[300],
        borderRadius: theme.borderRadius.md,
        backgroundColor: theme.colors.white,
    },
    buttonError: {
        borderColor: '#EF4444',
    },
    buttonText: {
        fontSize: theme.typography.fontSize.md,
        color: theme.colors.text.primary,
    },
    placeholderText: {
        color: theme.colors.text.secondary,
    },
    errorText: {
        fontSize: theme.typography.fontSize.xs,
        color: '#EF4444',
        marginTop: theme.spacing.xs,
    },
});

