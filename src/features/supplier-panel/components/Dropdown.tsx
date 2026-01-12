import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/features/supplier-panel/styles';

interface DropdownOption {
    label: string;
    value: string;
}

interface DropdownProps {
    placeholder?: string;
    options: DropdownOption[];
    value: string | string[];
    onSelect: (value: any) => void;
    style?: any;
    multiple?: boolean;
}

export default function Dropdown({ placeholder = 'Select...', options, value, onSelect, style, multiple = false }: DropdownProps) {
    const [isOpen, setIsOpen] = useState(false);

    const getSelectedLabel = () => {
        if (multiple) {
            const selectedValues = Array.isArray(value) ? value : [];
            if (selectedValues.length === 0) return placeholder;

            const labels = options
                .filter(opt => selectedValues.includes(opt.value))
                .map(opt => opt.label);

            if (labels.length === 0) return placeholder;
            return labels.join(', ');
        } else {
            const selectedOption = options.find(opt => opt.value === value);
            return selectedOption ? selectedOption.label : placeholder;
        }
    };

    const handleSelect = (optionValue: string) => {
        if (multiple) {
            const currentValues = Array.isArray(value) ? [...value] : [];
            const index = currentValues.indexOf(optionValue);

            let newValues;
            if (index >= 0) {
                newValues = currentValues.filter(v => v !== optionValue);
            } else {
                newValues = [...currentValues, optionValue];
            }
            onSelect(newValues);
            // Don't close modal for multiple selection
        } else {
            onSelect(optionValue);
            setIsOpen(false);
        }
    };

    const isSelected = (optionValue: string) => {
        if (multiple) {
            return Array.isArray(value) && value.includes(optionValue);
        }
        return value === optionValue;
    };

    return (
        <View style={[styles.container, style]}>
            {/* Dropdown Trigger */}
            <TouchableOpacity
                style={styles.trigger}
                onPress={() => setIsOpen(true)}
                activeOpacity={0.7}
            >
                <Text
                    style={[
                        styles.triggerText,
                        ((multiple && (!value || (Array.isArray(value) && value.length === 0))) || (!multiple && !value)) && styles.placeholderText
                    ]}
                    numberOfLines={1}
                >
                    {getSelectedLabel()}
                </Text>
                <Ionicons name="chevron-down" size={16} color="#666666" />
            </TouchableOpacity>

            {/* Dropdown Modal */}
            <Modal
                visible={isOpen}
                transparent
                animationType="fade"
                onRequestClose={() => setIsOpen(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setIsOpen(false)}
                >
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>
                                {multiple ? 'Select Options' : 'Select Option'}
                            </Text>
                            {multiple ? (
                                <TouchableOpacity onPress={() => setIsOpen(false)} style={styles.doneButton}>
                                    <Text style={styles.doneButtonText}>Done</Text>
                                </TouchableOpacity>
                            ) : (
                                <TouchableOpacity onPress={() => setIsOpen(false)}>
                                    <Ionicons name="close" size={24} color="#000000" />
                                </TouchableOpacity>
                            )}
                        </View>

                        <ScrollView style={styles.optionsList}>
                            {options.map((option) => {
                                const selected = isSelected(option.value);
                                return (
                                    <TouchableOpacity
                                        key={option.value}
                                        style={[
                                            styles.option,
                                            selected && styles.optionSelected
                                        ]}
                                        onPress={() => handleSelect(option.value)}
                                    >
                                        <Text style={[
                                            styles.optionText,
                                            selected && styles.optionTextSelected
                                        ]}>
                                            {option.label}
                                        </Text>
                                        {selected && (
                                            <Ionicons name="checkmark" size={20} color={COLORS.primary} />
                                        )}
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
    },
    trigger: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        height: 40,
        backgroundColor: '#EEEEEF',
        borderRadius: 8,
    },
    triggerText: {
        flex: 1,
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '400',
        fontSize: 16,
        lineHeight: 16,
        color: '#000000',
        marginRight: 8,
    },
    placeholderText: {
        color: '#666666',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        width: '100%',
        maxHeight: '80%',
        backgroundColor: COLORS.white,
        borderRadius: 16,
        overflow: 'hidden',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#EEEEEF',
    },
    modalTitle: {
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '600',
        fontSize: 18,
        lineHeight: 22,
        color: '#000000',
    },
    doneButton: {
        paddingVertical: 4,
        paddingHorizontal: 8,
    },
    doneButtonText: {
        fontFamily: 'Inter',
        fontWeight: '600',
        fontSize: 16,
        color: COLORS.primary,
    },
    optionsList: {
        maxHeight: 400,
    },
    option: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F5F5F5',
    },
    optionSelected: {
        backgroundColor: COLORS.primaryLight,
    },
    optionText: {
        flex: 1,
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '400',
        fontSize: 16,
        lineHeight: 20,
        color: '#000000',
    },
    optionTextSelected: {
        fontWeight: '600',
        color: COLORS.primary,
    },
});
