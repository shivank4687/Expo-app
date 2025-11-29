import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { DrawerContentScrollView, DrawerItemList, DrawerContentComponentProps } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/theme';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { logoutThunk } from '@/store/slices/authSlice';
import { useRouter } from 'expo-router';

export const CustomDrawerContent = (props: DrawerContentComponentProps) => {
    const dispatch = useAppDispatch();
    const { user, isAuthenticated } = useAppSelector((state) => state.auth);
    const router = useRouter();

    const handleLoginPress = () => {
        router.push('/login');
    };

    const handleLogout = () => {
        dispatch(logoutThunk());
    };

    return (
        <DrawerContentScrollView {...props} contentContainerStyle={styles.container}>
            {/* User Profile Section */}
            <View style={styles.profileSection}>
                {isAuthenticated && user ? (
                    <TouchableOpacity onPress={() => router.push('/account-info')} style={styles.userInfoContainer}>
                        <View style={styles.avatarContainer}>
                            <Image
                                source={{ uri: user.avatar || 'https://via.placeholder.com/100' }}
                                style={styles.avatar}
                            />
                        </View>
                        <Text style={styles.userName}>{user.name}</Text>
                        <Text style={styles.userEmail}>{user.email}</Text>
                        <Text style={styles.viewProfileText}>View Profile</Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity onPress={handleLoginPress} style={styles.loginButton}>
                        <View style={styles.loginIconContainer}>
                            <Ionicons name="person-circle-outline" size={40} color={theme.colors.primary[500]} />
                        </View>
                        <Text style={styles.loginText}>Login / Sign Up</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Drawer Items */}
            <View style={styles.drawerItems}>
                <DrawerItemList {...props} />
            </View>

            {/* Footer Actions */}
            <View style={styles.footer}>
                {isAuthenticated && (
                    <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                        <Ionicons name="log-out-outline" size={24} color={theme.colors.error.main} />
                        <Text style={styles.logoutText}>Logout</Text>
                    </TouchableOpacity>
                )}
            </View>
        </DrawerContentScrollView>
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
    drawerItems: {
        flex: 1,
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
