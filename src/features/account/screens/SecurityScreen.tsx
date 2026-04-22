import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Platform, Switch, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { TopHeader } from '@/shared/components/TopHeader';
import { theme } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { updateSecurityThunk } from '@/store/slices/authSlice';

export const SecurityScreen: React.FC = () => {
    const { t } = useTranslation();
    const router = useRouter();
    const dispatch = useAppDispatch();
    const { user, isLoading: isAuthLoading } = useAppSelector((state) => state.auth);
    
    // Use local state to handle the toggle immediately for UI responsiveness
    const [is2FAEnabled, setIs2FAEnabled] = useState(user?.two_factor_enabled ?? false);
    const [isUpdating, setIsUpdating] = useState(false);

    // Sync local state when user data from redux changes (e.g. after refresh or login)
    useEffect(() => {
        if (user) {
            setIs2FAEnabled(!!user.two_factor_enabled);
        }
    }, [user]);

    const handleToggle2FA = async (value: boolean) => {
        try {
            setIs2FAEnabled(value);
            setIsUpdating(true);
            
            const resultAction = await dispatch(updateSecurityThunk({ two_factor_enabled: value }));
            
            if (updateSecurityThunk.rejected.match(resultAction)) {
                // Revert local state on failure
                setIs2FAEnabled(!value);
                Alert.alert(
                    t('common.error', 'Error'),
                    resultAction.payload as string || t('account.updateFailed', 'Failed to update security settings.')
                );
            }
        } catch (error) {
            setIs2FAEnabled(!value);
            Alert.alert(t('common.error', 'Error'), t('common.somethingWentWrong', 'Something went wrong.'));
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <View style={styles.container}>
            <TopHeader 
                title={t('account.security', 'Security')}
                onBack={() => router.back()}
            />
            
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Security Status Header */}
                <View style={styles.headerSection}>
                    <View style={styles.iconContainer}>
                        {isUpdating ? (
                            <ActivityIndicator size="large" color={theme.colors.primary[500]} />
                        ) : (
                            <Ionicons 
                                name={is2FAEnabled ? "shield-checkmark" : "shield-outline"} 
                                size={60} 
                                color={theme.colors.primary[500]} 
                            />
                        )}
                    </View>
                    <Text style={styles.headerTitle}>
                        {is2FAEnabled ? t('account.accountSecured', 'Account Secured') : t('account.accountVulnerable', 'Security Recommendation')}
                    </Text>
                    <Text style={styles.headerSubtitle}>
                        {is2FAEnabled 
                            ? t('account.securedDesc', 'Your account has an extra layer of protection.') 
                            : t('account.vulnerableDesc', 'Enable Two-Factor Authentication to keep your account safe.')}
                    </Text>
                </View>

                {/* Settings Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t('account.loginSecurity', 'Login Security')}</Text>
                    
                    <View style={styles.settingRow}>
                        <View style={styles.settingTextContainer}>
                            <Text style={styles.settingLabel}>{t('account.2fa', 'Two-Factor Authentication (2FA)')}</Text>
                            <Text style={styles.settingSubtitle}>
                                {t('account.2faDesc', 'Require a code in addition to your password to log in.')}
                            </Text>
                        </View>
                        <Switch
                            value={is2FAEnabled}
                            onValueChange={handleToggle2FA}
                            disabled={isUpdating}
                            trackColor={{ false: '#D1D5DB', true: theme.colors.primary[200] }}
                            thumbColor={is2FAEnabled ? theme.colors.primary[500] : '#F3F4F6'}
                            ios_backgroundColor="#D1D5DB"
                        />
                    </View>
                </View>

                {/* Coming Soon Section */}
                <View style={[styles.section, styles.comingSoonSection]}>
                    <Ionicons name="construct-outline" size={24} color={theme.colors.gray[400]} />
                    <Text style={styles.comingSoonText}>
                        {t('account.moreFeaturesSoon', 'More security features coming soon, including biometrics and login activity tracking.')}
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background.default,
    },
    scrollContent: {
        paddingBottom: theme.spacing.xl,
    },
    headerSection: {
        alignItems: 'center',
        padding: theme.spacing.xl,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.gray[100],
        minHeight: 220, // Prevent layout jump when text changes
    },
    iconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(0, 97, 94, 0.05)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: theme.spacing.lg,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#000000',
        marginBottom: theme.spacing.xs,
        fontFamily: Platform.OS === 'ios' ? 'Inter' : 'sans-serif',
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 20,
        paddingHorizontal: theme.spacing.md,
        fontFamily: Platform.OS === 'ios' ? 'Inter' : 'sans-serif',
    },
    section: {
        marginTop: theme.spacing.lg,
        paddingHorizontal: theme.spacing.lg,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.gray[500],
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: theme.spacing.md,
    },
    settingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        padding: theme.spacing.lg,
        borderRadius: theme.borderRadius.lg,
        borderWidth: 1,
        borderColor: theme.colors.gray[100],
        ...theme.shadows.sm,
    },
    settingTextContainer: {
        flex: 1,
        paddingRight: theme.spacing.md,
    },
    settingLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000000',
        marginBottom: 4,
        fontFamily: Platform.OS === 'ios' ? 'Inter' : 'sans-serif',
    },
    settingSubtitle: {
        fontSize: 13,
        color: '#6B7280',
        lineHeight: 18,
        fontFamily: Platform.OS === 'ios' ? 'Inter' : 'sans-serif',
    },
    comingSoonSection: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(243, 244, 246, 0.5)',
        padding: theme.spacing.lg,
        borderRadius: theme.borderRadius.lg,
        marginTop: theme.spacing.xl,
        marginHorizontal: theme.spacing.lg,
        gap: theme.spacing.md,
    },
    comingSoonText: {
        flex: 1,
        fontSize: 13,
        color: theme.colors.gray[500],
        fontStyle: 'italic',
        lineHeight: 18,
    },
});

export default SecurityScreen;
