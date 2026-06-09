import React from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { TopHeader } from '@/shared/components/TopHeader';
import { theme } from '@/theme';
import { ItemSupportChatView } from '../components/ItemSupportChatView';

export const ItemSupportChatScreen: React.FC = () => {
    const router = useRouter();
    const params = useLocalSearchParams<{
        itemId: string;
        orderId: string;
        productName: string;
        orderIncrement: string;
    }>();

    const orderId = params.orderId ? parseInt(params.orderId) : 0;
    const itemId = params.itemId ? parseInt(params.itemId) : 0;
    const productName = params.productName || 'Support Chat';
    const orderIncrement = params.orderIncrement || '';

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={0}
        >
            <Stack.Screen options={{ headerShown: false }} />
            <TopHeader
                title={orderIncrement ? `Order #${orderIncrement}` : 'Item Support'}
                onBack={() => router.back()}
                backgroundColor={theme.colors.background.default}
            />
            <ItemSupportChatView
                orderId={orderId}
                itemId={itemId}
                productName={productName}
            />
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background.default,
    },
});
