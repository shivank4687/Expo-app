/**
 * OfflineProductCard
 *
 * Grid card for an offline-saved product. Mirrors the visual style of the
 * existing ProductCard component but shows sync status and offline actions.
 */

import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/features/supplier-panel/styles';
import { SyncStatusBadge } from './SyncStatusBadge';
import { SyncErrorDetails } from './SyncErrorDetails';
import type { OfflineProduct } from '@/services/offline/offline-product.types';

interface OfflineProductCardProps {
    product: OfflineProduct;
    onEdit: () => void;
    onDelete: () => void;
    onRetry: () => void;
    isRetrying?: boolean;
}

export function OfflineProductCard({
    product,
    onEdit,
    onDelete,
    onRetry,
    isRetrying = false,
}: OfflineProductCardProps) {
    const { syncStatus, productName, productType, errorDetails, createdAt, retryCount } = product;
    const isError = syncStatus === 'error';
    const isSyncing = syncStatus === 'syncing';
    const maxRetriesReached = retryCount >= 3;

    const formattedDate = createdAt
        ? new Date(createdAt).toLocaleDateString(undefined, {
            day: '2-digit',
            month: 'short',
        })
        : '';

    return (
        <View style={styles.wrapper}>
            <View style={[styles.card, isError && styles.cardError]}>
                {/* Thumbnail placeholder */}
                <View style={styles.imagePlaceholder}>
                    {product.localImagePaths && product.localImagePaths.length > 0 ? (
                        <Image source={{ uri: product.localImagePaths[0] }} style={styles.productImage} />
                    ) : (
                        <Ionicons
                            name={productType === 'configurable' ? 'copy-outline' : 'cube-outline'}
                            size={32}
                            color={COLORS.textSecondary}
                        />
                    )}
                    {isSyncing && (
                        <View style={styles.syncingOverlay}>
                            <ActivityIndicator size="small" color={COLORS.primary} />
                        </View>
                    )}
                </View>

                {/* Body */}
                <View style={styles.body}>
                    {/* Status badge */}
                    <SyncStatusBadge status={syncStatus} />

                    {/* Name */}
                    <Text style={styles.name} numberOfLines={2}>
                        {productName || 'Untitled Product'}
                    </Text>

                    {/* Type + Date */}
                    <View style={styles.meta}>
                        <Text style={styles.metaText}>
                            {productType === 'configurable' ? 'Variants' : 'Simple'}
                        </Text>
                        <Text style={styles.metaSep}>·</Text>
                        <Text style={styles.metaText}>{formattedDate}</Text>
                    </View>

                    {/* Actions */}
                    <View style={styles.actions}>
                        {/* Edit — disabled while syncing */}
                        <TouchableOpacity
                            style={[styles.actionBtn, isSyncing && styles.actionBtnDisabled]}
                            onPress={onEdit}
                            disabled={isSyncing}
                        >
                            <Ionicons name="create-outline" size={14} color={isSyncing ? COLORS.textSecondary : COLORS.primary} />
                            <Text style={[styles.actionBtnText, isSyncing && styles.actionBtnTextDisabled]}>
                                Edit
                            </Text>
                        </TouchableOpacity>

                        {/* Retry — only for errored products with retries remaining */}
                        {isError && !maxRetriesReached && (
                            <TouchableOpacity
                                style={[styles.actionBtn, styles.retryBtn, isRetrying && styles.actionBtnDisabled]}
                                onPress={onRetry}
                                disabled={isRetrying}
                            >
                                {isRetrying ? (
                                    <ActivityIndicator size={12} color="#FFFFFF" />
                                ) : (
                                    <Ionicons name="refresh-outline" size={14} color="#FFFFFF" />
                                )}
                                <Text style={styles.retryBtnText}>Retry</Text>
                            </TouchableOpacity>
                        )}

                        {/* Delete */}
                        <TouchableOpacity
                            style={[styles.actionBtn, styles.deleteBtn, isSyncing && styles.actionBtnDisabled]}
                            onPress={onDelete}
                            disabled={isSyncing}
                        >
                            <Ionicons name="trash-outline" size={14} color="#DC2626" />
                        </TouchableOpacity>
                    </View>

                    {/* Max retries notice */}
                    {isError && maxRetriesReached && (
                        <Text style={styles.giveUpText}>
                            Max retries reached. Edit and save again to retry.
                        </Text>
                    )}
                </View>
            </View>

            {/* Error details — shown below card when status is error */}
            {isError && errorDetails && (
                <SyncErrorDetails error={errorDetails} />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        width: '100%',
    },
    card: {
        backgroundColor: COLORS.white,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.border || '#E5E7EB',
        overflow: 'hidden',
        marginBottom: 4,
    },
    cardError: {
        borderColor: '#FECACA',
    },
    imagePlaceholder: {
        height: 100,
        backgroundColor: '#F9FAFB',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    productImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    syncingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255,255,255,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    body: {
        padding: 10,
        gap: 6,
    },
    name: {
        fontSize: 13,
        fontFamily: 'Inter',
        fontWeight: '600',
        color: COLORS.textPrimary,
        marginTop: 2,
    },
    meta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    metaText: {
        fontSize: 11,
        fontFamily: 'Inter',
        color: COLORS.textSecondary,
    },
    metaSep: {
        fontSize: 11,
        color: COLORS.textSecondary,
    },
    actions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 2,
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingVertical: 5,
        paddingHorizontal: 8,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: COLORS.primary,
        backgroundColor: COLORS.primaryLight || '#E8F5F4',
    },
    actionBtnDisabled: {
        opacity: 0.4,
    },
    actionBtnText: {
        fontSize: 11,
        fontFamily: 'Inter',
        fontWeight: '600',
        color: COLORS.primary,
    },
    actionBtnTextDisabled: {
        color: COLORS.textSecondary,
    },
    retryBtn: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    retryBtnText: {
        fontSize: 11,
        fontFamily: 'Inter',
        fontWeight: '600',
        color: '#FFFFFF',
    },
    deleteBtn: {
        marginLeft: 'auto',
        borderColor: '#FECACA',
        backgroundColor: '#FFF5F5',
        paddingHorizontal: 8,
    },
    giveUpText: {
        fontSize: 10,
        fontFamily: 'Inter',
        color: '#DC2626',
        fontStyle: 'italic',
    },
});
