/**
 * SyncErrorDetails
 *
 * Expandable accordion showing field-level errors from a failed sync attempt.
 * Rendered below the OfflineProductCard when syncStatus === 'error'.
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { SyncError } from '@/services/offline/offline-product.types';

interface SyncErrorDetailsProps {
    error: SyncError;
}

export function SyncErrorDetails({ error }: SyncErrorDetailsProps) {
    const [expanded, setExpanded] = useState(false);
    const hasFieldErrors =
        error.fieldErrors && Object.keys(error.fieldErrors).length > 0;

    return (
        <View style={styles.container}>
            {/* Summary row */}
            <TouchableOpacity
                style={styles.header}
                onPress={() => setExpanded((v) => !v)}
                activeOpacity={0.7}
            >
                <View style={styles.headerLeft}>
                    <Ionicons name="alert-circle" size={14} color="#DC2626" />
                    <Text style={styles.summaryText} numberOfLines={1}>
                        {error.message || 'Sync failed'}
                    </Text>
                    {error.code > 0 && (
                        <Text style={styles.codeChip}>HTTP {error.code}</Text>
                    )}
                </View>
                {hasFieldErrors && (
                    <Ionicons
                        name={expanded ? 'chevron-up' : 'chevron-down'}
                        size={14}
                        color="#DC2626"
                    />
                )}
            </TouchableOpacity>

            {/* Field errors */}
            {expanded && hasFieldErrors && (
                <View style={styles.fieldList}>
                    {Object.entries(error.fieldErrors!).map(([field, messages]) => (
                        <View key={field} style={styles.fieldRow}>
                            <Text style={styles.fieldName}>{field}:</Text>
                            <Text style={styles.fieldMessage}>{messages.join(', ')}</Text>
                        </View>
                    ))}
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginHorizontal: 8,
        marginBottom: 8,
        backgroundColor: '#FFF5F5',
        borderWidth: 1,
        borderColor: '#FECACA',
        borderRadius: 8,
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 10,
        gap: 6,
    },
    headerLeft: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    summaryText: {
        flex: 1,
        fontSize: 12,
        fontFamily: 'Inter',
        fontWeight: '500',
        color: '#DC2626',
    },
    codeChip: {
        fontSize: 10,
        fontFamily: 'Inter',
        fontWeight: '600',
        color: '#991B1B',
        backgroundColor: '#FECACA',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    fieldList: {
        borderTopWidth: 1,
        borderTopColor: '#FECACA',
        padding: 10,
        gap: 6,
    },
    fieldRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 4,
    },
    fieldName: {
        fontSize: 11,
        fontFamily: 'Inter',
        fontWeight: '700',
        color: '#991B1B',
        textTransform: 'capitalize',
    },
    fieldMessage: {
        fontSize: 11,
        fontFamily: 'Inter',
        color: '#7F1D1D',
        flex: 1,
    },
});
