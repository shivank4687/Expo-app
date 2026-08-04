/**
 * QuantitySelector Component
 * A reusable quantity increment/decrement control supporting text inputs
 */

import React, { useState, useEffect, useRef } from 'react';
import { ActivityIndicator, StyleSheet, TextInput, TouchableOpacity, View, Keyboard } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/theme';

interface QuantitySelectorProps {
    quantity: number;
    onChangeQuantity: (qty: number) => void;
    isLoading?: boolean;
    minQuantity?: number;
    maxQuantity?: number;
    disabled?: boolean;
}

export const QuantitySelector: React.FC<QuantitySelectorProps> = ({
    quantity,
    onChangeQuantity,
    isLoading = false,
    minQuantity = 1,
    maxQuantity = 999,
    disabled = false,
}) => {
    const isAtMin = quantity <= minQuantity;
    const isAtMax = quantity >= maxQuantity;

    const [inputValue, setInputValue] = useState(String(quantity));
    const inputRef = useRef<TextInput>(null);

    // Sync when quantity changes from outside or when loading completes
    useEffect(() => {
        if (!isLoading) {
            setInputValue(String(quantity));
        }
    }, [quantity, isLoading]);

    // Commit value helper
    const commitValue = (raw: string) => {
        const parsed = parseInt(raw, 10);
        let finalQty = quantity;

        if (isNaN(parsed) || parsed < minQuantity) {
            finalQty = minQuantity;
        } else if (parsed > maxQuantity) {
            finalQty = maxQuantity;
        } else {
            finalQty = parsed;
        }

        setInputValue(String(finalQty));
        if (finalQty !== quantity) {
            onChangeQuantity(finalQty);
        }
    };

    // Listen to keyboard hide events to commit value
    useEffect(() => {
        const keyboardHideSubscription = Keyboard.addListener('keyboardDidHide', () => {
            if (inputRef.current?.isFocused()) {
                inputRef.current.blur();
                commitValue(inputValue);
            }
        });

        return () => {
            keyboardHideSubscription.remove();
        };
    }, [inputValue, quantity]);

    const handleIncrease = () => {
        if (quantity < maxQuantity) {
            onChangeQuantity(quantity + 1);
        }
    };

    const handleDecrease = () => {
        if (quantity > minQuantity) {
            onChangeQuantity(quantity - 1);
        }
    };

    return (
        <View style={styles.container}>
            {/* Decrease Button */}
            <TouchableOpacity
                style={[styles.button, styles.minButton, isAtMin && styles.buttonDisabled]}
                onPress={handleDecrease}
                disabled={disabled || isAtMin || isLoading}
                activeOpacity={0.7}
            >
                <Ionicons
                    name="remove"
                    size={16}
                    color={isAtMin ? theme.colors.gray[400] : '#0A292D'}
                />
            </TouchableOpacity>

            {/* Quantity Input / Loading */}
            <View style={styles.quantityDisplay}>
                {isLoading ? (
                    <ActivityIndicator size="small" color={theme.colors.primary[500]} />
                ) : (
                    <TextInput
                        ref={inputRef}
                        style={styles.quantityInput}
                        value={inputValue}
                        onChangeText={(text) => {
                            const numeric = text.replace(/[^0-9]/g, '');
                            setInputValue(numeric);
                        }}
                        onBlur={() => commitValue(inputValue)}
                        onSubmitEditing={() => commitValue(inputValue)}
                        keyboardType="numeric"
                        maxLength={4}
                        selectTextOnFocus
                        textAlign="center"
                        editable={!disabled && !isLoading}
                    />
                )}
            </View>

            {/* Increase Button */}
            <TouchableOpacity
                style={[styles.button, styles.maxButton, isAtMax && styles.buttonDisabled]}
                onPress={handleIncrease}
                disabled={disabled || isAtMax || isLoading}
                activeOpacity={0.7}
            >
                <Ionicons
                    name="add"
                    size={16}
                    color={isAtMax ? theme.colors.gray[400] : '#0A292D'}
                />
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
        gap: 2,
        width: 120,
        height: 40,
        borderWidth: 1,
        borderColor: '#E9E3D3',
        borderRadius: 8,
        backgroundColor: '#FFFFFF',
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        paddingHorizontal: 4,
        width: 30,
        height: 32,
        backgroundColor: '#FCF7EA',
        borderRadius: 8,
    },
    minButton: {},
    maxButton: {},
    buttonDisabled: {
        opacity: 0.5,
    },
    quantityDisplay: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    quantityInput: {
        fontFamily: 'Inter',
        fontWeight: '500',
        fontSize: 16,
        color: '#0A292D',
        textAlign: 'center',
        paddingVertical: 0,
        //paddingHorizontal: 2,
        width: '100%',
    },
});

export default QuantitySelector;
