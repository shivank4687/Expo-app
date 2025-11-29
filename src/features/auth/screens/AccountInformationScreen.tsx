import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity } from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/theme';
import { useAppSelector } from '@/store/hooks';

export const AccountInformationScreen: React.FC = () => {
    const { user } = useAppSelector((state) => state.auth);

    if (!user) {
        return (
            <View style={styles.centerContainer}>
                <Text>Please login to view account information.</Text>
            </View>
        );
    }

    const InfoItem = ({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string | undefined }) => (
        <View style={styles.infoItem}>
            <View style={styles.iconContainer}>
                <Ionicons name={icon} size={24} color={theme.colors.primary[500]} />
            </View>
            <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>{label}</Text>
                <Text style={styles.infoValue}>{value || 'Not provided'}</Text>
            </View>
        </View>
    );

    return (
        <>
            <Stack.Screen options={{ title: 'Account Information', headerBackTitle: 'Back' }} />
            <ScrollView style={styles.container}>
                <View style={styles.header}>
                    <View style={styles.avatarContainer}>
                        <Image
                            source={{ uri: user.avatar || 'https://via.placeholder.com/150' }}
                            style={styles.avatar}
                        />
                        <TouchableOpacity style={styles.editAvatarButton}>
                            <Ionicons name="camera" size={20} color={theme.colors.white} />
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.name}>{user.name}</Text>
                    <Text style={styles.email}>{user.email}</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Personal Details</Text>
                    <InfoItem icon="person-outline" label="Full Name" value={user.name} />
                    <InfoItem icon="mail-outline" label="Email Address" value={user.email} />
                    <InfoItem icon="call-outline" label="Phone Number" value={user.phone} />
                    <InfoItem icon="calendar-outline" label="Member Since" value={user.created_at ? new Date(user.created_at).toLocaleDateString() : undefined} />
                </View>

                {/* Placeholder for future sections */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Settings</Text>
                    <TouchableOpacity style={styles.menuItem}>
                        <Ionicons name="lock-closed-outline" size={24} color={theme.colors.text.primary} />
                        <Text style={styles.menuItemText}>Change Password</Text>
                        <Ionicons name="chevron-forward" size={24} color={theme.colors.text.secondary} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.menuItem}>
                        <Ionicons name="notifications-outline" size={24} color={theme.colors.text.primary} />
                        <Text style={styles.menuItemText}>Notifications</Text>
                        <Ionicons name="chevron-forward" size={24} color={theme.colors.text.secondary} />
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background.default,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        alignItems: 'center',
        padding: theme.spacing.xl,
        backgroundColor: theme.colors.white,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.gray[200],
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: theme.spacing.md,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: theme.colors.gray[200],
    },
    editAvatarButton: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: theme.colors.primary[500],
        padding: 8,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: theme.colors.white,
    },
    name: {
        fontSize: theme.typography.fontSize['2xl'],
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.text.primary,
        marginBottom: 4,
    },
    email: {
        fontSize: theme.typography.fontSize.md,
        color: theme.colors.text.secondary,
    },
    section: {
        marginTop: theme.spacing.lg,
        backgroundColor: theme.colors.white,
        paddingVertical: theme.spacing.md,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: theme.colors.gray[200],
    },
    sectionTitle: {
        fontSize: theme.typography.fontSize.lg,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.md,
        paddingHorizontal: theme.spacing.lg,
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.gray[100],
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: theme.colors.primary[50],
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: theme.spacing.md,
    },
    infoContent: {
        flex: 1,
    },
    infoLabel: {
        fontSize: theme.typography.fontSize.xs,
        color: theme.colors.text.secondary,
        marginBottom: 2,
    },
    infoValue: {
        fontSize: theme.typography.fontSize.md,
        color: theme.colors.text.primary,
        fontWeight: theme.typography.fontWeight.medium,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.gray[100],
    },
    menuItemText: {
        flex: 1,
        marginLeft: theme.spacing.md,
        fontSize: theme.typography.fontSize.md,
        color: theme.colors.text.primary,
    },
});
