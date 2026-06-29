import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Keyboard } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/features/supplier-panel/styles';
import { EssentialCardRef } from './components/EssentialCard';
import { PriceStockCardRef } from './components/PriceStockCard';
import { PriceStockVariantsCardRef } from './components/PriceStockVariantsCard';
import { DetailsCardRef } from './components/DetailsCard';
import { SpecificationsCardRef } from './components/SpecificationsCard';
import { SettingsCardRef } from './components/SettingsCard';
import { handlePublish } from './submission/product-submission';
import aiContentApi from '@/services/api/ai-content.api';
import { InputModal } from '@/shared/components';
import { useToast } from '@/shared/components/Toast';
import { ProductFormLayout, ProductCardSet } from '../shared/components';
import { useProductAttributes } from '../shared/hooks/useProductAttributes';
import styles from '../shared/styles/product-form.styles';
import type { ProductType } from '../shared/types';

import { useTranslation } from 'react-i18next';

export default function AddProductScreen() {
    const router = useRouter();
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<ProductType>('simple');
    const [resetKey, setResetKey] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [productName, setProductName] = useState('');

    // AI Generation state
    const [showAIModal, setShowAIModal] = useState(false);
    const [isGeneratingAI, setIsGeneratingAI] = useState(false);

    const { showToast } = useToast();

    // Attributes (shared hook)
    const {
        attributes,
        attributeFamilyId,
        isLoading: isInitialLoading,
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

    // Reset state when screen is focused (entering anew)
    useFocusEffect(
        React.useCallback(() => {
            setActiveTab('simple');
            setProductName('');
            setResetKey(prev => prev + 1);
        }, [])
    );

    // Fetch attributes whenever the active tab changes
    useEffect(() => {
        fetchAttributes();
    }, [activeTab]);

    const handleTabSwitch = (tab: ProductType) => {
        if (tab === activeTab || isSubmitting) return;
        Keyboard.dismiss();
        setActiveTab(tab);
        setProductName('');
        setResetKey(prev => prev + 1);
    };

    const handleSubmit = async (status: number = 1) => {
        const success = await handlePublish(
            {
                refs: cardRefs,
                activeTab,
                attributeFamilyId,
                attributes,
            },
            setIsSubmitting,
            showToast,
            status
        );
        if (success) {
            router.replace('/(supplier-drawer)/(supplier-tabs)/products');
        }
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
                    <TouchableOpacity style={styles.retryButton} onPress={fetchAttributes}>
                        <Text style={styles.retryButtonText}>Retry</Text>
                    </TouchableOpacity>
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
                onAIGenerateClick={() => setShowAIModal(true)}
            />
        );
    };

    const footer = !fetchError ? (
        <View style={styles.actionButtonsRow}>
            <TouchableOpacity
                style={[styles.draftButton, isSubmitting && styles.disabledButton]}
                onPress={() => handleSubmit(0)}
                disabled={isSubmitting}
            >
                <Text style={styles.draftButtonText}>{t('supplierPanel.saveDraft')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.publishButton, isSubmitting && styles.disabledButton]}
                onPress={() => handleSubmit(1)}
                disabled={isSubmitting}
            >
                {isSubmitting ? (
                    <ActivityIndicator size="small" color="#F5F5F5" />
                ) : (
                    <Text style={styles.publishButtonText}>{t('supplierPanel.publish')}</Text>
                )}
            </TouchableOpacity>
        </View>
    ) : null;

    return (
        <>
            <ProductFormLayout
                title={t('supplierPanel.newProduct')}
                onBack={() => router.back()}
                isSubmitting={isSubmitting}
                tabs={
                    !fetchError
                        ? {
                              productType: activeTab,
                              interactive: true,
                              onTabChange: handleTabSwitch,
                          }
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
                title={t('supplierPanel.generateAiContent')}
                placeholder={t('supplierPanel.aiContentPlaceholder')}
                submitButtonText={t('supplierPanel.generate')}
                isLoading={isGeneratingAI}
            />
        </>
    );
}
