import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface MessageInputProps {
    onSend: (message: string) => void;
    disabled?: boolean;
}

export default function OrderMessageInput({ onSend, disabled = false }: MessageInputProps) {
    const [message, setMessage] = useState('');

    const handleSend = () => {
        if (message.trim() && !disabled) {
            onSend(message.trim());
            setMessage('');
        }
    };

    return (
        <View style={styles.container}>
            <TouchableOpacity style={styles.iconButton} disabled={disabled}>
                <Ionicons name="attach-outline" size={16} color="#0A292D" />
            </TouchableOpacity>

            <TextInput
                style={styles.input}
                placeholder="Enter here..."
                placeholderTextColor="#0A292D"
                value={message}
                onChangeText={setMessage}
                multiline
                editable={!disabled}
            />

            <TouchableOpacity
                style={styles.iconButton}
                onPress={handleSend}
                disabled={disabled || !message.trim()}
            >
                <Ionicons
                    name="send"
                    size={16}
                    color={disabled || !message.trim() ? '#9CA3AF' : '#0A292D'}
                />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 10,
        height: 40,
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 3,
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
        fontSize: 16,
        lineHeight: 16,
        color: '#0A292D',
        padding: 0,
    },
});
