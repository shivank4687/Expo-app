import React, { useState, useRef } from 'react';
import { TextInput, TouchableOpacity, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface ChatMessageInputProps {
    onSend: (message: string) => void;
    disabled?: boolean;
    hideAttachment?: boolean;
    placeholder?: string;
}

export default function ChatMessageInput({
    onSend,
    disabled = false,
    hideAttachment = false,
    placeholder = 'Enter here...',
}: ChatMessageInputProps) {
    const [message, setMessage] = useState('');
    const inputRef = useRef<TextInput>(null);

    const handleSend = () => {
        if (message.trim() && !disabled) {
            onSend(message.trim());
            setMessage('');
        }
    };

    return (
        <Pressable
            style={styles.container}
            onPress={() => inputRef.current?.focus()}
        >
            {!hideAttachment && (
                <TouchableOpacity style={styles.iconButton} disabled={disabled}>
                    <Ionicons name="attach-outline" size={20} color="#0A292D" />
                </TouchableOpacity>
            )}

            <TextInput
                ref={inputRef}
                style={styles.input}
                placeholder={placeholder}
                placeholderTextColor="#6B7280"
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
                    size={20}
                    color={disabled || !message.trim() ? '#9CA3AF' : '#00615E'}
                />
            </TouchableOpacity>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 12,
        minHeight: 48,
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    iconButton: {
        width: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    input: {
        flex: 1,
        fontFamily: 'Inter',
        fontSize: 14,
        lineHeight: 20,
        color: '#0A292D',
        paddingTop: 0,
        paddingBottom: 0,
        maxHeight: 100,
    },
});
