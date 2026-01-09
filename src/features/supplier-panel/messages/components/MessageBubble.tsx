import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/features/supplier-panel/styles';
import type { ChatMessage } from '../types/messages.types';

interface MessageBubbleProps {
    message: ChatMessage;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
    const isSupplier = message.role === 'supplier';

    return (
        <View style={[styles.container, isSupplier && styles.supplierContainer]}>
            {/* Customer Avatar (only visible for customer messages) */}
            {!isSupplier && (
                <View style={styles.avatar}>
                    <Ionicons name="person" size={16} color={COLORS.black} />
                </View>
            )}

            {/* Message Bubble */}
            <View style={[
                styles.bubble,
                isSupplier ? styles.supplierBubble : styles.customerBubble
            ]}>
                <Text style={[
                    styles.messageText,
                    isSupplier && styles.supplierText
                ]}>
                    {message.message}
                </Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        padding: 0,
        gap: 8,
        marginBottom: 4,
    },
    supplierContainer: {
        flexDirection: 'row',
        alignSelf: 'flex-end',
        justifyContent: 'flex-end',
    },
    avatar: {
        width: 32,
        height: 32,
        backgroundColor: '#E0D7C2',
        borderWidth: 1,
        borderColor: '#E0D7C2',
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    bubble: {
        maxWidth: '70%',
        padding: 8,
        borderRadius: 8,
    },
    customerBubble: {
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: '#E0D7C2',
        borderTopLeftRadius: 8,
        borderTopRightRadius: 8,
        borderBottomRightRadius: 8,
        borderBottomLeftRadius: 0,
    },
    supplierBubble: {
        backgroundColor: '#00615E',
        borderTopLeftRadius: 8,
        borderTopRightRadius: 8,
        borderBottomRightRadius: 0,
        borderBottomLeftRadius: 8,
    },
    messageText: {
        fontFamily: 'Inter',
        fontWeight: '400',
        fontSize: 16,
        lineHeight: 19.2, // 120% of 16px
        color: COLORS.black,
    },
    supplierText: {
        color: COLORS.white,
        textAlign: 'right',
    },
});
