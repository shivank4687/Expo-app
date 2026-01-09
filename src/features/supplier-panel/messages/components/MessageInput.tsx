import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/features/supplier-panel/styles';

interface MessageInputProps {
    onSend: (message: string) => void;
    disabled?: boolean;
}

export const MessageInput: React.FC<MessageInputProps> = ({ onSend, disabled = false }) => {
    const [message, setMessage] = useState('');

    const handleSend = () => {
        if (message.trim() && !disabled) {
            onSend(message.trim());
            setMessage('');
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.inputContainer}>
                {/* Attach Icon */}
                <TouchableOpacity style={styles.iconButton} disabled={disabled}>
                    <Ionicons name="attach" size={16} color="#666666" />
                </TouchableOpacity>

                {/* Text Input */}
                <TextInput
                    style={styles.input}
                    placeholder="Enter here..."
                    placeholderTextColor="#666666"
                    value={message}
                    onChangeText={setMessage}
                    multiline
                    maxLength={1000}
                    editable={!disabled}
                />

                {/* Send Icon */}
                <TouchableOpacity
                    style={styles.iconButton}
                    onPress={handleSend}
                    disabled={disabled || !message.trim()}
                >
                    <Ionicons
                        name="send"
                        size={16}
                        color={disabled || !message.trim() ? '#CCCCCC' : '#666666'}
                    />
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'column',
        alignItems: 'flex-start',
        padding: 0,
        width: '100%',
    },
    inputContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 12,
        paddingHorizontal: 16,
        gap: 10,
        width: '100%',
        height: 40,
        backgroundColor: COLORS.white,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 3,
        borderRadius: 8,
    },
    iconButton: {
        width: 16,
        height: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    input: {
        flex: 1,
        fontFamily: 'Inter',
        fontWeight: '400',
        fontSize: 16,
        lineHeight: 16,
        color: COLORS.black,
        padding: 0,
    },
});
