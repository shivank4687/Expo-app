import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Platform, ViewStyle, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { theme } from '@/theme';

interface DatePickerModalProps {
    visible: boolean;
    value: Date | undefined;
    onConfirm: (date: Date) => void;
    onCancel: () => void;
    maximumDate?: Date;
    minimumDate?: Date;
    title?: string;
}

export const DatePickerModal: React.FC<DatePickerModalProps> = ({
    visible,
    value,
    onConfirm,
    onCancel,
    maximumDate,
    minimumDate,
    title = 'Select Date',
}) => {
    const [selectedDate, setSelectedDate] = useState<Date>(value || new Date());

    // Sync selectedDate when value prop changes
    useEffect(() => {
        if (value) {
            setSelectedDate(value);
        }
    }, [value]);

    const handleDateChange = (event: any, date?: Date) => {
        if (Platform.OS === 'android') {
            // On Android, handle the event type
            if (event.type === 'set' && date) {
                onConfirm(date);
            } else if (event.type === 'dismissed') {
                onCancel();
            }
        } else {
            // On iOS, just update the selected date
            if (date) {
                setSelectedDate(date);
            }
        }
    };

    const handleConfirm = () => {
        onConfirm(selectedDate);
    };

    // Android uses native dialog, so we don't need our modal wrapper
    if (Platform.OS === 'android' && visible) {
        return (
            <DateTimePicker
                value={selectedDate}
                mode="date"
                display="default"
                onChange={handleDateChange}
                maximumDate={maximumDate}
                minimumDate={minimumDate}
                testID="dateTimePicker"
            />
        );
    }

    // iOS uses custom modal
    if (Platform.OS === 'ios') {
        return (
            <Modal
                visible={visible}
                transparent={true}
                animationType="slide"
                onRequestClose={onCancel}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{title}</Text>
                            <TouchableOpacity onPress={onCancel}>
                                <Ionicons name="close" size={24} color={theme.colors.text.primary} />
                            </TouchableOpacity>
                        </View>
                        
                        <View style={styles.dateTimePickerWrapper}>
                            <DateTimePicker
                                value={selectedDate}
                                mode="date"
                                display="spinner"
                                onChange={handleDateChange}
                                maximumDate={maximumDate}
                                minimumDate={minimumDate}
                                testID="dateTimePicker"
                                textColor={theme.colors.text.primary}
                            />
                        </View>
                        
                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.modalButtonCancel]}
                                onPress={onCancel}
                            >
                                <Text style={styles.modalButtonTextCancel}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.modalButtonDone]}
                                onPress={handleConfirm}
                            >
                                <Text style={styles.modalButtonTextDone}>Done</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        );
    }

    return null;
};

const styles = StyleSheet.create<{
    modalOverlay: ViewStyle;
    modalContent: ViewStyle;
    modalHeader: ViewStyle;
    modalTitle: TextStyle;
    dateTimePickerWrapper: ViewStyle;
    modalButtons: ViewStyle;
    modalButton: ViewStyle;
    modalButtonCancel: ViewStyle;
    modalButtonDone: ViewStyle;
    modalButtonTextCancel: TextStyle;
    modalButtonTextDone: TextStyle;
}>({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: theme.spacing.lg,
    },
    modalContent: {
        backgroundColor: theme.colors.white,
        borderRadius: theme.borderRadius.xl,
        padding: theme.spacing.lg,
        width: '100%',
        maxWidth: 400,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.lg,
    },
    modalTitle: {
        fontSize: theme.typography.fontSize.lg,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.text.primary,
    },
    dateTimePickerWrapper: {
        width: '100%',
        height: 200,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: theme.spacing.lg,
        gap: theme.spacing.md,
    },
    modalButton: {
        flex: 1,
        paddingVertical: theme.spacing.md,
        borderRadius: theme.borderRadius.md,
        alignItems: 'center',
    },
    modalButtonCancel: {
        backgroundColor: theme.colors.gray[200],
    },
    modalButtonDone: {
        backgroundColor: theme.colors.primary[500],
    },
    modalButtonTextCancel: {
        color: theme.colors.text.primary,
        fontSize: theme.typography.fontSize.md,
        fontWeight: theme.typography.fontWeight.medium,
    },
    modalButtonTextDone: {
        color: theme.colors.white,
        fontSize: theme.typography.fontSize.md,
        fontWeight: theme.typography.fontWeight.bold,
    },
});

