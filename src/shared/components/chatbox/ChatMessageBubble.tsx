import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export type ChatSenderType = 'customer' | 'supplier';

export interface ChatMessageBubbleProps {
    message: string;
    senderType: ChatSenderType;
    senderName?: string;
    timestamp?: string;
}

export default function ChatMessageBubble({ message, senderType }: ChatMessageBubbleProps) {
    const isSupplier = senderType === 'supplier';

    return (
        <View
            style={[
                styles.row,
                isSupplier ? styles.supplierRow : styles.customerRow,
            ]}
        >
            <View
                style={[
                    styles.bubble,
                    isSupplier ? styles.supplierBubble : styles.customerBubble,
                ]}
            >
                <Text
                    style={[
                        styles.messageText,
                        isSupplier ? styles.supplierText : styles.customerText,
                    ]}
                >
                    {message}
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        marginBottom: 6,
        paddingHorizontal: 8,
    },

    customerRow: {
        justifyContent: 'flex-start',
    },

    supplierRow: {
        justifyContent: 'flex-end',
    },

    bubble: {
        maxWidth: '75%',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
    },

    customerBubble: {
        backgroundColor: '#FFFFFF',
        borderBottomLeftRadius: 0,
    },

    supplierBubble: {
        backgroundColor: '#00615E',
        borderBottomRightRadius: 0,
    },

    messageText: {
        fontFamily: 'Inter',
        fontSize: 16,
        lineHeight: 20,
    },

    customerText: {
        color: '#000000',
    },

    supplierText: {
        color: '#FFFFFF',
    },
});
