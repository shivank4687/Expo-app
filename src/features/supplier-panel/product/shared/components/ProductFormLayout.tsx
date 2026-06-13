import React from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/features/supplier-panel/styles';
import styles from '../styles/product-form.styles';
import type { ProductType } from '../types';

interface ProductFormLayoutProps {
    /** Header back button handler */
    onBack: () => void;
    /** Header title string */
    title: string;
    /** Whether form is currently submitting (disables interaction) */
    isSubmitting: boolean;

    /** Tab bar props — pass null to hide tabs entirely */
    tabs?: {
        productType: ProductType;
        /** When interactive = true, tapping a tab calls onTabChange */
        interactive: boolean;
        onTabChange?: (tab: ProductType) => void;
    } | null;

    /** Scrollable body content */
    children: React.ReactNode;

    /** Footer action buttons rendered inside the scroll view */
    footer?: React.ReactNode;
}

/**
 * Shared layout wrapper for the product add/edit screens.
 * Renders: fixed header, scrollable content area, tabs, submitting overlay.
 */
const ProductFormLayout: React.FC<ProductFormLayoutProps> = ({
    onBack,
    title,
    isSubmitting,
    tabs,
    children,
    footer,
}) => {
    return (
        <View style={styles.container}>
            {/* Fixed Header */}
            <View style={styles.header}>
                <View style={styles.headerContent}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={onBack}
                        activeOpacity={0.7}
                        disabled={isSubmitting}
                    >
                        <Ionicons name="arrow-back" size={16} color="#000000" />
                    </TouchableOpacity>

                    <View style={styles.titleContainer}>
                        <Text style={styles.headerTitle}>{title}</Text>
                    </View>
                </View>
            </View>

            {/* Scrollable Content */}
            <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
                scrollEnabled={!isSubmitting}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
            >
                {/* Tab Bar */}
                {tabs && (
                    <View
                        style={[
                            styles.tabsContainer,
                            !tabs.interactive && styles.tabsContainerDisabled,
                        ]}
                    >
                        {(['simple', 'configurable'] as ProductType[]).map((type) => {
                            const isActive = tabs.productType === type;
                            const label = type === 'simple' ? 'Simple Product' : 'Product with Variants';
                            if (tabs.interactive) {
                                return (
                                    <TouchableOpacity
                                        key={type}
                                        style={[styles.tab, isActive && styles.tabActive]}
                                        onPress={() => tabs.onTabChange?.(type)}
                                        activeOpacity={0.7}
                                        disabled={isSubmitting}
                                    >
                                        <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                                            {label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            }
                            return (
                                <View key={type} style={[styles.tab, isActive && styles.tabActive]}>
                                    <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                                        {label}
                                    </Text>
                                </View>
                            );
                        })}
                    </View>
                )}

                {/* Cards */}
                {children}

                {/* Footer buttons */}
                {footer}
            </ScrollView>

            {/* Submitting overlay */}
            {isSubmitting && (
                <View style={styles.submittingOverlay}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            )}
        </View>
    );
};

export default ProductFormLayout;
