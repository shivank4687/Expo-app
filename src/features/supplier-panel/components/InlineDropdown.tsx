import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    StyleProp,
    ViewStyle,
    TextStyle,
    Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface DropdownOption {
    label: string;
    value: string;
}

interface InlineDropdownProps {
    options: DropdownOption[];
    value: string | null;
    onSelect: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
    style?: {
        container?: StyleProp<ViewStyle>;
        trigger?: StyleProp<ViewStyle>;
        menu?: StyleProp<ViewStyle>;
        option?: StyleProp<ViewStyle>;
        optionText?: StyleProp<TextStyle>;
    };
}

export default function InlineDropdown({
    options,
    value,
    onSelect,
    placeholder = 'Select...',
    disabled = false,
    style = {},
}: InlineDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0, width: 0 });
    const triggerRef = useRef<View>(null);
    const selectedOption = options.find((option) => option.value === value);

    const toggle = () => {
        if (disabled) return;
        if (isOpen) {
            setIsOpen(false);
        } else {
            triggerRef.current?.measureInWindow((x, y, width, height) => {
                setMenuPosition({
                    top: y + height,
                    left: x,
                    width: width,
                });
                setIsOpen(true);
            });
        }
    };

    return (
        <View style={[styles.container, style.container]}>
            <TouchableOpacity
                ref={triggerRef}
                style={[
                    styles.trigger,
                    disabled && styles.triggerDisabled,
                    style.trigger,
                ]}
                onPress={toggle}
                activeOpacity={0.7}
            >
                <Text
                    style={[
                        styles.triggerText,
                        selectedOption ? undefined : styles.placeholderText,
                    ]}
                    numberOfLines={1}
                >
                    {selectedOption ? selectedOption.label : placeholder}
                </Text>
                <Ionicons
                    name={isOpen ? 'chevron-up' : 'chevron-down'}
                    size={16}
                    color={disabled ? '#A6A6A6' : '#0A292D'}
                />
            </TouchableOpacity>

            {isOpen && (
                <Modal
                    visible={isOpen}
                    transparent={true}
                    animationType="none"
                    onRequestClose={() => setIsOpen(false)}
                >
                    <TouchableOpacity
                        style={styles.overlay}
                        activeOpacity={1}
                        onPress={() => setIsOpen(false)}
                    >
                        <View
                            style={[
                                styles.menu,
                                style.menu,
                                {
                                    top: menuPosition.top,
                                    left: menuPosition.left,
                                    width: menuPosition.width,
                                },
                            ]}
                        >
                            {options.map((option) => {
                                const isActive = option.value === value;
                                return (
                                    <TouchableOpacity
                                        key={option.value}
                                        style={[
                                            styles.option,
                                            isActive && styles.optionActive,
                                            style.option,
                                        ]}
                                        onPress={() => {
                                            onSelect(option.value);
                                            setIsOpen(false);
                                        }}
                                    >
                                        <Text
                                            style={[
                                                styles.optionText,
                                                isActive && styles.optionTextActive,
                                                style.optionText,
                                            ]}
                                        >
                                            {option.label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </TouchableOpacity>
                </Modal>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        position: 'relative',
    },
    trigger: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 12,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: '#E1D9CF',
        borderRadius: 8,
        backgroundColor: '#FAF9F6',
    },
    triggerDisabled: {
        backgroundColor: '#F0F0F0',
    },
    triggerText: {
        flex: 1,
        fontFamily: 'Inter',
        fontSize: 14,
        fontWeight: '500',
        color: '#0A292D',
        marginRight: 8,
    },
    placeholderText: {
        color: '#7D8A8C',
    },
    overlay: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    menu: {
        position: 'absolute',
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E1D9CF',
        borderRadius: 8,
        paddingVertical: 4,
        paddingHorizontal: 8,
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 6,
        zIndex: 10,
    },
    option: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 8,
        paddingHorizontal: 8,
        borderRadius: 6,
    },
    optionActive: {
        backgroundColor: '#F0FCF8',
    },
    optionText: {
        fontFamily: 'Inter',
        fontSize: 14,
        fontWeight: '500',
        color: '#0A292D',
    },
    optionTextActive: {
        color: '#00615E',
    },
});
