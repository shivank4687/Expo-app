import { View, Text, StyleSheet, Platform, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAppDispatch } from '@/store/hooks';
import { logoutThunk } from '@/store/slices/authSlice';

export const AccountCard = () => {
    const { t } = useTranslation();
    const router = useRouter();
    const dispatch = useAppDispatch();

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

    return (
        <View style={styles.container}>
            {/* Header Row */}
            <View style={styles.headerRow}>
                <View style={styles.headerTextContainer}>
                    <Text style={styles.title}>Account</Text>
                    <Text style={styles.subtitle}>Manage your profile and preferences.</Text>
                </View>
                <View style={styles.actionChip}>
                    <Text style={styles.actionText}>Verified</Text>
                </View>
            </View>

            {/* List */}
            <View style={styles.listContainer}>
                {/* 1. Profile details */}
                <TouchableOpacity style={styles.listItem} onPress={() => router.push('/account-info')}>
                    <View style={styles.iconContainer}>
                        <Ionicons name="id-card-outline" size={20} color="#00615E" />
                    </View>
                    <View style={styles.itemTextContainer}>
                        <Text style={styles.itemTitle}>Profile details</Text>
                        <Text style={styles.itemSubtitle}>Name, company, email, phone.</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color="#000000" />
                </TouchableOpacity>

                {/* 2. Preferences */}
                <TouchableOpacity style={styles.listItem} onPress={() => router.push('/preferences')}>
                    <View style={styles.iconContainer}>
                        <Ionicons name="settings-outline" size={20} color="#00615E" />
                    </View>
                    <View style={styles.itemTextContainer}>
                        <Text style={styles.itemTitle}>Preferences</Text>
                        <Text style={styles.itemSubtitle}>Deals, delivery alerts, language.</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color="#000000" />
                </TouchableOpacity>

                {/* 3. Customer Type & Tax */}
                <TouchableOpacity style={styles.listItem} onPress={() => router.push('/customer-type-tax' as any)}>
                    <View style={styles.iconContainer}>
                        <Ionicons name="people-outline" size={20} color="#00615E" />
                    </View>
                    <View style={styles.itemTextContainer}>
                        <Text style={styles.itemTitle}>Customer Type & Tax</Text>
                        <Text style={styles.itemSubtitle}>Group, VAT & tax details.</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color="#000000" />
                </TouchableOpacity>

                {/* 4. Sign out */}
                <TouchableOpacity style={styles.listItem} onPress={handleLogout}>
                    <View style={[styles.iconContainer, { backgroundColor: 'rgba(189, 86, 38, 0.1)' }]}>
                        <Ionicons name="log-out-outline" size={20} color="#BD5626" />
                    </View>
                    <View style={styles.itemTextContainer}>
                        <Text style={styles.itemTitle}>Sign out</Text>
                        <Text style={styles.itemSubtitle}>Logout from your account.</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color="#000000" />
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E9E3D3',
        borderRadius: 8,
        padding: 8,
        marginHorizontal: 16,
        marginTop: 16,
        marginBottom: 24, // Optional, since it's the last element give it some bottom breathing room
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        width: '100%',
        gap: 12,
    },
    headerTextContainer: {
        flex: 1,
        flexDirection: 'column',
        gap: 4,
    },
    title: {
        fontFamily: Platform.OS === 'ios' ? 'Inter' : 'sans-serif',
        fontWeight: '700',
        fontSize: 16,
        color: '#000000',
        lineHeight: 16,
    },
    subtitle: {
        fontFamily: Platform.OS === 'ios' ? 'Inter' : 'sans-serif',
        fontWeight: '500',
        fontSize: 14,
        color: '#0A292D',
        lineHeight: 16.8,
    },
    actionChip: {
        backgroundColor: 'rgba(0, 97, 94, 0.1)',
        borderRadius: 50,
        paddingVertical: 4,
        paddingHorizontal: 8,
        justifyContent: 'center',
        alignItems: 'center',
        height: 23,
    },
    actionText: {
        fontFamily: Platform.OS === 'ios' ? 'Inter' : 'sans-serif',
        fontWeight: '600',
        fontSize: 11,
        color: '#00615E',
        lineHeight: 15.4,
    },
    listContainer: {
        flexDirection: 'column',
        gap: 4,
        width: '100%',
    },
    listItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
        gap: 8,
        borderWidth: 1,
        borderColor: '#E9E3D3',
        borderRadius: 8,
        width: '100%',
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 50,
        backgroundColor: 'rgba(0, 97, 94, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    itemTextContainer: {
        flex: 1,
        flexDirection: 'column',
        gap: 4,
    },
    itemTitle: {
        fontFamily: Platform.OS === 'ios' ? 'Inter' : 'sans-serif',
        fontWeight: '600',
        fontSize: 14,
        color: '#000000',
        lineHeight: 14,
    },
    itemSubtitle: {
        fontFamily: Platform.OS === 'ios' ? 'Inter' : 'sans-serif',
        fontWeight: '400',
        fontSize: 12,
        color: '#0A292D',
        lineHeight: 14.4,
    },
});
