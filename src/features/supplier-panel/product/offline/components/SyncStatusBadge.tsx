/**
 * SyncStatusBadge
 *
 * A small pill badge showing the current sync status of an offline product.
 * Used in OfflineProductCard.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { SyncStatus } from '@/services/offline/offline-product.types';

interface SyncStatusBadgeProps {
    status: SyncStatus;
}

const CONFIG: Record<SyncStatus, { bg: string; border: string; text: string; icon: any; label: string }> = {
    pending: {
        bg: '#FEF3C7',
        border: '#F59E0B',
        text: '#92400E',
        icon: 'time-outline',
        label: 'Pending Sync',
    },
    syncing: {
        bg: '#EFF6FF',
        border: '#3B82F6',
        text: '#1D4ED8',
        icon: 'sync-outline',
        label: 'Syncing…',
    },
    synced: {
        bg: '#D1FAE5',
        border: '#10B981',
        text: '#065F46',
        icon: 'checkmark-circle-outline',
        label: 'Synced',
    },
    error: {
        bg: '#FEE2E2',
        border: '#EF4444',
        text: '#991B1B',
        icon: 'alert-circle-outline',
        label: 'Sync Error',
    },
};

export function SyncStatusBadge({ status }: SyncStatusBadgeProps) {
    const cfg = CONFIG[status];

    return (
        <View
            style={[
                styles.badge,
                { backgroundColor: cfg.bg, borderColor: cfg.border },
            ]}
        >
            <Ionicons name={cfg.icon} size={11} color={cfg.text} />
            <Text style={[styles.label, { color: cfg.text }]}>{cfg.label}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
        borderWidth: 1,
        alignSelf: 'flex-start',
    },
    label: {
        fontSize: 10,
        fontFamily: 'Inter',
        fontWeight: '600',
        letterSpacing: 0.2,
    },
});
