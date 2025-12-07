import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/theme';
import { suppliersApi, ChatMessage, ThreadDetails } from '@/services/api/suppliers.api';
import { LoadingSpinner } from '@/shared/components/LoadingSpinner';
import { ErrorMessage } from '@/shared/components/ErrorMessage';
import { useToast } from '@/shared/components/Toast';
import { useRequireAuth } from '@/shared/hooks/useRequireAuth';

export const ChatMessagesScreen: React.FC = () => {
    const router = useRouter();
    const { showToast } = useToast();
    const insets = useSafeAreaInsets();
    const { isLoading: isAuthLoading } = useRequireAuth();
    const { threadId, supplierName } = useLocalSearchParams<{ threadId: string; supplierName?: string }>();
    const flatListRef = useRef<FlatList>(null);

    const [threadDetails, setThreadDetails] = useState<ThreadDetails | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [messageText, setMessageText] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (threadId) {
            loadMessages();
        }
    }, [threadId]);

    useEffect(() => {
        // Scroll to bottom when messages change
        if (messages.length > 0 && flatListRef.current) {
            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
        }
    }, [messages]);

    const loadMessages = async () => {
        if (!threadId) return;

        try {
            setError(null);
            const response = await suppliersApi.getThreadMessages(Number(threadId));
            setThreadDetails(response.data);
            setMessages(response.data.messages || []);
        } catch (err: any) {
            setError(err.message || 'Failed to load messages');
            showToast({ 
                message: err.message || 'Failed to load messages', 
                type: 'error' 
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendMessage = async () => {
        if (!messageText.trim() || !threadId || isSending) return;

        const messageToSend = messageText.trim();
        setMessageText('');
        setIsSending(true);

        try {
            const response = await suppliersApi.sendThreadMessage(Number(threadId), messageToSend);
            
            // Add the new message to the list
            setMessages(prev => [...prev, {
                id: response.data.id,
                message: response.data.message,
                role: response.data.role as 'customer' | 'supplier',
                msg_type: 'text',
                is_new: false,
                created_at: response.data.created_at,
            }]);

            // Scroll to bottom
            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
        } catch (err: any) {
            setMessageText(messageToSend); // Restore message on error
            showToast({ 
                message: err.message || 'Failed to send message', 
                type: 'error' 
            });
        } finally {
            setIsSending(false);
        }
    };

    const formatMessageTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
        });
    };

    const renderMessage = ({ item, index }: { item: ChatMessage; index: number }) => {
        const isCustomer = item.role === 'customer';
        const showTime = index === messages.length - 1 || 
            new Date(item.created_at).getTime() - new Date(messages[index + 1].created_at).getTime() > 300000; // 5 minutes

        return (
            <View style={styles.messageWrapper}>
                <View
                    style={[
                        styles.messageContainer,
                        isCustomer ? styles.customerMessage : styles.supplierMessage,
                    ]}
                >
                    <Text style={[
                        styles.messageText,
                        isCustomer && styles.customerMessageText,
                    ]}>
                        {item.message}
                    </Text>
                    {showTime && (
                        <Text style={[
                            styles.messageTime,
                            isCustomer && styles.customerMessageTime,
                        ]}>
                            {formatMessageTime(item.created_at)}
                        </Text>
                    )}
                </View>
            </View>
        );
    };

    const displayName = supplierName || threadDetails?.supplier_name || threadDetails?.supplier_company_name || 'Supplier';

    if (isAuthLoading || isLoading) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle} numberOfLines={1}>
                        {displayName}
                    </Text>
                    <View style={styles.headerRight} />
                </View>
                <LoadingSpinner />
            </SafeAreaView>
        );
    }

    if (error && !threadDetails) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Chat</Text>
                    <View style={styles.headerRight} />
                </View>
                <ErrorMessage message={error} onRetry={loadMessages} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <KeyboardAvoidingView
                style={styles.keyboardContainer}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle} numberOfLines={1}>
                        {displayName}
                    </Text>
                    <View style={styles.headerRight} />
                </View>

                {/* Messages List */}
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    renderItem={renderMessage}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.messagesContainer}
                    inverted={false}
                    style={styles.messagesList}
                    onContentSizeChange={() => {
                        if (messages.length > 0) {
                            flatListRef.current?.scrollToEnd({ animated: false });
                        }
                    }}
                />

                {/* Input Area */}
                <View style={[styles.inputContainer, { paddingBottom: Math.max(insets.bottom, theme.spacing.md) }]}>
                    <TextInput
                        style={styles.textInput}
                        placeholder="Type a message..."
                        placeholderTextColor={theme.colors.text.secondary}
                        value={messageText}
                        onChangeText={setMessageText}
                        multiline
                        maxLength={500}
                    />
                    <TouchableOpacity
                        style={[
                            styles.sendButton,
                            (!messageText.trim() || isSending) && styles.sendButtonDisabled,
                        ]}
                        onPress={handleSendMessage}
                        disabled={!messageText.trim() || isSending}
                    >
                        {isSending ? (
                            <ActivityIndicator size="small" color={theme.colors.white} />
                        ) : (
                            <Ionicons
                                name="send"
                                size={20}
                                color={theme.colors.white}
                            />
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background.default,
    },
    keyboardContainer: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.gray[200] || theme.colors.border.main,
        backgroundColor: theme.colors.background.paper || theme.colors.white,
    },
    backButton: {
        padding: theme.spacing.xs,
    },
    headerTitle: {
        flex: 1,
        fontSize: theme.typography.fontSize.xl,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.text.primary,
        textAlign: 'center',
        marginHorizontal: theme.spacing.sm,
    },
    headerRight: {
        minWidth: 40,
    },
    messagesList: {
        flex: 1,
    },
    messagesContainer: {
        padding: theme.spacing.md,
        paddingBottom: theme.spacing.lg,
        flexGrow: 1,
    },
    messageWrapper: {
        marginBottom: theme.spacing.sm,
    },
    messageContainer: {
        maxWidth: '75%',
        padding: theme.spacing.md,
        borderRadius: theme.borderRadius.md,
        marginVertical: theme.spacing.xs,
    },
    customerMessage: {
        alignSelf: 'flex-end',
        backgroundColor: theme.colors.primary[500],
        borderBottomRightRadius: 4,
    },
    supplierMessage: {
        alignSelf: 'flex-start',
        backgroundColor: theme.colors.white,
        borderBottomLeftRadius: 4,
        ...theme.shadows.sm,
    },
    messageText: {
        fontSize: theme.typography.fontSize.base,
        color: theme.colors.text.primary,
        lineHeight: 20,
    },
    customerMessageText: {
        color: theme.colors.white,
    },
    messageTime: {
        fontSize: theme.typography.fontSize.xs,
        color: theme.colors.text.secondary,
        marginTop: theme.spacing.xs,
        alignSelf: 'flex-end',
    },
    customerMessageTime: {
        color: 'rgba(255, 255, 255, 0.8)',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        paddingTop: theme.spacing.md,
        paddingHorizontal: theme.spacing.md,
        backgroundColor: theme.colors.white,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border.main,
        ...theme.shadows.lg,
    },
    textInput: {
        flex: 1,
        borderWidth: 1,
        borderColor: theme.colors.border.main,
        borderRadius: theme.borderRadius.md,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        fontSize: theme.typography.fontSize.base,
        color: theme.colors.text.primary,
        maxHeight: 100,
        marginRight: theme.spacing.sm,
    },
    sendButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: theme.colors.primary[500],
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendButtonDisabled: {
        backgroundColor: theme.colors.text.secondary,
        opacity: 0.5,
    },
});

export default ChatMessagesScreen;

