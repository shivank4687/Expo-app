import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    Alert,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { addressApi } from '@/services/api/address.api';
import { Address } from '../types/address.types';
import { AddressCard } from '../components/AddressCard';
import { LoadingSpinner } from '@/shared/components/LoadingSpinner';
import { ErrorMessage } from '@/shared/components/ErrorMessage';
import { theme } from '@/theme';
import { useToast } from '@/shared/components/Toast';

export const AddressesScreen: React.FC = () => {
    const { t } = useTranslation();
    const router = useRouter();
    const { showToast } = useToast();
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadAddresses = useCallback(async () => {
        try {
            setError(null);
            const data = await addressApi.getAddresses();
            setAddresses(data);
        } catch (err: any) {
            console.error('[AddressesScreen] Error loading addresses:', err);
            setError(err.message || 'Failed to load addresses');
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadAddresses();
    }, [loadAddresses]);

    const handleRefresh = useCallback(() => {
        setIsRefreshing(true);
        loadAddresses();
    }, [loadAddresses]);

    const handleAddNew = useCallback(() => {
        router.push('/add-address');
    }, [router]);

    const handleEdit = useCallback((address: Address) => {
        router.push(`/add-address?id=${address.id}` as any);
    }, [router]);

    const handleDelete = useCallback(async (address: Address) => {
        try {
            await addressApi.deleteAddress(address.id);
            showToast('Address deleted successfully', 'success');
            loadAddresses();
        } catch (err: any) {
            console.error('[AddressesScreen] Error deleting address:', err);
            showToast(err.message || 'Failed to delete address', 'error');
        }
    }, [loadAddresses, showToast]);

    const handleMakeDefault = useCallback(async (address: Address) => {
        try {
            await addressApi.makeDefaultAddress(address.id);
            showToast('Default address updated', 'success');
            loadAddresses();
        } catch (err: any) {
            console.error('[AddressesScreen] Error setting default address:', err);
            showToast(err.message || 'Failed to set default address', 'error');
        }
    }, [loadAddresses, showToast]);

    if (isLoading) {
        return <LoadingSpinner />;
    }

    if (error && addresses.length === 0) {
        return (
            <View style={styles.container}>
                <Stack.Screen options={{ title: 'Addresses', headerBackTitle: 'Back' }} />
                <ErrorMessage message={error} onRetry={loadAddresses} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ title: 'Addresses', headerBackTitle: 'Back' }} />
            
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.contentContainer}
                refreshControl={
                    <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
                }
            >
                {/* Add New Address Button */}
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={handleAddNew}
                    activeOpacity={0.8}
                >
                    <Ionicons name="add-circle" size={24} color={theme.colors.white} />
                    <Text style={styles.addButtonText}>Add New Address</Text>
                </TouchableOpacity>

                {/* Address List or Empty State */}
                {addresses.length > 0 ? (
                    <View style={styles.addressList}>
                        {addresses.map((address) => (
                            <AddressCard
                                key={address.id}
                                address={address}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                                onMakeDefault={handleMakeDefault}
                            />
                        ))}
                    </View>
                ) : (
                    <View style={styles.emptyState}>
                        <Ionicons
                            name="location-outline"
                            size={80}
                            color={theme.colors.gray[400]}
                        />
                        <Text style={styles.emptyTitle}>No Addresses Added</Text>
                        <Text style={styles.emptyMessage}>
                            You haven't added any delivery addresses yet.
                        </Text>
                        <Text style={styles.emptyMessage}>
                            Add one to make checkout faster!
                        </Text>
                        <TouchableOpacity
                            style={styles.emptyButton}
                            onPress={handleAddNew}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="add" size={20} color={theme.colors.white} />
                            <Text style={styles.emptyButtonText}>Add Your First Address</Text>
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
    scrollView: {
        flex: 1,
    },
    contentContainer: {
        padding: theme.spacing.md,
        paddingBottom: theme.spacing.xl * 2,
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.primary[500],
        paddingVertical: theme.spacing.md,
        borderRadius: theme.borderRadius.md,
        marginBottom: theme.spacing.lg,
        ...theme.shadows.sm,
    },
    addButtonText: {
        fontSize: theme.typography.fontSize.md,
        fontWeight: theme.typography.fontWeight.semiBold,
        color: theme.colors.white,
        marginLeft: theme.spacing.sm,
    },
    addressList: {
        flex: 1,
    },
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: theme.spacing.xl * 3,
        paddingHorizontal: theme.spacing.xl,
    },
    emptyTitle: {
        fontSize: theme.typography.fontSize.xl,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.text.primary,
        marginTop: theme.spacing.lg,
        marginBottom: theme.spacing.sm,
        textAlign: 'center',
    },
    emptyMessage: {
        fontSize: theme.typography.fontSize.md,
        color: theme.colors.text.secondary,
        textAlign: 'center',
        marginBottom: theme.spacing.xs,
        lineHeight: 22,
    },
    emptyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.primary[500],
        paddingHorizontal: theme.spacing.xl,
        paddingVertical: theme.spacing.md,
        borderRadius: theme.borderRadius.md,
        marginTop: theme.spacing.xl,
        ...theme.shadows.sm,
    },
    emptyButtonText: {
        fontSize: theme.typography.fontSize.md,
        fontWeight: theme.typography.fontWeight.semiBold,
        color: theme.colors.white,
        marginLeft: theme.spacing.sm,
    },
});

export default AddressesScreen;

