import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/features/supplier-panel/styles';
import { messagesApi } from '../api/messages.api';
import { MessageBubble } from '../components/MessageBubble';
import { MessageInput } from '../components/MessageInput';
import type { ChatMessage } from '../types/messages.types';

export const ChatScreen: React.FC = () => {
    const router = useRouter();
    const params = useLocalSearchParams();
    const threadId = parseInt(params.threadId as string);
    const customerName = params.customerName as string;

    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const flatListRef = useRef<FlatList>(null);

    useEffect(() => {
        loadMessages();
    }, [threadId]);

    const loadMessages = async () => {
        try {
            setError(null);
            const response = await messagesApi.getThreadMessages(threadId);
            setMessages(response.data.messages || []);
        } catch (err: any) {
            setError(err.message || 'Failed to load messages');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendMessage = async (message: string) => {
        setIsSending(true);
        try {
            const response = await messagesApi.sendMessage(threadId, message);

            // Add the new message to the list
            const newMessage: ChatMessage = {
                id: response.data.id,
                message: response.data.message,
                role: response.data.role as 'customer' | 'supplier',
                msg_type: 'text',
                is_new: true,
                created_at: response.data.created_at,
            };

            setMessages((prev) => [...prev, newMessage]);

            // Scroll to bottom
            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
        } catch (err: any) {
            setError(err.message || 'Failed to send message');
        } finally {
            setIsSending(false);
        }
    };

    if (isLoading) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={COLORS.black} />
                    </TouchableOpacity>
                    <View style={styles.headerTitleContainer}>
                        <Text style={styles.headerTitle}>{customerName || 'Chat'}</Text>
                    </View>
                    <View style={styles.headerRight} />
                </View>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <Text style={styles.stateText}>Loading messages...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <KeyboardAvoidingView
                style={styles.keyboardAvoid}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={COLORS.black} />
                    </TouchableOpacity>
                    <View style={styles.headerTitleContainer}>
                        <Text style={styles.headerTitle}>{customerName || 'Chat'}</Text>
                    </View>
                    <View style={styles.headerRight} />
                </View>

                {/* Messages Container */}
                <View style={styles.chatContainer}>
                    {messages.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Ionicons
                                name="chatbubbles-outline"
                                size={64}
                                color={COLORS.textSecondary}
                            />
                            <Text style={styles.emptyText}>No messages yet</Text>
                            <Text style={styles.emptySubtext}>
                                Start the conversation
                            </Text>
                        </View>
                    ) : (
                        <FlatList
                            ref={flatListRef}
                            data={messages}
                            keyExtractor={(item) => item.id.toString()}
                            renderItem={({ item }) => <MessageBubble message={item} />}
                            contentContainerStyle={styles.messagesContent}
                            showsVerticalScrollIndicator={false}
                            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
                            onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
                        />
                    )}
                </View>

                {/* Message Input */}
                <View style={styles.inputContainer}>
                    <MessageInput onSend={handleSendMessage} disabled={isSending} />
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    keyboardAvoid: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        backgroundColor: COLORS.white,
    },
    backButton: {
        padding: 4,
    },
    headerTitleContainer: {
        flex: 1,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: COLORS.black,
    },
    headerRight: {
        minWidth: 40,
    },
    chatContainer: {
        flex: 1,
        backgroundColor: COLORS.white,
        padding: 16,
        gap: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 3,
        borderRadius: 8,
        margin: 12,
    },
    messagesContent: {
        flexDirection: 'column',
        padding: 0,
        gap: 4,
        flexGrow: 1,
    },
    inputContainer: {
        padding: 16,
        backgroundColor: COLORS.white,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    stateText: {
        marginTop: 12,
        fontSize: 16,
        color: COLORS.textSecondary,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.black,
        marginTop: 12,
    },
    emptySubtext: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginTop: 4,
        textAlign: 'center',
    },
});

export default ChatScreen;
