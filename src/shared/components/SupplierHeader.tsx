import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/theme';
import { useAppSelector } from '@/store/hooks';

interface SupplierHeaderProps {
    title?: string;
}

export const SupplierHeader: React.FC<SupplierHeaderProps> = ({ title = 'Supplier Dashboard' }) => {
    const router = useRouter();
    const navigation = useNavigation();
    const { supplier } = useAppSelector((state) => state.supplierAuth);
    const [notificationCount] = useState(0); // TODO: Connect to actual notification state

    const openDrawer = () => {
        navigation.dispatch(DrawerActions.openDrawer());
    };

    const handleNotificationPress = () => {
        // TODO: Navigate to notifications screen
        console.log('Notifications pressed');
    };

    const handleProfilePress = () => {
        // TODO: Navigate to supplier profile
        console.log('Profile pressed');
    };

    return (
        <View style={styles.container}>
            <View style={styles.topRow}>
                {/* Drawer Icon */}
                <TouchableOpacity onPress={openDrawer} style={styles.iconButton}>
                    <Ionicons name="menu-outline" size={28} color={theme.colors.text.primary} />
                </TouchableOpacity>

                {/* Title */}
                <View style={styles.titleContainer}>
                    <Text style={styles.title} numberOfLines={1}>
                        {title}
                    </Text>
                    {supplier?.company_name && (
                        <Text style={styles.subtitle} numberOfLines={1}>
                            {supplier.company_name}
                        </Text>
                    )}
                </View>

                {/* Right Actions */}
                <View style={styles.rightActions}>
                    {/* Notifications Icon */}
                    <TouchableOpacity 
                        style={styles.iconButton} 
                        onPress={handleNotificationPress}
                    >
                        <View>
                            <Ionicons 
                                name="notifications-outline" 
                                size={28} 
                                color={theme.colors.text.primary} 
                            />
                            {notificationCount > 0 && (
                                <View style={styles.badge}>
                                    <Text style={styles.badgeText}>
                                        {notificationCount > 99 ? '99+' : notificationCount}
                                    </Text>
                                </View>
                            )}
                        </View>
                    </TouchableOpacity>

                    {/* Profile Icon */}
                    <TouchableOpacity 
                        style={styles.iconButton} 
                        onPress={handleProfilePress}
                    >
                        <Ionicons 
                            name="person-circle-outline" 
                            size={28} 
                            color={theme.colors.text.primary} 
                        />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: theme.colors.white,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingBottom: theme.spacing.md,
        paddingHorizontal: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.gray[200],
        ...theme.shadows.sm,
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    titleContainer: {
        flex: 1,
        marginHorizontal: theme.spacing.md,
        alignItems: 'center',
    },
    title: {
        fontSize: theme.typography.fontSize.lg,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.text.primary,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: theme.typography.fontSize.xs,
        color: theme.colors.text.secondary,
        marginTop: 2,
        textAlign: 'center',
    },
    rightActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconButton: {
        padding: theme.spacing.xs,
        marginLeft: theme.spacing.xs,
        position: 'relative',
    },
    badge: {
        position: 'absolute',
        top: -4,
        right: -4,
        backgroundColor: theme.colors.error.main,
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
        borderWidth: 2,
        borderColor: theme.colors.white,
    },
    badgeText: {
        color: theme.colors.white,
        fontSize: 10,
        fontWeight: theme.typography.fontWeight.bold,
    },
});
