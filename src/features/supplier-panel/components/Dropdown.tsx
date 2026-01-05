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
    value: string;
    onSelect: (value: string) => void;
    style?: any;
}

export default function Dropdown({ placeholder = 'Select...', options, value, onSelect, style }: DropdownProps) {
    const [isOpen, setIsOpen] = useState(false);

    const selectedOption = options.find(opt => opt.value === value);

    const handleSelect = (optionValue: string) => {
        onSelect(optionValue);
        setIsOpen(false);
    };

    return (
        <View style={[styles.container, style]}>
            {/* Dropdown Trigger */}
            <TouchableOpacity
                style={styles.trigger}
                onPress={() => setIsOpen(true)}
                activeOpacity={0.7}
            >
                <Text style={[styles.triggerText, !selectedOption && styles.placeholderText]}>
                    {selectedOption ? selectedOption.label : placeholder}
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
                            <Text style={styles.modalTitle}>Select Option</Text>
                            <TouchableOpacity onPress={() => setIsOpen(false)}>
                                <Ionicons name="close" size={24} color="#000000" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.optionsList}>
                            {options.map((option) => (
                                <TouchableOpacity
                                    key={option.value}
                                    style={[
                                        styles.option,
                                        option.value === value && styles.optionSelected
                                    ]}
                                    onPress={() => handleSelect(option.value)}
                                >
                                    <Text style={[
                                        styles.optionText,
                                        option.value === value && styles.optionTextSelected
                                    ]}>
                                        {option.label}
                                    </Text>
                                    {option.value === value && (
                                        <Ionicons name="checkmark" size={20} color={COLORS.primary} />
                                    )}
                                </TouchableOpacity>
                            ))}
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
