/**
 * QuantitySelector Component
 * A reusable quantity increment/decrement control
 */

import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/theme';

interface QuantitySelectorProps {
    quantity: number;
    onIncrease: () => void;
    onDecrease: () => void;
    isLoading?: boolean;
    minQuantity?: number;
    disabled?: boolean;
}

export const QuantitySelector: React.FC<QuantitySelectorProps> = ({
    quantity,
    onIncrease,
    onDecrease,
    isLoading = false,
    minQuantity = 1,
    disabled = false,
}) => {
    const isAtMin = quantity <= minQuantity;

    return (
        <View style={styles.container}>
            {/* Decrease Button */}
            <TouchableOpacity
                style={[styles.button, isAtMin && styles.buttonDisabled]}
                onPress={onDecrease}
                disabled={disabled || isAtMin || isLoading}
                activeOpacity={0.7}
            >
                <Ionicons
                    name="remove"
                    size={16}
                    color={isAtMin ? theme.colors.gray[400] : '#0A292D'}
                />
            </TouchableOpacity>

            {/* Quantity Display */}
            <View style={styles.quantityDisplay}>
                {isLoading ? (
                    <ActivityIndicator size="small" color={theme.colors.primary[500]} />
                ) : (
                    <Text style={styles.quantityText}>{quantity}</Text>
                )}
            </View>

            {/* Increase Button */}
            <TouchableOpacity
                style={styles.button}
                onPress={onIncrease}
                disabled={disabled || isLoading}
                activeOpacity={0.7}
            >
                <Ionicons name="add" size={16} color="#0A292D" />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 4,
        gap: 8,
        width: 116,
        height: 40,
        borderWidth: 1,
        borderColor: '#E9E3D3',
        borderRadius: 8,
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        paddingHorizontal: 4,
        width: 32,
        height: 32,
        backgroundColor: '#FCF7EA',
        borderRadius: 8,
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    quantityDisplay: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    quantityText: {
        fontFamily: 'Inter',
        fontWeight: '500',
        fontSize: 16,
        lineHeight: 20,
        color: '#0A292D',
    },
});

export default QuantitySelector;
