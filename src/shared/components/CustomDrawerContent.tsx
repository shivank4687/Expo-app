import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { DrawerContentComponentProps } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/theme';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { logoutThunk } from '@/store/slices/authSlice';
import { fetchCoreConfig } from '@/store/slices/coreSlice';
import { fetchCategories } from '@/store/slices/categorySlice';
import { fetchCMSPages } from '@/store/slices/cmsSlice';
import { useRouter } from 'expo-router';
import { DrawerSection, DrawerItem } from './DrawerSection';
import { Category } from '@/services/api/categories.api';
import { useTranslation } from 'react-i18next';

export const CustomDrawerContent = (props: DrawerContentComponentProps) => {
    const { t } = useTranslation();
    const dispatch = useAppDispatch();
    const { user, isAuthenticated } = useAppSelector((state) => state.auth);
    const { selectedLocale, selectedCurrency } = useAppSelector((state) => state.core);
    const { categories } = useAppSelector((state) => state.category);
    const { pages: cmsPages, isLoading: cmsLoading } = useAppSelector((state) => state.cms);
    const router = useRouter();

    useEffect(() => {
        // Initialize core config (locale, currency) if not loaded
        dispatch(fetchCoreConfig());
    }, [dispatch]);

    // Load categories and CMS pages when locale changes
    useEffect(() => {
        if (selectedLocale?.code) {
            dispatch(fetchCategories({ locale: selectedLocale.code }));
            dispatch(fetchCMSPages({ locale: selectedLocale.code }));
        }
    }, [selectedLocale?.code, dispatch]);

    const handleLoginPress = () => {
        router.push('/login');
    };

    const handleLogout = () => {
        Alert.alert(
            t('auth.logoutConfirmTitle', 'Confirm Logout'),
            t('auth.logoutConfirmMessage', 'Are you sure you want to logout?'),
            [
                {
                    text: t('common.cancel', 'Cancel'),
                    style: 'cancel',
                },
                {
                    text: t('auth.logout', 'Logout'),
                    style: 'destructive',
                    onPress: () => {
                        dispatch(logoutThunk());
                    },
                },
            ],
            { cancelable: true }
        );
    };

    const navigateTo = (path: string) => {
        router.push(path as any);
    };

    return (
        <View style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* User Profile Section */}
                <View style={styles.profileSection}>
                    {isAuthenticated ? (
                        <TouchableOpacity onPress={() => navigateTo('/account-info')} style={styles.cardButton}>
                            <Ionicons name="person-circle" size={24} color={theme.colors.primary[500]} style={styles.cardIcon} />
                            <Text style={styles.cardText}>Hello, {user?.name || 'User'}</Text>
                            <Ionicons name="chevron-forward" size={20} color={theme.colors.gray[400]} />
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity onPress={handleLoginPress} style={styles.cardButton}>
                            <Ionicons name="log-in-outline" size={24} color={theme.colors.primary[500]} style={styles.cardIcon} />
                            <Text style={styles.cardText}>{t('auth.loginOrSignup')}</Text>
                            <Ionicons name="chevron-forward" size={20} color={theme.colors.gray[400]} />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Categories Section */}
                <DrawerSection title={t('drawer.categories')} icon="grid-outline" defaultExpanded={true}>
                    {categories.map((category) => (
                        <React.Fragment key={category.id}>
                            {/* Parent Category */}
                            <DrawerItem
                                label={category.name}
                                imageUrl={category.image}
                                onPress={() => navigateTo(`/category/${category.id}?name=${encodeURIComponent(category.name)}`)}
                                level={0}
                            />
                            {/* Child Categories - Commented out as per user request */}
                            {/* {category.children && category.children.length > 0 && (
                                <>
                                    {category.children.map((child) => (
                                        <DrawerItem
                                            key={child.id}
                                            label={child.name}
                                            imageUrl={child.image}
                                            onPress={() => navigateTo(`/category/${child.id}?name=${encodeURIComponent(child.name)}`)}
                                            level={1}
                                        />
                                    ))}
                                </>
                            )} */}
                        </React.Fragment>
                    ))}
                </DrawerSection>

                {/* Your Information Section - Only show when authenticated */}
                {isAuthenticated && (
                    <DrawerSection title={t('drawer.yourInformation')} icon="person-outline" defaultExpanded={true}>
                        <DrawerItem label={t('drawer.dashboard')} icon="speedometer-outline" onPress={() => navigateTo('/dashboard')} />
                        <DrawerItem label={t('drawer.orders')} icon="receipt-outline" onPress={() => navigateTo('/orders')} />
                        <DrawerItem label={t('drawer.addresses')} icon="location-outline" onPress={() => navigateTo('/addresses')} />
                        <DrawerItem label={t('drawer.reviews')} icon="star-outline" onPress={() => navigateTo('/reviews')} />
                    </DrawerSection>
                )}

                {/* Other Section - Dynamic CMS Pages */}
                <DrawerSection title={t('drawer.other')} icon="information-circle-outline" defaultExpanded={true}>
                    {cmsLoading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="small" color={theme.colors.primary[500]} />
                        </View>
                    ) : cmsPages.length > 0 ? (
                        cmsPages.map((page) => (
                            <DrawerItem
                                key={page.id}
                                label={page.page_title}
                                onPress={() => navigateTo(`/static/${page.url_key}`)}
                            />
                        ))
                    ) : null}
                </DrawerSection>

                {/* Preferences Section */}
                <DrawerSection title={t('drawer.preferences')} icon="settings-outline" defaultExpanded={true}>
                    <DrawerItem 
                        label={t('drawer.language')} 
                        icon="language-outline" 
                        onPress={() => navigateTo('/language-selection')}
                        rightText={selectedLocale?.name || 'English'}
                    />
                    <DrawerItem 
                        label={t('drawer.currency')} 
                        icon="cash-outline" 
                        onPress={() => navigateTo('/currency-selection')}
                        rightText={selectedCurrency?.code || 'USD'}
                    />
                    {/* <DrawerItem label={t('drawer.gdprRequests')} icon="shield-checkmark-outline" onPress={() => navigateTo('/gdpr-requests')} /> */}
                </DrawerSection>
            </ScrollView>

            {/* Logout Button at Bottom */}
            {isAuthenticated && (
                <View style={styles.footer}>
                    <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                        <Ionicons name="log-out-outline" size={24} color={theme.colors.error.main} />
                        <Text style={styles.logoutText}>{t('auth.logout')}</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    profileSection: {
        padding: theme.spacing.lg,
        paddingTop: theme.spacing.xl * 2,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.gray[200],
        marginBottom: theme.spacing.md,
    },
    cardButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.background.paper,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.md,
        borderWidth: 1,
        borderColor: theme.colors.gray[200],
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    cardIcon: {
        marginRight: theme.spacing.sm,
    },
    cardText: {
        flex: 1,
        fontSize: theme.typography.fontSize.md,
        fontWeight: theme.typography.fontWeight.semiBold,
        color: theme.colors.text.primary,
    },
    footer: {
        padding: theme.spacing.lg,
        borderTopWidth: 1,
        borderTopColor: theme.colors.gray[200],
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    logoutText: {
        marginLeft: theme.spacing.sm,
        fontSize: theme.typography.fontSize.md,
        color: theme.colors.error.main,
        fontWeight: theme.typography.fontWeight.medium,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.background.default,
    },
});
