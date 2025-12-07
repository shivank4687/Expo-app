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
import { theme } from '@/theme';
import { suppliersApi, MessageThread } from '@/services/api/suppliers.api';
import { LoadingSpinner } from '@/shared/components/LoadingSpinner';
import { ErrorMessage } from '@/shared/components/ErrorMessage';
import { useToast } from '@/shared/components/Toast';
import { useRequireAuth } from '@/shared/hooks/useRequireAuth';

export const MessagesListScreen: React.FC = () => {
    const router = useRouter();
    const { showToast } = useToast();
    const { isLoading: isAuthLoading } = useRequireAuth();
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
            const response = await suppliersApi.getMessageThreads();
            setThreads(response.data || []);
        } catch (err: any) {
            setError(err.message || 'Failed to load messages');
            showToast({ 
                message: err.message || 'Failed to load messages', 
                type: 'error' 
            });
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
            pathname: '/chat/[threadId]',
            params: {
                threadId: thread.id.toString(),
                supplierName: thread.supplier_name || thread.supplier_company_name,
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
                    name="storefront"
                    size={24}
                    color={theme.colors.primary[500]}
                />
            </View>

            {/* Content */}
            <View style={styles.threadContent}>
                <View style={styles.threadHeader}>
                    <Text style={styles.supplierName} numberOfLines={1}>
                        {item.supplier_name || item.supplier_company_name}
                    </Text>
                    <Text style={styles.timestamp}>
                        {formatDate(item.updated_at)}
                    </Text>
                </View>
                
                <View style={styles.messagePreview}>
                    <Text 
                        style={[
                            styles.lastMessage,
                            item.last_message_role === 'supplier' && styles.unreadMessage,
                        ]} 
                        numberOfLines={1}
                    >
                        {item.last_message_role === 'supplier' && 'Supplier: '}
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
                color={theme.colors.text.secondary}
            />
        </TouchableOpacity>
    );

    if (isAuthLoading || isLoading) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Messages</Text>
                    <View style={styles.headerRight} />
                </View>
                <LoadingSpinner />
            </SafeAreaView>
        );
    }

    if (error && threads.length === 0) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Messages</Text>
                    <View style={styles.headerRight} />
                </View>
                <ErrorMessage message={error} onRetry={loadThreads} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
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
                        color={theme.colors.text.secondary}
                    />
                    <Text style={styles.emptyText}>No messages yet</Text>
                    <Text style={styles.emptySubtext}>
                        Start a conversation with a supplier
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
                            colors={[theme.colors.primary[500]]}
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
        backgroundColor: theme.colors.background.default,
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
    },
    headerRight: {
        minWidth: 40,
        alignItems: 'flex-end',
    },
    itemCount: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.text.secondary,
        fontWeight: theme.typography.fontWeight.medium,
    },
    listContainer: {
        padding: theme.spacing.md,
    },
    threadCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.white,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.md,
        marginBottom: theme.spacing.md,
        ...theme.shadows.sm,
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: theme.colors.primary[50] || theme.colors.primary[100],
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: theme.spacing.md,
    },
    threadContent: {
        flex: 1,
        marginRight: theme.spacing.sm,
    },
    threadHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.xs,
    },
    supplierName: {
        fontSize: theme.typography.fontSize.base,
        fontWeight: theme.typography.fontWeight.semiBold,
        color: theme.colors.text.primary,
        flex: 1,
    },
    timestamp: {
        fontSize: theme.typography.fontSize.xs,
        color: theme.colors.text.secondary,
        marginLeft: theme.spacing.sm,
    },
    messagePreview: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    lastMessage: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.text.secondary,
        flex: 1,
    },
    unreadMessage: {
        fontWeight: theme.typography.fontWeight.medium,
        color: theme.colors.text.primary,
    },
    badge: {
        backgroundColor: theme.colors.primary[500],
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.xs,
        marginLeft: theme.spacing.sm,
    },
    badgeText: {
        color: theme.colors.white,
        fontSize: theme.typography.fontSize.xs,
        fontWeight: theme.typography.fontWeight.bold,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: theme.spacing.xl,
    },
    emptyText: {
        fontSize: theme.typography.fontSize.lg,
        fontWeight: theme.typography.fontWeight.semiBold,
        color: theme.colors.text.primary,
        marginTop: theme.spacing.md,
    },
    emptySubtext: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.text.secondary,
        marginTop: theme.spacing.xs,
        textAlign: 'center',
    },
});

export default MessagesListScreen;

