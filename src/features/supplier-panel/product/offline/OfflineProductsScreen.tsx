/**
 * OfflineProductsScreen
 *
 * Lists all offline-saved products and their sync state.
 * Mirrors the layout of ProductsScreen: fixed header, Add button,
 * and a 2-column grid FlatList.
 */

import React, { useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    Platform,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/features/supplier-panel/styles';
import { theme } from '@/theme';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { removeOfflineProduct, upsertOfflineProduct } from '@/store/slices/offlineProductsSlice';
import { deleteOfflineProduct, deleteLocalMedia, updateOfflineProduct } from '@/services/offline';
import { OfflineProductCard } from './components/OfflineProductCard';
import { useOfflineSync } from '../shared/hooks/useOfflineSync';
import type { OfflineProduct } from '@/services/offline/offline-product.types';

export function OfflineProductsScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const dispatch = useAppDispatch();

    const { products, isSyncing } = useAppSelector((state) => state.offlineProducts);
    const isConnected = useAppSelector((state) => state.network.isConnected);

    // Use the real sync trigger
    const { triggerSync } = useOfflineSync();

    // Sort: errors first, then pending, then by date desc
    const sorted = [...products].sort((a, b) => {
        const order = { error: 0, pending: 1, syncing: 2, synced: 3 };
        const diff = (order[a.syncStatus] ?? 9) - (order[b.syncStatus] ?? 9);
        if (diff !== 0) return diff;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    const pendingCount = products.filter(
        (p) => p.syncStatus === 'pending' || p.syncStatus === 'error'
    ).length;

    const handleDelete = useCallback(
        (product: OfflineProduct) => {
            Alert.alert(
                'Delete Offline Product',
                `Delete "${product.productName || 'this product'}"? This cannot be undone.`,
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Delete',
                        style: 'destructive',
                        onPress: async () => {
                            await deleteLocalMedia([
                                ...product.localImagePaths,
                                ...(product.localVideoPath ? [product.localVideoPath] : []),
                            ]);
                            await deleteOfflineProduct(product.localId);
                            dispatch(removeOfflineProduct(product.localId));
                        },
                    },
                ]
            );
        },
        [dispatch]
    );

    const handleSyncAll = () => {
        if (!isConnected) {
            Alert.alert('No Connection', 'Please connect to the internet to sync your products.');
            return;
        }
        triggerSync();
    };

    const renderEmpty = () => (
        <View style={styles.emptyContainer}>
            <Ionicons name="cloud-offline-outline" size={64} color={COLORS.textSecondary} />
            <Text style={styles.emptyTitle}>No Offline Products</Text>
            <Text style={styles.emptySubtext}>
                Products you save while offline will appear here and sync automatically when you reconnect.
            </Text>
        </View>
    );

    const renderItem = ({ item }: { item: OfflineProduct }) => (
        <View style={styles.cardWrapper}>
            <OfflineProductCard
                product={item}
                onEdit={() =>
                    router.push(
                        `/offline-edit-product?localId=${item.localId}` as any
                    )
                }
                onDelete={() => handleDelete(item)}
                onRetry={async () => {
                    const updatedProduct = {
                        ...item,
                        syncStatus: 'pending' as const,
                        retryCount: 0,
                        errorDetails: null,
                    };
                    await updateOfflineProduct(item.localId, updatedProduct);
                    dispatch(upsertOfflineProduct(updatedProduct));

                    if (isConnected) {
                        // Trigger sync queue processing asynchronously
                        setTimeout(() => {
                            triggerSync();
                        }, 50);
                    } else {
                        Alert.alert('Offline Mode', 'Retry queued. Product will sync when you are back online.');
                    }
                }}
                isRetrying={item.syncStatus === 'syncing'}
            />
        </View>
    );

    return (
        <View style={styles.root}>
            {/* Fixed header — mirrors ProductsScreen */}
            <View
                style={[
                    styles.fixedHeader,
                    { paddingTop: insets.top + (Platform.OS === 'android' ? 12 : 0) },
                ]}
            >
                <View style={styles.header}>
                    {/* Back */}
                    <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={20} color={COLORS.black} />
                    </TouchableOpacity>

                    <Text style={styles.title}>Offline Drafts</Text>

                    {/* Sync All */}
                    <TouchableOpacity
                        style={[
                            styles.syncAllBtn,
                            (!isConnected || isSyncing || pendingCount === 0) && styles.syncAllBtnDisabled,
                        ]}
                        onPress={handleSyncAll}
                        disabled={!isConnected || isSyncing || pendingCount === 0}
                    >
                        {isSyncing ? (
                            <ActivityIndicator size={14} color={COLORS.primary} />
                        ) : (
                            <Ionicons name="cloud-upload-outline" size={14} color={COLORS.primary} />
                        )}
                        <Text style={styles.syncAllText}>
                            {isSyncing ? 'Syncing…' : `Sync All${pendingCount > 0 ? ` (${pendingCount})` : ''}`}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Add offline product button */}
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => router.push('/offline-add-product' as any)}
                >
                    <Ionicons name="add" size={16} color={COLORS.black} />
                    <Text style={styles.addButtonText}>Add Offline Product</Text>
                </TouchableOpacity>
            </View>

            {/* Connection status bar */}
            {isConnected === false && (
                <View style={styles.offlineBar}>
                    <Ionicons name="cloud-offline-outline" size={13} color="#92400E" />
                    <Text style={styles.offlineBarText}>
                        You're offline — products will sync when you reconnect
                    </Text>
                </View>
            )}

            {/* Products grid */}
            <FlatList
                data={sorted}
                keyExtractor={(item) => item.localId}
                numColumns={2}
                columnWrapperStyle={sorted.length > 0 ? styles.row : undefined}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={renderEmpty}
                renderItem={renderItem}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    fixedHeader: {
        backgroundColor: COLORS.background,
        paddingHorizontal: 16,
        paddingBottom: theme.spacing.xs,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 16,
        height: 32,
    },
    backBtn: {
        width: 32,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        flex: 1,
        fontFamily: 'Inter',
        fontWeight: '700',
        fontSize: 22,
        lineHeight: 24,
        color: COLORS.black,
    },
    syncAllBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.primary,
        backgroundColor: COLORS.primaryLight || '#E8F5F4',
    },
    syncAllBtnDisabled: {
        opacity: 0.4,
    },
    syncAllText: {
        fontSize: 12,
        fontFamily: 'Inter',
        fontWeight: '600',
        color: COLORS.primary,
    },
    addButton: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        width: '100%',
        minHeight: 40,
        backgroundColor: COLORS.primaryLight || '#E8F5F4',
        borderWidth: 1,
        borderColor: COLORS.primary,
        borderRadius: 8,
        marginBottom: 8,
    },
    addButtonText: {
        fontFamily: 'Inter',
        fontWeight: '400',
        fontSize: 16,
        lineHeight: 18,
        color: COLORS.black,
    },
    offlineBar: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginHorizontal: 16,
        marginBottom: 8,
        padding: 10,
        backgroundColor: '#FEF3C7',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#F59E0B',
    },
    offlineBarText: {
        flex: 1,
        fontSize: 12,
        fontFamily: 'Inter',
        color: '#92400E',
    },
    listContent: {
        padding: 16,
        paddingTop: 8,
        flexGrow: 1,
    },
    row: {
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    cardWrapper: {
        width: '48%',
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 48,
        gap: 12,
    },
    emptyTitle: {
        fontFamily: 'Inter',
        fontWeight: '600',
        fontSize: 20,
        color: COLORS.textPrimary,
    },
    emptySubtext: {
        fontFamily: 'Inter',
        fontWeight: '400',
        fontSize: 14,
        color: COLORS.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
    },
});
