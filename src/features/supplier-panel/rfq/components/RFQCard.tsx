import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { QuoteItem } from '../api/rfq.api';

interface RFQCardProps {
    item: QuoteItem;
}

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
    new: { bg: '#EEF6FF', text: '#1D6FA4', border: '#90C8F0' },
    pending: { bg: '#FFF8E1', text: '#A06C00', border: '#F0C83A' },
    confirmed: { bg: '#E0FFFE', text: '#00615E', border: '#00615E' },
    answered: { bg: '#F3EEFF', text: '#6B3FA0', border: '#B393D3' },
    rejected: { bg: '#FFE9E9', text: '#B00020', border: '#EDA2A2' },
    expired: { bg: '#F5F5F5', text: '#666666', border: '#CCCCCC' },
};

function formatDateTime(dateStr: string): string {
    const date = new Date(dateStr);
    const datePart = date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    const timePart = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    return `${datePart}, ${timePart}`;
}

export function RFQCard({ item }: RFQCardProps) {
    const router = useRouter();
    const statusKey = item.status?.toLowerCase() ?? 'new';
    const colors = STATUS_COLORS[statusKey] ?? STATUS_COLORS['new'];
    const label = item.status
        ? item.status.charAt(0).toUpperCase() + item.status.slice(1)
        : 'New';

    const handlePress = () => {
        router.push({
            pathname: '/(supplier-drawer)/rfq-details' as any,
            params: {
                quoteId: String(item.quote_id),
                productId: String(item.product_id),
                productName: item.product_name,
            },
        });
    };

    return (
        <TouchableOpacity style={styles.card} onPress={handlePress} activeOpacity={0.85}>
            {/* Left: product image or placeholder */}
            <View style={styles.imageContainer}>
                {item.image_url ? (
                    <Image
                        source={{ uri: item.image_url }}
                        style={styles.image}
                        resizeMode="cover"
                    />
                ) : (
                    <View style={styles.imagePlaceholder}>
                        <Ionicons name="cube-outline" size={28} color="#AAAAAA" />
                    </View>
                )}
            </View>

            {/* Right: details */}
            <View style={styles.details}>
                <View style={styles.headerRow}>
                    <Text style={styles.productName} numberOfLines={1}>
                        {item.product_name}
                    </Text>
                    {/* Status badge */}
                    {/* <View style={[styles.badge, { backgroundColor: colors.bg, borderColor: colors.border }]}>
                        <Text style={[styles.badgeText, { color: colors.text }]}>{label}</Text>
                    </View> */}
                </View>

                <Text style={styles.customerName} numberOfLines={1}>
                    <Text style={styles.metaLabel}>Customer: </Text>
                    {item.customer_name}
                </Text>

                <View style={styles.footerRow}>
                    <View style={styles.metaItem}>
                        <Ionicons name="layers-outline" size={13} color="#666666" />
                        <Text style={styles.metaText}>Qty: {item.quantity}</Text>
                    </View>
                    <View style={styles.metaItem}>
                        <Ionicons name="calendar-outline" size={13} color="#666666" />
                        <Text style={styles.metaText}>{formatDateTime(item.created_at)}</Text>
                    </View>
                    {item.has_file && (
                        <View style={styles.metaItem}>
                            <Ionicons name="attach-outline" size={13} color="#666666" />
                            <Text style={styles.metaText}>Attachment</Text>
                        </View>
                    )}
                </View>

                <Text style={styles.quoteId}>Quote #{item.quote_id}</Text>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        backgroundColor: '#FCF7EA',
        borderWidth: 1,
        borderColor: '#E9E3D3',
        borderRadius: 16,
        padding: 12,
        marginHorizontal: 16,
        marginVertical: 6,
        gap: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
        overflow: 'hidden',
    },
    imageContainer: {
        width: 64,
        height: 64,
        borderRadius: 8,
        overflow: 'hidden',
        flexShrink: 0,
    },
    image: {
        width: 64,
        height: 64,
    },
    imagePlaceholder: {
        width: 64,
        height: 64,
        backgroundColor: '#EDE8D9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    details: {
        flex: 1,
        gap: 4,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 8,
    },
    productName: {
        flex: 1,
        fontFamily: 'Inter',
        fontWeight: '600',
        fontSize: 14,
        color: '#000000',
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 20,
        borderWidth: 1,
        flexShrink: 0,
    },
    badgeText: {
        fontFamily: 'Inter',
        fontWeight: '600',
        fontSize: 11,
    },
    customerName: {
        fontFamily: 'Inter',
        fontSize: 13,
        color: '#0A292D',
    },
    metaLabel: {
        fontWeight: '500',
        color: '#0A292D',
    },
    footerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 10,
        marginTop: 2,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
    },
    metaText: {
        fontFamily: 'Inter',
        fontSize: 12,
        color: '#0A292D',
    },
    quoteId: {
        fontFamily: 'Inter',
        fontSize: 11,
        color: '#A09880',
        marginTop: 2,
    },
});
