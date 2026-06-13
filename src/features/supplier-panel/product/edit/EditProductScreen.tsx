import React, { useRef, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useToast } from '@/shared/components/Toast';
import { InputModal } from '@/shared/components';
import aiContentApi from '@/services/api/ai-content.api';
import { ProductFormLayout, ProductCardSet } from '../shared/components';
import { useEditProduct } from './hooks/useEditProduct';
import { handleUpdate } from './submission/product-update';
import styles from '../shared/styles/product-form.styles';
import type { EssentialCardRef } from '../add/components/EssentialCard';
import type { PriceStockCardRef } from '../add/components/PriceStockCard';
import type { PriceStockVariantsCardRef } from '../add/components/PriceStockVariantsCard';
import type { DetailsCardRef } from '../add/components/DetailsCard';
import type { SpecificationsCardRef } from '../add/components/SpecificationsCard';
import type { SettingsCardRef } from '../add/components/SettingsCard';

export default function EditProductScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const productId = params.id ? parseInt(params.id as string) : null;
    const sourceParam = Array.isArray(params.source) ? params.source[0] : params.source;
    const isFromDashboard = sourceParam === 'dashboard';

    const { showToast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // AI Generation state
    const [showAIModal, setShowAIModal] = useState(false);
    const [isGeneratingAI, setIsGeneratingAI] = useState(false);

    const navigateBack = () => {
        if (isFromDashboard) {
            router.replace('/(supplier-drawer)/(supplier-tabs)');
            return;
        }
        router.back();
    };

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

    // All data-fetching + card population via hook
    const {
        productData,
        productType,
        productName,
        setProductName,
        attributes,
        attributeFamilyId,
        isInitialLoading,
        fetchError,
        refreshAttributes,
    } = useEditProduct(productId, cardRefs);

    const handleSave = async () => {
        if (!productId) {
            showToast({ message: 'Invalid product ID', type: 'error' });
            return;
        }
        const success = await handleUpdate(
            productId,
            { refs: cardRefs, productType, productData, attributeFamilyId },
            setIsSubmitting,
            showToast
        );
        if (success) navigateBack();
    };

    const handleAIGeneration = async (prompt: string) => {
        setIsGeneratingAI(true);
        try {
            const generatedContent = await aiContentApi.generateProductContent(prompt);
            essentialCardRef.current?.updateFields({
                description: generatedContent.description,
                short_description: generatedContent.short_description,
            });
            showToast({ message: 'AI content generated successfully!', type: 'success' });
        } catch (error) {
            console.error('Error generating AI content:', error);
            showToast({ message: 'Failed to generate content. Please try again.', type: 'error' });
        } finally {
            setIsGeneratingAI(false);
        }
    };

    const renderBody = () => {
        if (fetchError) {
            return (
                <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle" size={24} color="#DC2626" />
                    <Text style={styles.errorText}>{fetchError}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={navigateBack}>
                        <Text style={styles.retryButtonText}>Go Back</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        if (isInitialLoading) {
            return (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#000000" />
                    <Text style={styles.loadingText}>Loading product...</Text>
                </View>
            );
        }

        return (
            <ProductCardSet
                refs={cardRefs}
                attributes={attributes}
                productName={productName}
                productType={productType}
                onNameChange={setProductName}
                onAttributesRefresh={refreshAttributes}
                onAIGenerateClick={() => setShowAIModal(true)}
            />
        );
    };

    const footer =
        !fetchError && !isInitialLoading ? (
            <View style={styles.actionButtonsFull}>
                <TouchableOpacity
                    style={[styles.saveButton, isSubmitting && styles.disabledButton]}
                    onPress={handleSave}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? (
                        <ActivityIndicator size="small" color="#F5F5F5" />
                    ) : (
                        <Text style={styles.saveButtonText}>Save</Text>
                    )}
                </TouchableOpacity>
            </View>
        ) : null;

    return (
        <>
            <ProductFormLayout
                title={isFromDashboard ? 'Dashboard' : 'Edit Product'}
                onBack={navigateBack}
                isSubmitting={isSubmitting}
                tabs={
                    !fetchError && !isInitialLoading
                        ? { productType, interactive: false }
                        : null
                }
                footer={footer}
            >
                {renderBody()}
            </ProductFormLayout>

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
        </>
    );
}
