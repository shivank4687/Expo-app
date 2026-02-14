import { supplierTheme } from '@/theme';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface TransactionCardProps {
    transaction: {
        id: string;
        transaction_id: string;
        comment: string;
        amount: string;
        date: string;
    };
}

export function TransactionCard({ transaction }: TransactionCardProps) {
    return (
        <View style={styles.card}>
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Text style={styles.transactionId}>#{transaction.transaction_id}</Text>
                    <Text style={styles.date}>{transaction.date}</Text>
                </View>
                <Text style={styles.amount}>{transaction.amount}</Text>
            </View>
            {transaction.comment ? (
                <Text style={styles.comment}>{transaction.comment}</Text>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E9E3D3',
        borderRadius: 8,
        padding: 12,
        gap: 8,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    headerLeft: {
        flex: 1,
        gap: 4,
    },
    transactionId: {
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '500',
        fontSize: 16,
        lineHeight: 19,
        color: '#000000',
    },
    date: {
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '500',
        fontSize: 14,
        lineHeight: 20,
        color: '#0A292D',
    },
    amount: {
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '700',
        fontSize: 16,
        lineHeight: 19,
        color: '#00615E',
    },
    comment: {
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '500',
        fontSize: 14,
        lineHeight: 20,
        color: '#0A292D',
    },
});
