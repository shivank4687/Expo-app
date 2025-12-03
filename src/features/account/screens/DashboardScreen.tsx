import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/theme';
import { useRequireAuth } from '@/shared/hooks/useRequireAuth';

export const DashboardScreen: React.FC = () => {
    const { user, isLoading } = useRequireAuth();
    const router = useRouter();

    // Show loading while checking authentication
    if (isLoading) {
        return (
            <>
                <Stack.Screen options={{ title: 'Dashboard', headerBackTitle: 'Back' }} />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.colors.primary[500]} />
                </View>
            </>
        );
    }

    const DashboardCard = ({ icon, title, value, onPress }: any) => (
        <TouchableOpacity style={styles.card} onPress={onPress}>
            <Ionicons name={icon} size={32} color={theme.colors.primary[500]} />
            <Text style={styles.cardValue}>{value}</Text>
            <Text style={styles.cardTitle}>{title}</Text>
        </TouchableOpacity>
    );

    return (
        <>
            <Stack.Screen options={{ title: 'Dashboard', headerBackTitle: 'Back' }} />
            <ScrollView style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.greeting}>Welcome back,</Text>
                    <Text style={styles.userName}>{user?.name || 'User'}!</Text>
                </View>

                <View style={styles.cardsGrid}>
                    <DashboardCard
                        icon="receipt-outline"
                        title="Orders"
                        value="0"
                        onPress={() => router.push('/orders')}
                    />
                    <DashboardCard
                        icon="star-outline"
                        title="Reviews"
                        value="0"
                        onPress={() => router.push('/reviews')}
                    />
                    <DashboardCard
                        icon="heart-outline"
                        title="Wishlist"
                        value="0"
                        onPress={() => { }}
                    />
                    <DashboardCard
                        icon="location-outline"
                        title="Addresses"
                        value="0"
                        onPress={() => { }}
                    />
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Quick Actions</Text>
                    <TouchableOpacity style={styles.actionItem} onPress={() => router.push('/account-info')}>
                        <Ionicons name="person-outline" size={24} color={theme.colors.text.primary} />
                        <Text style={styles.actionText}>Edit Profile</Text>
                        <Ionicons name="chevron-forward" size={24} color={theme.colors.text.secondary} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionItem}>
                        <Ionicons name="notifications-outline" size={24} color={theme.colors.text.primary} />
                        <Text style={styles.actionText}>Notifications</Text>
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.background.default,
    },
    header: {
        padding: theme.spacing.xl,
        backgroundColor: theme.colors.white,
    },
    greeting: {
        fontSize: theme.typography.fontSize.md,
        color: theme.colors.text.secondary,
    },
    userName: {
        fontSize: theme.typography.fontSize['2xl'],
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.text.primary,
    },
    cardsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        padding: theme.spacing.md,
    },
    card: {
        width: '48%',
        backgroundColor: theme.colors.white,
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.lg,
        margin: '1%',
        alignItems: 'center',
        ...theme.shadows.sm,
    },
    cardValue: {
        fontSize: theme.typography.fontSize['2xl'],
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.text.primary,
        marginTop: theme.spacing.sm,
    },
    cardTitle: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.text.secondary,
        marginTop: 4,
    },
    section: {
        marginTop: theme.spacing.lg,
        backgroundColor: theme.colors.white,
        padding: theme.spacing.lg,
    },
    sectionTitle: {
        fontSize: theme.typography.fontSize.lg,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.md,
    },
    actionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.gray[100],
    },
    actionText: {
        flex: 1,
        marginLeft: theme.spacing.md,
        fontSize: theme.typography.fontSize.md,
        color: theme.colors.text.primary,
    },
});

export default DashboardScreen;
