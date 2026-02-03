import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface MessageBubbleProps {
    message: string;
    senderType: 'customer' | 'supplier';
    senderName: string;
    timestamp: string;
}

export default function OrderMessageBubble({ message, senderType, senderName, timestamp }: MessageBubbleProps) {
    const isSupplier = senderType === 'supplier';

    return (
        <View style={[styles.container, isSupplier ? styles.supplierContainer : styles.customerContainer]}>
            {/* Customer Avatar (left side) */}
            {!isSupplier && (
                <View style={styles.avatar}>
                    <Ionicons name="person" size={16} color="#000000" />
                </View>
            )}

            {/* Message Bubble */}
            <View style={[styles.bubble, isSupplier ? styles.supplierBubble : styles.customerBubble]}>
                <Text style={[styles.messageText, isSupplier ? styles.supplierText : styles.customerText]}>
                    {message}
                </Text>
            </View>

            {/* Supplier Avatar (right side - hidden) */}
            {isSupplier && <View style={styles.avatarHidden} />}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
    },
    customerContainer: {
        justifyContent: 'flex-start',
    },
    supplierContainer: {
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
    avatarHidden: {
        width: 32,
        height: 32,
        opacity: 0,
    },
    bubble: {
        paddingHorizontal: 8,
        paddingVertical: 8,
        maxWidth: 200,
    },
    customerBubble: {
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        borderBottomLeftRadius: 0,
    },
    supplierBubble: {
        backgroundColor: '#00615E',
        borderRadius: 8,
        borderBottomRightRadius: 0,
    },
    messageText: {
        fontFamily: 'Inter',
        fontSize: 16,
        lineHeight: 19.2, // 120% of 16px
    },
    customerText: {
        color: '#000000',
    },
    supplierText: {
        color: '#FFFFFF',
        textAlign: 'right',
    },
});
