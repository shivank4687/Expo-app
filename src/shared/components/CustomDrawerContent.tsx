import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { DrawerContentComponentProps } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/theme';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { logoutThunk } from '@/store/slices/authSlice';
import { fetchCoreConfig } from '@/store/slices/coreSlice';
import { fetchCategories } from '@/store/slices/categorySlice';
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
    const router = useRouter();

    useEffect(() => {
        // Initialize core config (locale, currency) if not loaded
        dispatch(fetchCoreConfig());
    }, [dispatch]);

    // Load categories when locale changes
    useEffect(() => {
        if (selectedLocale?.code) {
            dispatch(fetchCategories({ locale: selectedLocale.code }));
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
                        <TouchableOpacity onPress={() => navigateTo('/account-info')} style={styles.userInfoContainer}>
                            <View style={styles.avatarContainer}>
                                <Image
                                    source={{ uri: user?.avatar || 'https://via.placeholder.com/100' }}
                                    style={styles.avatar}
                                />
                            </View>
                            <Text style={styles.userName}>{user?.name || 'User'}</Text>
                            <Text style={styles.userEmail}>{user?.email || ''}</Text>
                            <Text style={styles.viewProfileText}>{t('drawer.viewProfile')}</Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity onPress={handleLoginPress} style={styles.loginButton}>
                            <View style={styles.loginIconContainer}>
                                <Ionicons name="person-circle-outline" size={40} color={theme.colors.primary[500]} />
                            </View>
                            <Text style={styles.loginText}>{t('auth.loginOrSignup')}</Text>
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
                                onPress={() => navigateTo(`/category/${category.id}`)}
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
                                            onPress={() => navigateTo(`/category/${child.id}`)}
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
                    <DrawerSection title={t('drawer.yourInformation')} icon="person-outline">
                        <DrawerItem label={t('drawer.dashboard')} icon="speedometer-outline" onPress={() => navigateTo('/dashboard')} />
                        <DrawerItem label={t('drawer.orders')} icon="receipt-outline" onPress={() => navigateTo('/orders')} />
                        <DrawerItem label={t('drawer.reviews')} icon="star-outline" onPress={() => navigateTo('/reviews')} />
                    </DrawerSection>
                )}

                {/* Other Section */}
                <DrawerSection title={t('drawer.other')} icon="information-circle-outline">
                    <DrawerItem label={t('drawer.aboutUs')} onPress={() => navigateTo('/static/about-us')} />
                    <DrawerItem label={t('drawer.returnPolicy')} onPress={() => navigateTo('/static/return-policy')} />
                    <DrawerItem label={t('drawer.termsAndConditions')} onPress={() => navigateTo('/static/terms-conditions')} />
                    <DrawerItem label={t('drawer.termsOfUse')} onPress={() => navigateTo('/static/terms-of-use')} />
                    <DrawerItem label={t('drawer.contactUs')} onPress={() => navigateTo('/static/contact-us')} />
                    <DrawerItem label={t('drawer.customerService')} onPress={() => navigateTo('/static/customer-service')} />
                    <DrawerItem label={t('drawer.whatsNew')} onPress={() => navigateTo('/static/whats-new')} />
                    <DrawerItem label={t('drawer.paymentPolicy')} onPress={() => navigateTo('/static/payment-policy')} />
                    <DrawerItem label={t('drawer.shippingPolicy')} onPress={() => navigateTo('/static/shipping-policy')} />
                    <DrawerItem label={t('drawer.privacyPolicy')} onPress={() => navigateTo('/static/privacy-policy')} />
                </DrawerSection>

                {/* Preferences Section */}
                <DrawerSection title={t('drawer.preferences')} icon="settings-outline">
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
                    <DrawerItem label={t('drawer.gdprRequests')} icon="shield-checkmark-outline" onPress={() => navigateTo('/gdpr-requests')} />
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
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.gray[200],
        marginBottom: theme.spacing.md,
        alignItems: 'center',
        minHeight: 150,
        justifyContent: 'center',
    },
    avatarContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: theme.colors.gray[200],
        marginBottom: theme.spacing.sm,
        overflow: 'hidden',
    },
    avatar: {
        width: '100%',
        height: '100%',
    },
    userName: {
        fontSize: theme.typography.fontSize.lg,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.text.primary,
        marginBottom: 2,
    },
    userEmail: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.text.secondary,
        marginBottom: 4,
    },
    userInfoContainer: {
        alignItems: 'center',
        width: '100%',
    },
    viewProfileText: {
        fontSize: theme.typography.fontSize.xs,
        color: theme.colors.primary[500],
        fontWeight: theme.typography.fontWeight.medium,
    },
    loginButton: {
        alignItems: 'center',
        padding: theme.spacing.md,
    },
    loginIconContainer: {
        marginBottom: theme.spacing.xs,
    },
    loginText: {
        fontSize: theme.typography.fontSize.md,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.primary[500],
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
});
