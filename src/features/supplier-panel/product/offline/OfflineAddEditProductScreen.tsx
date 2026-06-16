/**
 * OfflineAddEditProductScreen
 *
 * Allows the supplier to create (or edit a pending-sync) product while offline.
 *
 * Key differences from AddProductScreen / EditProductScreen:
 *  - NO field-level validation on save — partial products are allowed offline
 *  - Saves to AsyncStorage (offline queue) instead of calling the API
 *  - Pre-populates cards from the stored formPayload when editing an existing
 *    offline product (localId param present in route)
 *  - Only one footer action: "Save Offline"
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ActivityIndicator,
    Keyboard,
    Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/features/supplier-panel/styles';
import { ProductFormLayout, ProductCardSet } from '../shared/components';
import { useProductAttributes } from '../shared/hooks/useProductAttributes';
import styles from '../shared/styles/product-form.styles';
import type { ProductType } from '../shared/types';
import type { EssentialCardRef } from '../add/components/EssentialCard';
import type { PriceStockCardRef } from '../add/components/PriceStockCard';
import type { PriceStockVariantsCardRef } from '../add/components/PriceStockVariantsCard';
import type { DetailsCardRef } from '../add/components/DetailsCard';
import type { SpecificationsCardRef } from '../add/components/SpecificationsCard';
import type { SettingsCardRef } from '../add/components/SettingsCard';
import { useToast } from '@/shared/components/Toast';
import {
    saveOfflineProduct,
    updateOfflineProduct,
    getOfflineProduct,
    generateLocalId,
} from '@/services/offline/offline-storage';
import { copyMediaToDocuments, copyVideoToDocuments, deleteLocalMedia } from '@/services/offline/offline-media';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { upsertOfflineProduct } from '@/store/slices/offlineProductsSlice';
import type { OfflineProduct } from '@/services/offline/offline-product.types';
import { StyleSheet } from 'react-native';

export default function OfflineAddEditProductScreen() {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const params = useLocalSearchParams();
    const isConnected = useAppSelector((state) => state.network.isConnected);

    // When editing an existing offline product, localId is passed as a param
    const existingLocalId = Array.isArray(params.localId)
        ? params.localId[0]
        : (params.localId as string | undefined);

    const isEditing = !!existingLocalId;

    const [activeTab, setActiveTab] = useState<ProductType>('simple');
    const [resetKey, setResetKey] = useState(0);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoadingExisting, setIsLoadingExisting] = useState(isEditing);
    const [productName, setProductName] = useState('');
    const [existingProduct, setExistingProduct] = useState<OfflineProduct | null>(null);

    const { showToast } = useToast();

    const {
        attributes,
        attributeFamilyId,
        isLoading: isLoadingAttributes,
        error: fetchError,
        fetchAttributes,
    } = useProductAttributes(activeTab);

    // Card refs
    const essentialCardRef = useRef<EssentialCardRef | null>(null);
    const priceStockCardRef = useRef<PriceStockCardRef | null>(null);
    const priceStockVariantsCardRef = useRef<PriceStockVariantsCardRef | null>(null);
    const detailsCardRef = useRef<DetailsCardRef | null>(null);
    const specificationsCardRef = useRef<SpecificationsCardRef | null>(null);
    const settingsCardRef = useRef<SettingsCardRef | null>(null);

    const cardRefs = {
        essentialCardRef,
        priceStockCardRef,
        priceStockVariantsCardRef,
        detailsCardRef,
        specificationsCardRef,
        settingsCardRef,
    };

    // Fetch attributes when product type changes
    useEffect(() => {
        fetchAttributes();
    }, [activeTab]);

    /**
     * When editing an existing offline product, load its stored formPayload
     * and populate all cards using updateFields().
     * We wait until cards are mounted (attributes loaded) before populating.
     */
    useEffect(() => {
        if (!isEditing || isLoadingAttributes) return;

        let cancelled = false;

        (async () => {
            const existing = await getOfflineProduct(existingLocalId!);
            if (!existing || cancelled) return;

            // If the tab is different from the stored product type, switch tabs
            // and let the attributes reload before setting setIsLoadingExisting(false).
            if (activeTab !== existing.productType) {
                setActiveTab(existing.productType);
                return;
            }

            setProductName(existing.productName);
            setExistingProduct(existing);
            setIsLoadingExisting(false);
        })();

        return () => { cancelled = true; };
    }, [isEditing, isLoadingAttributes, existingLocalId, activeTab]);

    /**
     * Populate card fields once loading has completed and the cards are mounted.
     * React guarantees refs are set by the time useEffect runs after render.
     */
    useEffect(() => {
        if (!isLoadingExisting && existingProduct) {
            const payload = {
                ...existingProduct.formPayload,
                images: existingProduct.localImagePaths || [],
                video: existingProduct.localVideoPath,
            };
            essentialCardRef.current?.updateFields(payload);
            if (existingProduct.productType === 'simple') {
                priceStockCardRef.current?.updateFields?.(payload);
            } else {
                priceStockVariantsCardRef.current?.updateFields?.(payload);
            }
            detailsCardRef.current?.updateFields?.(payload);
            specificationsCardRef.current?.updateFields?.(payload);
            settingsCardRef.current?.updateFields?.(payload);
        }
    }, [isLoadingExisting, existingProduct]);

    const handleTabSwitch = (tab: ProductType) => {
        if (tab === activeTab || isSaving) return;
        Keyboard.dismiss();
        setActiveTab(tab);
        setProductName('');
        setResetKey((prev) => prev + 1);
    };

    /**
     * Save the product locally — NO validation called.
     * Captures raw getData() from all cards, copies media, persists to AsyncStorage.
     */
    const handleSaveOffline = async () => {
        Keyboard.dismiss();
        setIsSaving(true);

        try {
            // Collect raw data from all cards (no validate() calls)
            const essentialData = essentialCardRef.current?.getData() ?? {};
            const priceStockData = activeTab === 'simple'
                ? (priceStockCardRef.current?.getData() ?? {})
                : (priceStockVariantsCardRef.current?.getData() ?? {});
            const detailsData = detailsCardRef.current?.getData() ?? {};
            const specificationsData = specificationsCardRef.current?.getData() ?? {};
            const settingsData = settingsCardRef.current?.getData() ?? {};

            const mergedPayload = {
                type: activeTab,
                attribute_family_id: attributeFamilyId || 1,
                product_locale: 'all',
                url_key: (essentialData as any).sku || '',
                status: 1,
                new: 1,
                featured: 0,
                guest_checkout: 1,
                visible_individually: 1,
                ...essentialData,
                ...priceStockData,
                ...detailsData,
                ...specificationsData,
                ...settingsData,
            };

            // Extract images/video from the payload (handled separately)
            const imageItems: any[] = mergedPayload.images ?? [];
            const videoItem: any = mergedPayload.video ?? null;

            // Strip from payload — stored as local paths
            delete mergedPayload.images;
            delete mergedPayload.video;

            // Copy media to permanent storage
            const [localImagePaths, localVideoPath] = await Promise.all([
                copyMediaToDocuments(imageItems),
                copyVideoToDocuments(videoItem),
            ]);

            const now = new Date().toISOString();
            const localId = existingLocalId ?? generateLocalId();

            const offlineProduct: OfflineProduct = {
                localId,
                syncStatus: 'pending',
                operation: 'create',
                productType: activeTab,
                productName: (mergedPayload.name as string) || 'Untitled Product',
                formPayload: mergedPayload,
                localImagePaths,
                localVideoPath,
                errorDetails: null,
                retryCount: 0,
                attributeFamilyId: attributeFamilyId || 1,
                createdAt: isEditing ? '' : now, // will be overwritten on edit
                updatedAt: now,
                syncedAt: null,
            };

            if (isEditing) {
                // Delete old media before updating with new ones to prevent leaks
                const existing = await getOfflineProduct(existingLocalId!);
                if (existing) {
                    await deleteLocalMedia([
                        ...existing.localImagePaths,
                        ...(existing.localVideoPath ? [existing.localVideoPath] : []),
                    ]);
                }
                // Preserve original createdAt
                offlineProduct.createdAt = existing?.createdAt ?? now;
                offlineProduct.retryCount = 0; // reset on edit
                offlineProduct.errorDetails = null;
                await updateOfflineProduct(localId, offlineProduct);
            } else {
                offlineProduct.createdAt = now;
                await saveOfflineProduct(offlineProduct);
            }

            // Update Redux in-memory state
            dispatch(upsertOfflineProduct(offlineProduct));

            showToast({
                message: isEditing
                    ? 'Offline product updated'
                    : 'Product saved offline. Will sync when connected.',
                type: 'success',
            });

            router.back();
        } catch (err) {
            console.error('[OfflineAddEdit] Save error:', err);
            showToast({ message: 'Failed to save product offline.', type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    const isLoading = isLoadingAttributes || isLoadingExisting;

    const renderBody = () => {
        if (fetchError) {
            const isOfflineMessage = !isConnected
                ? 'No offline cache found for product attributes. Please connect to the internet once to load product options.'
                : fetchError;

            return (
                <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle" size={24} color="#DC2626" />
                    <Text style={styles.errorText}>{isOfflineMessage}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={fetchAttributes}>
                        <Text style={styles.retryButtonText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        if (isLoading) {
            return (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#000000" />
                    <Text style={styles.loadingText}>
                        {isLoadingExisting ? 'Loading product...' : 'Loading...'}
                    </Text>
                </View>
            );
        }

        return (
            <ProductCardSet
                refs={cardRefs}
                attributes={attributes}
                productName={productName}
                productType={activeTab}
                resetKey={resetKey}
                onNameChange={setProductName}
                onAttributesRefresh={fetchAttributes}
            />
        );
    };

    const footer = !fetchError && !isLoading ? (
        <View style={localStyles.footerRow}>
            {/* Offline badge */}
            <View style={localStyles.offlineBadge}>
                <Ionicons name="cloud-offline-outline" size={14} color="#F59E0B" />
                <Text style={localStyles.offlineBadgeText}>Offline</Text>
            </View>

            <TouchableOpacity
                style={[localStyles.saveOfflineButton, isSaving && styles.disabledButton]}
                onPress={handleSaveOffline}
                disabled={isSaving}
            >
                {isSaving ? (
                    <ActivityIndicator size="small" color="#F5F5F5" />
                ) : (
                    <>
                        <Ionicons name="save-outline" size={16} color="#FFFFFF" />
                        <Text style={localStyles.saveOfflineButtonText}>Save Offline</Text>
                    </>
                )}
            </TouchableOpacity>
        </View>
    ) : null;

    return (
        <ProductFormLayout
            title={isEditing ? 'Edit Offline Product' : 'New Product (Offline)'}
            onBack={() => router.back()}
            isSubmitting={isSaving}
            tabs={
                !fetchError
                    ? {
                        productType: activeTab,
                        interactive: !isEditing, // lock tab when editing existing
                        onTabChange: handleTabSwitch,
                    }
                    : null
            }
            footer={footer}
        >
            {renderBody()}
        </ProductFormLayout>
    );
}

const localStyles = StyleSheet.create({
    footerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    offlineBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 6,
        backgroundColor: '#FEF3C7',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#F59E0B',
    },
    offlineBadgeText: {
        fontSize: 12,
        fontFamily: 'Inter',
        fontWeight: '600',
        color: '#92400E',
    },
    saveOfflineButton: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 14,
        backgroundColor: '#1A1A1A',
        borderRadius: 10,
        minHeight: 48,
    },
    saveOfflineButtonText: {
        fontFamily: 'Inter',
        fontWeight: '600',
        fontSize: 16,
        color: '#FFFFFF',
    },
});
