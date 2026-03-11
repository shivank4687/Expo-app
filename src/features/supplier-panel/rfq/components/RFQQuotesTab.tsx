import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    FlatList,
    ScrollView,
} from 'react-native';
import { ConfirmAlertModal } from '../../components';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../styles/colors';
import { SendQuoteModal } from './SendQuoteModal';
import { rejectRFQQuote } from '../api/rfq.api';

interface SupplierQuote {
    id: number;
    status: string;
    quantity: number | string;
    price_per_quantity: number | string;
    shipping_time: number | string;
    note?: string;
    is_sample?: boolean | number;
    sample_unit?: number | string | null;
    is_sample_price?: boolean | number;
    sample_price?: number | string | null;
    is_approve?: boolean;
}

interface CustomerQuote {
    customer_id?: number;
    quote_id?: number;
    status?: string;
    id?: number;
}

export interface RFQQuotesData {
    supplierQuotes: SupplierQuote[];
    supplierLastQuote?: SupplierQuote;
}

interface RFQQuotesTabProps {
    data: RFQQuotesData | null;
    loading: boolean;
    productId: number;
    customerQuote?: CustomerQuote;
    onRefresh: () => void;
}

export default function RFQQuotesTab({
    data,
    loading,
    productId,
    customerQuote,
    onRefresh,
}: RFQQuotesTabProps) {
    const [modalVisible, setModalVisible] = React.useState(false);
    const [rejecting, setRejecting] = React.useState(false);
    const [rejectConfirmVisible, setRejectConfirmVisible] = React.useState(false);

    if (loading) return <ActivityIndicator style={styles.loader} color="#00615E" />;

    const hasQuotes = data && data.supplierQuotes && data.supplierQuotes.length > 0;
    const lastQuote = data?.supplierLastQuote;
    const customerStatus = customerQuote?.status;

    // Web only shows Send Quote when customerQuote.status === 'new'
    const showSendQuote = customerStatus === 'new';
    const showQuoteAgain = hasQuotes;
    const showReject =
        hasQuotes && lastQuote?.status !== 'rejected' && !lastQuote?.is_approve;

    const customerId = customerQuote?.customer_id;
    const rfqQuoteId = customerQuote?.quote_id;

    const handleReject = () => {
        const sQuoteId = data?.supplierLastQuote?.id;
        const cQuoteId = customerQuote?.id;
        if (!sQuoteId || !cQuoteId) return;
        setRejectConfirmVisible(true);
    };

    const handleConfirmReject = async () => {
        const sQuoteId = data?.supplierLastQuote?.id;
        const cQuoteId = customerQuote?.id;
        if (!sQuoteId || !cQuoteId) return;
        setRejecting(true);
        try {
            await rejectRFQQuote(sQuoteId, cQuoteId);
            onRefresh();
        } catch {
            // handled silently; caller can add an error modal if needed
        } finally {
            setRejecting(false);
        }
    };

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
        >
            {hasQuotes ? (
                <FlatList
                    data={data!.supplierQuotes}
                    keyExtractor={(item) => String(item.id)}
                    contentContainerStyle={styles.listContainer}
                    scrollEnabled={false}
                    renderItem={({ item }) => (
                        <View style={styles.quoteCard}>
                            <View style={styles.quoteCardHeader}>
                                <Text style={styles.quoteCardTitle}>Quote #{item.id}</Text>
                                <View style={[
                                    styles.statusBadge,
                                    item.status === 'rejected' && styles.statusBadgeRejected,
                                ]}>
                                    <Text style={[
                                        styles.statusBadgeText,
                                        item.status === 'rejected' && styles.statusBadgeTextRejected,
                                    ]}>
                                        {item.status}
                                    </Text>
                                </View>
                            </View>
                            <View style={styles.quoteCardRow}>
                                <Text style={styles.label}>Quoted Quantity</Text>
                                <Text style={styles.value}>{item.quantity} Units</Text>
                            </View>
                            <View style={styles.quoteCardRow}>
                                <Text style={styles.label}>Quoted Price per unit</Text>
                                <Text style={styles.value}>${Number(item.price_per_quantity).toFixed(2)}</Text>
                            </View>
                            <View style={styles.quoteCardRow}>
                                <Text style={styles.label}>Samples</Text>
                                <Text style={styles.value}>
                                    {item.is_sample ? `Yes — ${item.sample_unit ?? 0} units` : 'No'}
                                </Text>
                            </View>
                            {!!item.is_sample && (
                                <View style={styles.quoteCardRow}>
                                    <Text style={styles.label}>Sample Charge</Text>
                                    <Text style={styles.value}>
                                        {item.is_sample_price
                                            ? `$${Number(item.sample_price ?? 0).toFixed(2)} / unit`
                                            : 'Not Applicable'}
                                    </Text>
                                </View>
                            )}
                            <View style={styles.quoteCardRow}>
                                <Text style={styles.label}>Shipping Time</Text>
                                <Text style={styles.value}>{item.shipping_time} days</Text>
                            </View>
                            <View style={[styles.quoteCardRow, styles.totalRow]}>
                                <Text style={[styles.label, styles.totalLabel]}>Total Quote Price</Text>
                                <Text style={[styles.value, styles.totalValue]}>
                                    ${(Number(item.price_per_quantity) * Number(item.quantity)).toFixed(2)}
                                </Text>
                            </View>
                            {item.note ? (
                                <View style={styles.noteRow}>
                                    <Text style={styles.label}>Note</Text>
                                    <Text style={styles.noteText}>{item.note}</Text>
                                </View>
                            ) : null}
                        </View>
                    )}
                />
            ) : (
                <Text style={styles.emptyText}>No quotes submitted yet.</Text>
            )}

            {/* Action Buttons */}
            <View style={styles.actionsRow}>
                {showSendQuote && (
                    <TouchableOpacity
                        style={styles.primaryBtn}
                        activeOpacity={0.85}
                        onPress={() => setModalVisible(true)}
                    >
                        <Ionicons name="send" size={16} color="#fff" style={{ marginRight: 6 }} />
                        <Text style={styles.primaryBtnText}>Send Quote</Text>
                    </TouchableOpacity>
                )}
                {showQuoteAgain && (
                    <TouchableOpacity
                        style={styles.primaryBtn}
                        activeOpacity={0.85}
                        onPress={() => setModalVisible(true)}
                    >
                        <Ionicons name="refresh" size={16} color="#fff" style={{ marginRight: 6 }} />
                        <Text style={styles.primaryBtnText}>Quote Again</Text>
                    </TouchableOpacity>
                )}
                {showReject && (
                    <TouchableOpacity
                        style={[styles.rejectBtn, rejecting && styles.btnDisabled]}
                        activeOpacity={0.85}
                        onPress={handleReject}
                        disabled={rejecting}
                    >
                        {rejecting ? (
                            <ActivityIndicator size="small" color="#E53935" />
                        ) : (
                            <>
                                <Ionicons name="close-circle-outline" size={16} color="#E53935" style={{ marginRight: 6 }} />
                                <Text style={styles.rejectBtnText}>Reject Quote</Text>
                            </>
                        )}
                    </TouchableOpacity>
                )}
            </View>

            {customerId && rfqQuoteId ? (
                <SendQuoteModal
                    visible={modalVisible}
                    onClose={() => setModalVisible(false)}
                    onSuccess={() => { setModalVisible(false); onRefresh(); }}
                    customerId={customerId}
                    quoteId={rfqQuoteId}
                    productId={productId}
                />
            ) : null}

            <ConfirmAlertModal
                visible={rejectConfirmVisible}
                onClose={() => setRejectConfirmVisible(false)}
                title="Reject Quote"
                message="Are you sure you want to reject this quote? This action cannot be undone."
                variant="danger"
                confirmAction={{
                    label: 'Reject',
                    style: 'destructive',
                    onPress: handleConfirmReject,
                }}
            />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    loader: { marginTop: 40 },
    container: { flex: 1 },
    content: { paddingBottom: 24 },
    listContainer: { paddingHorizontal: 16, paddingTop: 16, gap: 12 },
    emptyText: { textAlign: 'center', color: '#999', marginTop: 32, fontSize: 14 },
    label: { fontSize: 14, color: '#666', marginBottom: 4 },
    value: { fontSize: 14, color: '#000', fontWeight: '500' },

    quoteCard: {
        backgroundColor: COLORS.white,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#E9E9E9',
        overflow: 'hidden',
    },
    quoteCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
        backgroundColor: '#FAFAFA',
    },
    quoteCardTitle: { fontSize: 14, fontWeight: '700', color: '#111' },
    quoteCardRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#F5F5F5',
    },
    totalRow: {
        backgroundColor: '#F9FAFB',
    },
    totalLabel: { fontWeight: '700', color: '#333' },
    totalValue: { fontWeight: '700', color: '#00615E' },
    noteRow: { paddingHorizontal: 16, paddingVertical: 10 },
    noteText: { fontSize: 13, color: '#444', marginTop: 4, lineHeight: 18 },

    statusBadge: {
        backgroundColor: '#E8F5E9',
        borderRadius: 12,
        paddingHorizontal: 10,
        paddingVertical: 3,
    },
    statusBadgeRejected: { backgroundColor: '#FFEBEE' },
    statusBadgeText: { fontSize: 11, color: '#2E7D32', fontWeight: '600', textTransform: 'capitalize' },
    statusBadgeTextRejected: { color: '#C62828' },

    actionsRow: { padding: 16, paddingTop: 12, gap: 10 },
    primaryBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#00615E',
        borderRadius: 10,
        paddingVertical: 13,
    },
    primaryBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
    rejectBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: '#E53935',
        borderRadius: 10,
        paddingVertical: 12,
    },
    rejectBtnText: { color: '#E53935', fontSize: 15, fontWeight: '700' },
    btnDisabled: { opacity: 0.5 },
});
