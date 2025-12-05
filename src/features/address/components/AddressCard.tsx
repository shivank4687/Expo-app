import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Address } from '../types/address.types';
import { Card } from '@/shared/components/Card';
import { theme } from '@/theme';

interface AddressCardProps {
    address: Address;
    onEdit?: (address: Address) => void;
    onDelete?: (address: Address) => void;
    onMakeDefault?: (address: Address) => void;
}

export const AddressCard: React.FC<AddressCardProps> = ({
    address,
    onEdit,
    onDelete,
    onMakeDefault,
}) => {
    const handleDelete = () => {
        Alert.alert(
            'Delete Address',
            'Are you sure you want to delete this address?',
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => onDelete?.(address),
                },
            ]
        );
    };

    const handleMakeDefault = () => {
        const isDefault = address.default_address || address.is_default;
        if (isDefault) return;
        onMakeDefault?.(address);
    };

    // API returns 'address' field, but our type expects 'address1'
    const rawAddress = address.address || address.address1 || [];
    const addressLines = Array.isArray(rawAddress)
        ? rawAddress
        : [rawAddress];

    return (
        <Card variant="outlined" style={styles.card}>
            {/* Header with name and default badge */}
            <View style={styles.header}>
                <View style={styles.nameContainer}>
                    <Text style={styles.name}>
                        {address.first_name} {address.last_name}
                    </Text>
                    {(address.default_address || address.is_default) && (
                        <View style={styles.defaultBadge}>
                            <Text style={styles.defaultText}>Default</Text>
                        </View>
                    )}
                </View>
            </View>

            {/* Address Details */}
            <View style={styles.details}>
                {address.company_name ? (
                    <Text style={styles.detailText}>{address.company_name}</Text>
                ) : null}
                
                {addressLines.map((line, index) => (
                    <Text key={index} style={styles.detailText}>
                        {line}
                    </Text>
                ))}
                
                {address.address2 ? (
                    <Text style={styles.detailText}>{address.address2}</Text>
                ) : null}
                
                <Text style={styles.detailText}>
                    {address.city}, {address.state} {address.postcode}
                </Text>
                
                <Text style={styles.detailText}>
                    {address.country_name || address.country}
                </Text>
                
                <View style={styles.phoneContainer}>
                    <Ionicons name="call-outline" size={16} color={theme.colors.text.secondary} />
                    <Text style={styles.phoneText}>{address.phone}</Text>
                </View>
            </View>

            {/* Actions */}
            <View style={styles.actions}>
                {!(address.default_address || address.is_default) && (
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={handleMakeDefault}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="checkmark-circle-outline" size={20} color={theme.colors.primary[500]} />
                        <Text style={styles.actionText}>Set Default</Text>
                    </TouchableOpacity>
                )}
                
                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => onEdit?.(address)}
                    activeOpacity={0.7}
                >
                    <Ionicons name="create-outline" size={20} color={theme.colors.text.primary} />
                    <Text style={styles.actionText}>Edit</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={handleDelete}
                    activeOpacity={0.7}
                >
                    <Ionicons name="trash-outline" size={20} color={theme.colors.error.main} />
                    <Text style={[styles.actionText, styles.deleteText]}>Delete</Text>
                </TouchableOpacity>
            </View>
        </Card>
    );
};

const styles = StyleSheet.create({
    card: {
        marginBottom: theme.spacing.md,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.sm,
    },
    nameContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    name: {
        fontSize: theme.typography.fontSize.lg,
        fontWeight: theme.typography.fontWeight.semiBold,
        color: theme.colors.text.primary,
    },
    defaultBadge: {
        backgroundColor: theme.colors.primary[500],
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: 2,
        borderRadius: theme.borderRadius.sm,
        marginLeft: theme.spacing.sm,
    },
    defaultText: {
        fontSize: theme.typography.fontSize.xs,
        fontWeight: theme.typography.fontWeight.semiBold,
        color: theme.colors.white,
        textTransform: 'uppercase',
    },
    details: {
        marginBottom: theme.spacing.md,
    },
    detailText: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.text.secondary,
        marginBottom: 2,
    },
    phoneContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: theme.spacing.xs,
    },
    phoneText: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.text.secondary,
        marginLeft: theme.spacing.xs,
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        borderTopWidth: 1,
        borderTopColor: theme.colors.gray[200],
        paddingTop: theme.spacing.md,
        gap: theme.spacing.lg,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    actionText: {
        fontSize: theme.typography.fontSize.sm,
        fontWeight: theme.typography.fontWeight.medium,
        color: theme.colors.text.primary,
        marginLeft: theme.spacing.xs,
    },
    deleteText: {
        color: theme.colors.error.main,
    },
});

