import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { COLORS } from '../../styles/colors';

interface CustomerQuote {
    quantity?: number | string;
    price_per_quantity?: number | string;
    description?: string;
    is_sample?: boolean;
}

interface Quote {
    quote_title?: string;
}

export interface RFQDetailsData {
    quote?: Quote;
    customerQuote?: CustomerQuote;
    productName?: string;
}

interface RFQDetailsTabProps {
    data: RFQDetailsData | null;
    loading: boolean;
}

export default function RFQDetailsTab({ data, loading }: RFQDetailsTabProps) {
    if (loading) return <ActivityIndicator style={styles.loader} color="#00615E" />;
    if (!data) return <Text style={styles.errorText}>Details not found.</Text>;

    const qty = data.customerQuote?.quantity;
    const pricePerUnit = data.customerQuote?.price_per_quantity;
    const expectedTotal =
        qty && pricePerUnit ? (Number(qty) * Number(pricePerUnit)).toFixed(2) : null;
    const isSample = data.customerQuote?.is_sample;

    return (
        <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>RFQ Details</Text>
            <View style={styles.detailCard}>
                {data.quote?.quote_title ? (
                    <View style={styles.detailRow}>
                        <Text style={styles.label}>RFQ Title</Text>
                        <Text style={styles.value}>{data.quote.quote_title}</Text>
                    </View>
                ) : null}
                <View style={styles.detailRow}>
                    <Text style={styles.label}>Product Name</Text>
                    <Text style={styles.value}>{data.productName}</Text>
                </View>
                {data.customerQuote?.description ? (
                    <View style={styles.detailRow}>
                        <Text style={styles.label}>Description</Text>
                        <Text style={styles.value}>{data.customerQuote.description}</Text>
                    </View>
                ) : null}
                <View style={styles.detailRow}>
                    <Text style={styles.label}>Quantity</Text>
                    <Text style={styles.value}>{qty} Units</Text>
                </View>
                <View style={styles.detailRow}>
                    <Text style={styles.label}>Expected Price</Text>
                    <Text style={styles.value}>${Number(pricePerUnit).toFixed(2)} Per Unit</Text>
                </View>
                {expectedTotal ? (
                    <View style={styles.detailRow}>
                        <Text style={styles.label}>Expected Total</Text>
                        <Text style={styles.value}>${expectedTotal}</Text>
                    </View>
                ) : null}
                <View style={[styles.detailRow, styles.detailRowLast]}>
                    <Text style={styles.label}>Requires Samples</Text>
                    <Text style={styles.value}>{isSample ? 'Yes' : 'No'}</Text>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    loader: { marginTop: 40 },
    errorText: { marginTop: 40, textAlign: 'center', color: '#666' },
    tabContent: { padding: 16 },
    sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 12 },
    detailCard: {
        backgroundColor: COLORS.white,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#E9E9E9',
        overflow: 'hidden',
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E9E9E9',
    },
    label: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
        flex: 1,
        marginRight: 8,
    },
    value: {
        fontSize: 14,
        color: '#000',
        fontWeight: '500',
        flex: 1.5,
        textAlign: 'right',
    },
    detailRowLast: {
        borderBottomWidth: 0,
    },
});
