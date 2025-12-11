import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { DrawerContentComponentProps } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/theme';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { supplierLogoutThunk } from '@/store/slices/supplierAuthSlice';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

export const SupplierDrawerContent = (props: DrawerContentComponentProps) => {
    const { t } = useTranslation();
    const dispatch = useAppDispatch();
    const { supplier, isAuthenticated } = useAppSelector((state) => state.supplierAuth);
    const router = useRouter();

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
                    onPress: async () => {
                        await dispatch(supplierLogoutThunk());
                        // Navigate to shop home screen after logout
                        router.replace('/(drawer)/(tabs)');
                    },
                },
            ],
            { cancelable: true }
        );
    };

    const navigateTo = (path: string) => {
        props.navigation.closeDrawer();
        router.push(path as any);
    };

    return (
        <View style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Supplier Profile Section */}
                <View style={styles.profileSection}>
                    {isAuthenticated && supplier ? (
                        <View style={styles.profileCard}>
                            <Ionicons name="business" size={32} color={theme.colors.primary[500]} />
                            <Text style={styles.supplierName}>{supplier.name}</Text>
                            {supplier.company_name && (
                                <Text style={styles.companyName}>{supplier.company_name}</Text>
                            )}
                            <View style={styles.statusContainer}>
                                <View style={[
                                    styles.statusBadge,
                                    supplier.is_approved && styles.statusBadgeApproved
                                ]}>
                                    <Text style={styles.statusText}>
                                        {supplier.is_approved ? 'Approved' : 'Pending'}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    ) : (
                        <View style={styles.profileCard}>
                            <Ionicons name="log-in-outline" size={32} color={theme.colors.primary[500]} />
                            <Text style={styles.cardText}>{t('auth.loginOrSignup')}</Text>
                        </View>
                    )}
                </View>

                {/* Menu Items */}
                <View style={styles.menuSection}>
                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => navigateTo('/(supplier-drawer)/(supplier-tabs)')}
                    >
                        <Ionicons name="home-outline" size={24} color={theme.colors.text.primary} />
                        <Text style={styles.menuItemText}>{t('supplier.dashboard', 'Dashboard')}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => navigateTo('/(supplier-drawer)/(supplier-tabs)/orders')}
                    >
                        <Ionicons name="receipt-outline" size={24} color={theme.colors.text.primary} />
                        <Text style={styles.menuItemText}>{t('supplier.orders', 'Orders')}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => navigateTo('/(supplier-drawer)/(supplier-tabs)/products')}
                    >
                        <Ionicons name="cube-outline" size={24} color={theme.colors.text.primary} />
                        <Text style={styles.menuItemText}>{t('supplier.products', 'Products')}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => navigateTo('/(supplier-drawer)/(supplier-tabs)/messages')}
                    >
                        <Ionicons name="chatbubbles-outline" size={24} color={theme.colors.text.primary} />
                        <Text style={styles.menuItemText}>{t('supplier.messages', 'Messages')}</Text>
                    </TouchableOpacity>
                </View>

                {/* Logout */}
                {isAuthenticated && (
                    <View style={styles.logoutSection}>
                        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                            <Ionicons name="log-out-outline" size={24} color={theme.colors.error.main} />
                            <Text style={styles.logoutText}>{t('auth.logout', 'Logout')}</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background.default,
    },
    profileSection: {
        padding: theme.spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border.light,
    },
    profileCard: {
        alignItems: 'center',
        padding: theme.spacing.md,
    },
    supplierName: {
        fontSize: theme.typography.fontSize.lg,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.text.primary,
        marginTop: theme.spacing.sm,
    },
    companyName: {
        fontSize: theme.typography.fontSize.base,
        color: theme.colors.text.secondary,
        marginTop: theme.spacing.xs,
    },
    statusContainer: {
        marginTop: theme.spacing.sm,
    },
    statusBadge: {
        backgroundColor: theme.colors.warning.light,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.xs,
        borderRadius: theme.borderRadius.full,
    },
    statusBadgeApproved: {
        backgroundColor: theme.colors.success.light,
    },
    statusText: {
        fontSize: theme.typography.fontSize.sm,
        fontWeight: theme.typography.fontWeight.medium,
        color: theme.colors.text.primary,
    },
    cardText: {
        fontSize: theme.typography.fontSize.base,
        color: theme.colors.text.primary,
        marginTop: theme.spacing.sm,
    },
    menuSection: {
        paddingVertical: theme.spacing.md,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: theme.spacing.md,
        paddingLeft: theme.spacing.lg,
    },
    menuItemText: {
        fontSize: theme.typography.fontSize.base,
        color: theme.colors.text.primary,
        marginLeft: theme.spacing.md,
    },
    logoutSection: {
        borderTopWidth: 1,
        borderTopColor: theme.colors.border.light,
        paddingTop: theme.spacing.md,
        marginTop: theme.spacing.lg,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: theme.spacing.md,
        paddingLeft: theme.spacing.lg,
    },
    logoutText: {
        fontSize: theme.typography.fontSize.base,
        color: theme.colors.error.main,
        marginLeft: theme.spacing.md,
        fontWeight: theme.typography.fontWeight.medium,
    },
});
