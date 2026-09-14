import React, { useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    Platform,
} from 'react-native';
import { StickyBottomContainer } from '@/shared/components/StickyBottomContainer';
import { ChatMessageBubble, ChatMessageInput } from '@/shared/components/chatbox';
import { RFQMessage } from '../api/rfq.api';

interface RFQMessagesTabProps {
    messages: RFQMessage[];
    loading: boolean;
    sending: boolean;
    hasRequiredIds: boolean;
    onSend: (text: string) => Promise<void>;
}

export default function RFQMessagesTab({
    messages,
    loading,
    sending,
    hasRequiredIds,
    onSend,
}: RFQMessagesTabProps) {
    const scrollRef = useRef<ScrollView>(null);

    if (!hasRequiredIds && loading) {
        return <ActivityIndicator style={styles.loader} color="#00615E" />;
    }

    if (!hasRequiredIds) {
        return (
            <Text style={styles.errorText}>
                Please submit a quote first to send messages.
            </Text>
        );
    }

    if (loading) {
        return <ActivityIndicator style={styles.loader} color="#00615E" />;
    }

    return (
        <View style={styles.container}>
            <ScrollView
                ref={scrollRef}
                style={styles.messagesScroll}
                contentContainerStyle={styles.messagesContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
            >
                {messages.length === 0 ? (
                    <Text style={styles.emptyText}>No messages yet. Start the conversation!</Text>
                ) : (
                    messages.map((item) => {
                        const isSupplier = item.customer_id === null;
                        return (
                            <ChatMessageBubble
                                key={String(item.id)}
                                message={item.message}
                                senderType={isSupplier ? 'supplier' : 'customer'}
                                senderName={isSupplier ? 'You' : 'Customer'}
                                timestamp={item.created_at || new Date().toISOString()}
                            />
                        );
                    })
                )}
            </ScrollView>
            <StickyBottomContainer minBottomPadding={Platform.OS === 'ios' ? 24 : 16} style={styles.inputContainer}>
                <ChatMessageInput onSend={onSend} disabled={sending} hideAttachment={true} />
            </StickyBottomContainer>
        </View>
    );
}

const styles = StyleSheet.create({
    loader: { marginTop: 40 },
    errorText: { marginTop: 40, textAlign: 'center', color: '#666', paddingHorizontal: 24 },
    container: { flex: 1 },
    messagesScroll: { flex: 1 },
    messagesContent: {
        flexDirection: 'column',
        gap: 4,
        padding: 16,
        paddingBottom: 8,
    },
    emptyText: { textAlign: 'center', color: '#999', marginTop: 32, fontSize: 14 },
    inputContainer: {
        paddingTop: 8,
    },
});
