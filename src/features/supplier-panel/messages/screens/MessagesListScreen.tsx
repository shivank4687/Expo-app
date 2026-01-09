import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/features/supplier-panel/styles';
import { messagesApi } from '../api/messages.api';
import type { MessageThread } from '../types/messages.types';

export const MessagesListScreen: React.FC = () => {
    const router = useRouter();
    const [threads, setThreads] = useState<MessageThread[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadThreads();
    }, []);

    const loadThreads = async () => {
        try {
            setError(null);
            const response = await messagesApi.getMessageThreads();
            setThreads(response.data || []);
        } catch (err: any) {
            setError(err.message || 'Failed to load messages');
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setIsRefreshing(true);
        loadThreads();
    };

    const handleThreadPress = (thread: MessageThread) => {
        router.push({
            pathname: '/(supplier-drawer)/chat/[threadId]',
            params: {
                threadId: thread.id.toString(),
                customerName: thread.customer_name,
            },
        } as any);
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diffInSeconds < 60) {
            return 'Just now';
        } else if (diffInSeconds < 3600) {
            const minutes = Math.floor(diffInSeconds / 60);
            return `${minutes}m ago`;
        } else if (diffInSeconds < 86400) {
            const hours = Math.floor(diffInSeconds / 3600);
            return `${hours}h ago`;
        } else {
            const days = Math.floor(diffInSeconds / 86400);
            return `${days}d ago`;
        }
    };

    const renderThreadItem = ({ item }: { item: MessageThread }) => (
        <TouchableOpacity
            style={styles.threadCard}
            onPress={() => handleThreadPress(item)}
            activeOpacity={0.7}
        >
            {/* Avatar */}
            <View style={styles.avatar}>
                <Ionicons
                    name="person"
                    size={24}
                    color={COLORS.black}
                />
            </View>

            {/* Content */}
            <View style={styles.threadContent}>
                <View style={styles.threadHeader}>
                    <Text style={styles.customerName} numberOfLines={1}>
                        {item.customer_name}
                    </Text>
                    <Text style={styles.timestamp}>
                        {formatDate(item.updated_at)}
                    </Text>
                </View>

                <View style={styles.messagePreview}>
                    <Text
                        style={[
                            styles.lastMessage,
                            item.last_message_role === 'customer' && styles.unreadMessage,
                        ]}
                        numberOfLines={1}
                    >
                        {item.last_message_role === 'customer' && 'Customer: '}
                        {item.last_message}
                    </Text>

                    {item.unread_count > 0 && (
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>
                                {item.unread_count > 9 ? '9+' : item.unread_count}
                            </Text>
                        </View>
                    )}
                </View>
            </View>

            {/* Arrow */}
            <Ionicons
                name="chevron-forward"
                size={20}
                color={COLORS.textSecondary}
            />
        </TouchableOpacity>
    );

    if (isLoading) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={COLORS.black} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Messages</Text>
                    <View style={styles.headerRight} />
                </View>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <Text style={styles.stateText}>Loading messages...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (error && threads.length === 0) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={COLORS.black} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Messages</Text>
                    <View style={styles.headerRight} />
                </View>
                <View style={styles.emptyContainer}>
                    <Ionicons name="alert-circle-outline" size={64} color={COLORS.error} />
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={loadThreads}>
                        <Text style={styles.retryButtonText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.black} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Messages</Text>
                <View style={styles.headerRight}>
                    {threads.length > 0 && (
                        <Text style={styles.itemCount}>
                            {threads.length} {threads.length === 1 ? 'chat' : 'chats'}
                        </Text>
                    )}
                </View>
            </View>

            {threads.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Ionicons
                        name="chatbubbles-outline"
                        size={64}
                        color={COLORS.textSecondary}
                    />
                    <Text style={styles.emptyText}>No messages yet</Text>
                    <Text style={styles.emptySubtext}>
                        Customer messages will appear here
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={threads}
                    renderItem={renderThreadItem}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.listContainer}
                    refreshControl={
                        <RefreshControl
                            refreshing={isRefreshing}
                            onRefresh={handleRefresh}
                            colors={[COLORS.primary]}
                            tintColor={COLORS.primary}
                        />
                    }
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
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
    headerTitle: {
        flex: 1,
        fontSize: 20,
        fontWeight: '700',
        color: COLORS.black,
        textAlign: 'center',
    },
    headerRight: {
        minWidth: 40,
        alignItems: 'flex-end',
    },
    itemCount: {
        fontSize: 14,
        color: COLORS.textSecondary,
        fontWeight: '500',
    },
    listContainer: {
        padding: 12,
    },
    threadCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 3,
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#E0D7C2',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    threadContent: {
        flex: 1,
        marginRight: 8,
    },
    threadHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    customerName: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.black,
        flex: 1,
    },
    timestamp: {
        fontSize: 12,
        color: COLORS.textSecondary,
        marginLeft: 8,
    },
    messagePreview: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    lastMessage: {
        fontSize: 14,
        color: COLORS.textSecondary,
        flex: 1,
    },
    unreadMessage: {
        fontWeight: '500',
        color: COLORS.black,
    },
    badge: {
        backgroundColor: COLORS.primary,
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 6,
        marginLeft: 8,
    },
    badgeText: {
        color: COLORS.white,
        fontSize: 12,
        fontWeight: '700',
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
    errorText: {
        fontSize: 16,
        color: COLORS.error,
        marginTop: 12,
        textAlign: 'center',
    },
    retryButton: {
        marginTop: 16,
        paddingHorizontal: 24,
        paddingVertical: 12,
        backgroundColor: COLORS.primary,
        borderRadius: 8,
    },
    retryButtonText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: '600',
    },
});

export default MessagesListScreen;
