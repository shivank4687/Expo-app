import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { theme } from '@/theme';
import { useAppSelector } from '@/store/hooks';

interface ShopHeaderProps {
    title?: string;
    showSearch?: boolean;
}

export const ShopHeader: React.FC<ShopHeaderProps> = ({ title, showSearch = true }) => {
    const navigation = useNavigation();
    const router = useRouter();
    const { isAuthenticated } = useAppSelector((state) => state.auth);

    const openDrawer = () => {
        navigation.dispatch(DrawerActions.openDrawer());
    };

    const handleProfilePress = () => {
        if (isAuthenticated) {
            // Navigate to profile or open drawer
            navigation.dispatch(DrawerActions.openDrawer());
        } else {
            router.push('/login');
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.topRow}>
                <TouchableOpacity onPress={openDrawer} style={styles.iconButton}>
                    <Ionicons name="menu-outline" size={28} color={theme.colors.text.primary} />
                </TouchableOpacity>

                <Text style={styles.logo}>Shop App</Text>

                <View style={styles.rightActions}>
                    <TouchableOpacity style={styles.iconButton} onPress={handleProfilePress}>
                        <Ionicons
                            name={isAuthenticated ? "person-outline" : "person-circle-outline"}
                            size={28}
                            color={theme.colors.text.primary}
                        />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.iconButton}>
                        <Ionicons name="cart-outline" size={28} color={theme.colors.text.primary} />
                        {/* Badge could go here */}
                    </TouchableOpacity>
                </View>
            </View>

            {showSearch && (
                <View style={styles.searchContainer}>
                    <View style={styles.searchBar}>
                        <Ionicons name="search-outline" size={20} color={theme.colors.text.secondary} />
                        <TextInput
                            placeholder="Search products..."
                            placeholderTextColor={theme.colors.text.secondary}
                            style={styles.searchInput}
                        />
                    </View>
                </View>
            )}
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
        marginBottom: theme.spacing.md,
    },
    logo: {
        fontSize: theme.typography.fontSize.xl,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.primary[500],
    },
    rightActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconButton: {
        padding: theme.spacing.xs,
        marginLeft: theme.spacing.xs,
    },
    searchContainer: {
        paddingHorizontal: theme.spacing.xs,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.gray[100],
        borderRadius: theme.borderRadius.full,
        paddingHorizontal: theme.spacing.md,
        height: 40,
    },
    searchInput: {
        flex: 1,
        marginLeft: theme.spacing.sm,
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.text.primary,
    },
});
