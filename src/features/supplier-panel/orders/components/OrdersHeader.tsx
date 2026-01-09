import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../styles/colors';

/**
 * Orders Header Component
 * Displays "My Orders" title
 */
const OrdersHeader: React.FC = () => {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>My Orders</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 0,
        gap: 16,
        height: 24,
    },
    title: {
        fontFamily: 'Inter',
        fontWeight: '700',
        fontSize: 24,
        lineHeight: 24,
        color: COLORS.black,
    },
});

export default OrdersHeader;
