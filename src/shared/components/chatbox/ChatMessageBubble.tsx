import { theme } from '@/theme';
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

export default function ChatMessageBubble({ message, senderType, timestamp, currentUserType = 'supplier' }: ChatMessageBubbleProps) {
    const isCurrentUser = senderType === currentUserType;

    const formatTime = (ts?: string) => {
        if (!ts) return '';
        try {
            const date = new Date(ts);
            return date.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
            });
        } catch (e) {
            return '';
        }
    };

    const timeStr = formatTime(timestamp);

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
                {timeStr ? (
                    <Text
                        style={[
                            styles.timestamp,
                            isCurrentUser ? styles.currentUserTimestamp : styles.otherUserTimestamp,
                        ]}
                    >
                        {timeStr}
                    </Text>
                ) : null}
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
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: theme.spacing.xs,
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

    timestamp: {
        fontFamily: 'Inter',
        fontSize: 10,
        marginTop: 2,
        marginLeft: 10,
        alignSelf: 'flex-end',
    },

    otherUserTimestamp: {
        color: '#9CA3AF',
    },

    currentUserTimestamp: {
        color: 'rgba(255, 255, 255, 0.7)',
    },
});
