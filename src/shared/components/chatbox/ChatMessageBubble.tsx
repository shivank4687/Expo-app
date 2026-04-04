import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export type ChatSenderType = 'customer' | 'supplier';

export interface ChatMessageBubbleProps {
    message: string;
    senderType: ChatSenderType;
    senderName?: string;
    timestamp?: string;
    currentUserType?: ChatSenderType; // Added to distinguish who is viewing the chat
}

export default function ChatMessageBubble({ message, senderType, currentUserType = 'supplier' }: ChatMessageBubbleProps) {
    const isCurrentUser = senderType === currentUserType;

    return (
        <View
            style={[
                styles.row,
                isCurrentUser ? styles.currentUserRow : styles.otherUserRow,
            ]}
        >
            <View
                style={[
                    styles.bubble,
                    isCurrentUser ? styles.currentUserBubble : styles.otherUserBubble,
                ]}
            >
                <Text
                    style={[
                        styles.messageText,
                        isCurrentUser ? styles.currentUserText : styles.otherUserText,
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

    otherUserRow: {
        justifyContent: 'flex-start',
    },

    currentUserRow: {
        justifyContent: 'flex-end',
    },

    bubble: {
        maxWidth: '75%',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
    },

    otherUserBubble: {
        backgroundColor: '#FFFFFF',
        borderBottomLeftRadius: 0,
    },

    currentUserBubble: {
        backgroundColor: '#00615E',
        borderBottomRightRadius: 0,
    },

    messageText: {
        fontFamily: 'Inter',
        fontSize: 16,
        lineHeight: 20,
    },

    otherUserText: {
        color: '#000000',
    },

    currentUserText: {
        color: '#FFFFFF',
    },
});
