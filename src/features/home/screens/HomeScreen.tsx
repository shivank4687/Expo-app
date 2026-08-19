import { themeApi } from '@/services/api/theme.api';
import { productsApi } from '@/services/api/products.api';
import { Product } from '@/features/product/types/product.types';
import { ErrorMessage } from '@/shared/components/ErrorMessage';
import { LoadingSpinner } from '@/shared/components/LoadingSpinner';
import { useAppSelector } from '@/store/hooks';
import { theme } from '@/theme';
import { ThemeCustomization as ThemeCustomizationType } from '@/types/theme.types';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { ThemeCustomization } from '../components/ThemeCustomization';
import { NewsletterSubscription } from '../components/NewsletterSubscription';
import { HomeCategoryContent } from '../components/HomeCategoryContent';
import { DiscountSection } from '../components/DiscountSection';
import { CategoryGridSection } from '../components/CategoryGridSection';
import { RecentlyViewedSection } from '../components/RecentlyViewedSection';
import { RecentlyVisitedCategoriesSection } from '../components/RecentlyVisitedCategoriesSection';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

/**
 * HomeScreen Component
 * Displays theme customizations (carousels, static content, etc.)
 * featuring a dynamic category tab bar and premium feature cards.
 */
export const HomeScreen: React.FC = () => {
    const router = useRouter();
    const { t } = useTranslation();
    const { selectedLocale } = useAppSelector((state) => state.core);
    const { categories } = useAppSelector((state) => state.category);
    const { user } = useAppSelector((state) => state.auth);

    const [activeTabId, setActiveTabId] = useState<string | number>('home');
    const [customizations, setCustomizations] = useState<ThemeCustomizationType[]>([]);
    const [discountedProducts, setDiscountedProducts] = useState<Product[]>([]);
    const [newProducts, setNewProducts] = useState<Product[]>([]);
    const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadData = useCallback(async () => {
        if (!selectedLocale?.code) return;

        try {
            setError(null);
            
            // 1. Fetch critical layout & theme customization first
            const customizationsData = await themeApi.getCustomizations();
            setCustomizations(customizationsData);
            
            // Dismiss global loading spinner as soon as layout/carousel is loaded
            setIsLoading(false);

            // 2. Fetch product grids concurrently in the background
            Promise.all([
                productsApi.getDiscountedProducts(8).catch(err => {
                    console.error('[HomeScreen] Failed to load discounted products:', err);
                    return [];
                }),
                productsApi.getNewProducts(8).catch(err => {
                    console.error('[HomeScreen] Failed to load new products:', err);
                    return [];
                }),
                productsApi.getFeaturedProducts(8).catch(err => {
                    console.error('[HomeScreen] Failed to load featured products:', err);
                    return [];
                }),
            ]).then(([discounted, newArr, featured]) => {
                setDiscountedProducts(discounted);
                setNewProducts(newArr);
                setFeaturedProducts(featured);
            }).finally(() => {
                setIsRefreshing(false);
            });

        } catch (err: any) {
            console.error('[HomeScreen] Error loading critical content:', err);
            setError(err.message || 'Failed to load page content');
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [selectedLocale?.code]);

    useEffect(() => {
        loadData();
    }, [loadData, user?.customer_group_id]);

    const handleRefresh = useCallback(() => {
        setIsRefreshing(true);
        loadData();
    }, [loadData]);

    const tabs = useMemo(() => [{ id: 'home', name: t('common.explore') }, ...categories], [categories, t]);

    const renderTabBar = () => {
        if (categories.length === 0) return null;

        return (
            <View style={styles.tabBarContainer}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.tabBarContent}
                >
                    {tabs.map((tab) => {
                        const isActive = activeTabId === tab.id;
                        return (
                            <TouchableOpacity
                                key={tab.id}
                                style={[styles.tabItem, isActive && styles.activeTabItem]}
                                onPress={() => setActiveTabId(tab.id)}
                                activeOpacity={0.7}
                            >
                                <Text style={[styles.tabText, isActive && styles.activeTabText]}>
                                    {tab.name}
                                </Text>
                                {isActive && <View style={styles.activeIndicator} />}
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>
        );
    };

    if (isLoading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <LoadingSpinner />
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.errorContainer}>
                <ErrorMessage message={error} onRetry={loadData} />
            </View>
        );
    }

    const image_carousel_customization = useMemo(() => customizations.filter(
        c => ['image_carousel'].includes(c.type)
    ), [customizations]);

    const carousel_customization = useMemo(() => customizations.filter(
        c => ['category_carousel', 'product_carousel'].includes(c.type)
    ), [customizations]);

    const servicesCustomization = useMemo(() => customizations.find(
        c => c.type === 'services_content' as any
    ), [customizations]);

    return (
        <View style={styles.container}>
            {renderTabBar()}

            {activeTabId === 'home' ? (
                <ScrollView
                    style={styles.flex1}
                    contentContainerStyle={styles.contentContainer}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
                    }
                >


                    {image_carousel_customization.map((customization) => (
                        <ThemeCustomization
                            key={customization.id}
                            customization={customization}
                        />
                    ))}
                    <RecentlyViewedSection />
                    <RecentlyVisitedCategoriesSection />
                    {carousel_customization.map((customization) => (
                        <ThemeCustomization
                            key={customization.id}
                            customization={customization}
                        />
                    ))}
                    {/* Featured Sections */}
                    <DiscountSection
                        products={discountedProducts}
                        onViewAll={() => router.push('/product-list/all?title=Daily Deals&on_sale=1')}
                    />

                    <CategoryGridSection
                        title="New Arrivals"
                        products={newProducts}
                        onViewAll={() => router.push('/product-list/all?title=New Arrivals&new=1')}
                    />

                    <CategoryGridSection
                        title="Featured Products"
                        products={featuredProducts}
                        onViewAll={() => router.push('/product-list/all?title=Featured Products&featured=1')}
                    />
                    {/* <NewsletterSubscription /> */}

                    {/* {servicesCustomization && (
                        <ThemeCustomization
                            key={servicesCustomization.id}
                            customization={servicesCustomization}
                        />
                    )} */}
                </ScrollView>
            ) : (
                <HomeCategoryContent categoryId={activeTabId as number} />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background.default,
    },
    flex1: {
        flex: 1,
    },
    tabBarContainer: {
        backgroundColor: theme.colors.primary[500],
        borderBottomWidth: 0,
    },
    tabBarContent: {
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: theme.spacing.xs,
    },
    tabItem: {
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: theme.spacing.sm,
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
    },
    activeTabItem: {
        // No specific background change for a clean look
    },
    tabText: {
        fontSize: theme.typography.fontSize.md,
        color: theme.colors.primary[100],
        fontWeight: theme.typography.fontWeight.medium,
    },
    activeTabText: {
        color: theme.colors.white,
        fontWeight: theme.typography.fontWeight.bold,
    },
    activeIndicator: {
        position: 'absolute',
        bottom: 0,
        width: '60%',
        height: 3,
        backgroundColor: theme.colors.white,
        borderRadius: 2,
    },
    contentContainer: {
        //paddingTop: theme.spacing.xs,
        paddingBottom: theme.spacing.xl * 2,
    },
    errorContainer: {
        flex: 1,
        backgroundColor: theme.colors.background.default,
    },
});

export default HomeScreen;
