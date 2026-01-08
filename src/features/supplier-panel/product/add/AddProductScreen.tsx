import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/features/supplier-panel/styles';
import { EssentialCard, PriceStockCard, PriceStockVariantsCard, DetailsCard, SettingsCard } from './components';
import { productAttributesApi, ProductAttribute } from './api/product-attributes.api';
import productsApi from '@/services/api/products.api';
import { EssentialCardRef } from './components/EssentialCard';
import { PriceStockCardRef } from './components/PriceStockCard';
import { PriceStockVariantsCardRef } from './components/PriceStockVariantsCard';
import { DetailsCardRef } from './components/DetailsCard';
import { SettingsCardRef } from './components/SettingsCard';
import { handlePublish, handleSaveDraft } from './submission/product-submission';
import aiContentApi from '@/services/api/ai-content.api';
import { InputModal } from '@/shared/components';
import { useToast } from '@/shared/components/Toast';

type TabType = 'simple' | 'configurable';

export default function AddProductScreen() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<TabType>('simple');
    const [resetKey, setResetKey] = useState(0);
    const [attributes, setAttributes] = useState<ProductAttribute[]>([]);
    const [attributeFamilyId, setAttributeFamilyId] = useState<number | null>(null);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [productName, setProductName] = useState('');

    // AI Generation state
    const [showAIModal, setShowAIModal] = useState(false);
    const [isGeneratingAI, setIsGeneratingAI] = useState(false);

    // Toast notifications
    const { showToast } = useToast();

    // Card Refs
    const essentialCardRef = useRef<EssentialCardRef>(null);
    const priceStockCardRef = useRef<PriceStockCardRef>(null);
    const priceStockVariantsCardRef = useRef<PriceStockVariantsCardRef>(null);
    const detailsCardRef = useRef<DetailsCardRef>(null);
    const settingsCardRef = useRef<SettingsCardRef>(null);

    // Reset state when screen is focused (e.g. when entering the screen anew)
    useFocusEffect(
        React.useCallback(() => {
            setActiveTab('simple');
            setResetKey(prev => prev + 1); // Force remount of all components
        }, [])
    );

    // Fetch product attributes on mount
    const fetchAttributes = async () => {
        try {
            setIsInitialLoading(true);
            setFetchError(null);
            const data = await productAttributesApi.getProductAttributes('simple');
            setAttributes(data.attributes);
            setAttributeFamilyId(data.attribute_family.id);
        } catch (err) {
            console.error('Error fetching product attributes:', err);
            setFetchError('Failed to load product attributes. Please try again.');
        } finally {
            setIsInitialLoading(false);
        }
    };

    React.useEffect(() => {
        fetchAttributes();
    }, []);

    const handleSaveDraftLocal = () => {
        handleSaveDraft({
            refs: {
                essentialCardRef,
                priceStockCardRef,
                priceStockVariantsCardRef,
                detailsCardRef,
                settingsCardRef,
            },
            activeTab,
            attributeFamilyId,
            attributes,
        });
    };

    const handlePublishLocal = async () => {
        await handlePublish(
            {
                refs: {
                    essentialCardRef,
                    priceStockCardRef,
                    priceStockVariantsCardRef,
                    detailsCardRef,
                    settingsCardRef,
                },
                activeTab,
                attributeFamilyId,
                attributes,
            },
            setIsSubmitting
        );
    };

    // Handle AI Content Generation
    const handleAIGeneration = async (prompt: string) => {
        setIsGeneratingAI(true);
        try {
            const generatedContent = await aiContentApi.generateProductContent(prompt);

            // Update EssentialCard with generated content
            if (essentialCardRef.current) {
                essentialCardRef.current.updateFields({
                    description: generatedContent.description,
                    short_description: generatedContent.short_description,
                });
            }

            // Show success toast
            showToast({
                message: 'AI content generated successfully!',
                type: 'success',
            });
        } catch (error) {
            console.error('Error generating AI content:', error);

            // Show error toast
            showToast({
                message: 'Failed to generate content. Please try again.',
                type: 'error',
            });
        } finally {
            setIsGeneratingAI(false);
        }
    };

    const renderContent = () => {
        if (fetchError) {
            return (
                <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle" size={24} color="#DC2626" />
                    <Text style={styles.errorText}>{fetchError}</Text>
                    <TouchableOpacity
                        style={styles.retryButton}
                        onPress={fetchAttributes}
                    >
                        <Text style={styles.retryButtonText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        return (
            <>
                {/* Essential Card */}
                <EssentialCard
                    ref={essentialCardRef}
                    key={`essential-${resetKey}`}
                    attributes={attributes}
                    onNameChange={setProductName}
                    onAttributesRefresh={fetchAttributes}
                    onAIGenerateClick={() => setShowAIModal(true)}
                />

                {/* Price & Stock Card - Conditional based on tab */}
                {activeTab === 'simple' ? (
                    <PriceStockCard
                        ref={priceStockCardRef}
                        key={`price-stock-${resetKey}`}
                        productName={productName}
                        attributes={attributes}
                    />
                ) : (
                    <PriceStockVariantsCard
                        ref={priceStockVariantsCardRef}
                        key={`price-stock-variants-${resetKey}`}
                    />
                )}

                {/* Details Card */}
                <DetailsCard
                    ref={detailsCardRef}
                    key={`details-${resetKey}`}
                    attributes={attributes}
                    onAttributesRefresh={fetchAttributes}
                />

                {/* Settings Card */}
                <SettingsCard
                    ref={settingsCardRef}
                    key={`settings-${resetKey}`}
                />
            </>
        );
    };

    return (
        <View style={styles.container}>
            {/* Fixed Header */}
            <View style={styles.header}>
                <View style={styles.headerContent}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => router.back()}
                        activeOpacity={0.7}
                        disabled={isSubmitting}
                    >
                        <Ionicons name="arrow-back" size={16} color="#000000" />
                    </TouchableOpacity>

                    <View style={styles.titleContainer}>
                        <Text style={styles.headerTitle}>New Product</Text>
                    </View>
                </View>
            </View>

            {/* Content */}
            <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
                scrollEnabled={!isSubmitting}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
            >
                {/* Tabs */}
                {!fetchError && (
                    <View style={styles.tabsContainer}>
                        <TouchableOpacity
                            style={[styles.tab, activeTab === 'simple' && styles.tabActive]}
                            onPress={() => setActiveTab('simple')}
                            activeOpacity={0.7}
                            disabled={isSubmitting}
                        >
                            <Text style={[styles.tabText, activeTab === 'simple' && styles.tabTextActive]}>Simple Product</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.tab, activeTab === 'configurable' && styles.tabActive]}
                            onPress={() => setActiveTab('configurable')}
                            activeOpacity={0.7}
                            disabled={isSubmitting}
                        >
                            <Text style={[styles.tabText, activeTab === 'configurable' && styles.tabTextActive]}>Product with Variants</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Product Name Placeholder/Current */}
                {/* {!isInitialLoading && !fetchError && (
                    <Text style={styles.productName}>Talavera Mugs</Text>
                )} */}

                {renderContent()}

                {/* Action Buttons */}
                {!fetchError && (
                    <View style={styles.actionButtons}>
                        <TouchableOpacity
                            style={[styles.discardButton, isSubmitting && styles.disabledButton]}
                            onPress={handleSaveDraftLocal}
                            disabled={isSubmitting}
                        >
                            <Text style={styles.actionButtonText}>Save Draft</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.previewButton, isSubmitting && styles.disabledButton]}
                            disabled={isSubmitting}
                        >
                            <Text style={styles.actionButtonText}>Preview</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.publishButton, isSubmitting && styles.disabledButton]}
                            onPress={handlePublishLocal}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <ActivityIndicator size="small" color="#F5F5F5" />
                            ) : (
                                <Text style={styles.publishButtonText}>Publish</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>

            {/* Submitting Overlay - Optional but good for UX if needed */}
            {isSubmitting && (
                <View style={styles.submittingOverlay}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            )}

            {/* AI Content Generation Modal */}
            <InputModal
                visible={showAIModal}
                onClose={() => setShowAIModal(false)}
                onSubmit={handleAIGeneration}
                title="Generate AI Content"
                placeholder="Enter product name or brief description..."
                submitButtonText="Generate"
                isLoading={isGeneratingAI}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        backgroundColor: COLORS.background,
        paddingTop: 60,
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        height: 32,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
        width: 32,
        height: 32,
        backgroundColor: COLORS.white,
        borderRadius: 8,
        justifyContent: 'center',
    },
    titleContainer: {
        flexDirection: 'column',
        alignItems: 'flex-start',
        padding: 0,
        gap: 4,
        flex: 1,
    },
    headerTitle: {
        fontFamily: 'Inter',
        fontWeight: '400',
        fontSize: 16,
        color: '#000000',
    },
    content: {
        padding: 16,
        gap: 16,
    },
    tabsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 4,
        height: 42,
        backgroundColor: COLORS.white,
        borderRadius: 8,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 10,
        height: 34,
        borderRadius: 4,
    },
    tabActive: {
        backgroundColor: COLORS.primaryLight,
        borderWidth: 1,
        borderColor: COLORS.primary,
    },
    tabText: {
        fontFamily: 'Inter',
        fontWeight: '400',
        fontSize: 14,

        color: '#000000',

    },
    tabTextActive: {
        color: '#000000',
    },
    productName: {
        fontFamily: 'Inter',
        fontWeight: '700',
        fontSize: 24,
        color: '#000000',
        marginBottom: 8,
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 8,
        width: '100%',
        marginTop: 16,
        marginBottom: 32,
    },
    discardButton: {
        flex: 1,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: COLORS.primary,
        borderRadius: 8,
    },
    previewButton: {
        flex: 1,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: COLORS.primary,
        borderRadius: 8,
    },
    publishButton: {
        flex: 1,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.primary,
        borderRadius: 8,
    },
    actionButtonText: {
        fontFamily: 'Inter',
        fontWeight: '400',
        fontSize: 14,
        color: '#000000',
    },
    publishButtonText: {
        fontFamily: 'Inter',
        fontWeight: '400',
        fontSize: 14,
        color: '#F5F5F5',
    },
    loadingContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
        gap: 16,
        backgroundColor: COLORS.white,
        borderRadius: 16,
    },
    loadingText: {
        fontFamily: 'Inter',
        fontSize: 16,
        color: '#666666',
        textAlign: 'center',
    },
    errorContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        gap: 12,
        backgroundColor: '#FEE2E2',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#FCA5A5',
    },
    errorText: {
        fontFamily: 'Inter',
        fontSize: 14,
        color: '#DC2626',
        textAlign: 'center',
    },
    retryButton: {
        paddingHorizontal: 16,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.primary,
        borderRadius: 8,
        marginTop: 8,
    },
    retryButtonText: {
        fontFamily: 'Inter',
        fontSize: 14,
        color: '#FFFFFF',
    },
    disabledButton: {
        opacity: 0.6,
    },
    submittingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
    },
});
