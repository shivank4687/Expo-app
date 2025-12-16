import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/theme';
import { SortOption } from '@/types/filters.types';

interface SortModalProps {
    visible: boolean;
    onClose: () => void;
    options: SortOption[];
    selectedValue: string;
    onSelect: (value: string) => void;
}

export const SortModal: React.FC<SortModalProps> = ({
    visible,
    onClose,
    options,
    selectedValue,
    onSelect,
}) => {
    const handleSelect = (value: string) => {
        onSelect(value);
        onClose();
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <TouchableOpacity
                style={styles.overlay}
                activeOpacity={1}
                onPress={onClose}
            >
                <View style={styles.container}>
                    <TouchableOpacity activeOpacity={1}>
                        <View style={styles.header}>
                            <Text style={styles.title}>Sort By</Text>
                            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                                <Ionicons name="close" size={24} color={theme.colors.text.primary} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.content}>
                            {options.map((option) => {
                                const isSelected = selectedValue === option.value;
                                return (
                                    <TouchableOpacity
                                        key={option.value}
                                        style={[
                                            styles.option,
                                            isSelected && styles.selectedOption,
                                        ]}
                                        onPress={() => handleSelect(option.value)}
                                        activeOpacity={0.7}
                                    >
                                        <View style={styles.radio}>
                                            <Ionicons
                                                name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                                                size={24}
                                                color={isSelected ? theme.colors.primary[500] : theme.colors.gray[400]}
                                            />
                                        </View>
                                        <Text style={[
                                            styles.optionText,
                                            isSelected && styles.selectedText,
                                        ]}>
                                            {option.label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    container: {
        backgroundColor: theme.colors.white,
        borderTopLeftRadius: theme.borderRadius.lg,
        borderTopRightRadius: theme.borderRadius.lg,
        maxHeight: '70%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: theme.spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.gray[200],
    },
    title: {
        fontSize: theme.typography.fontSize.lg,
        fontWeight: theme.typography.fontWeight.semiBold,
        color: theme.colors.text.primary,
    },
    closeButton: {
        padding: theme.spacing.xs,
    },
    content: {
        padding: theme.spacing.md,
    },
    option: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.sm,
        borderRadius: theme.borderRadius.md,
    },
    selectedOption: {
        backgroundColor: theme.colors.primary[50] || '#EEF2FF',
    },
    radio: {
        marginRight: theme.spacing.md,
    },
    optionText: {
        fontSize: theme.typography.fontSize.base,
        color: theme.colors.text.primary,
    },
    selectedText: {
        fontWeight: theme.typography.fontWeight.semiBold,
        color: theme.colors.primary[500],
    },
});
