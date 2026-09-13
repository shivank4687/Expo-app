import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { TopHeader } from '@/shared/components/TopHeader';
import { theme } from '@/theme';
import { SupplierItemSupportChatView } from '../components/SupplierItemSupportChatView';

export const SupplierItemSupportChatScreen: React.FC = () => {
    const router = useRouter();
    const params = useLocalSearchParams<{
        itemId: string;
        orderId: string;
        productName?: string;
        orderIncrement?: string;
        itemImage?: string;
    }>();

    const orderId = params.orderId ? parseInt(params.orderId) : 0;
    const itemId = params.itemId ? parseInt(params.itemId) : 0;
    const productName = params.productName || 'Support Chat';
    const orderIncrement = params.orderIncrement || '';
    const itemImage = params.itemImage;

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />
            <TopHeader
                title={orderIncrement ? `Order #${orderIncrement}` : 'Item Support'}
                onBack={() => router.back()}
                backgroundColor={theme.colors.background.default}
            />
            <SupplierItemSupportChatView
                orderId={orderId}
                itemId={itemId}
                productName={productName}
                itemImage={itemImage}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background.default,
    },
});
