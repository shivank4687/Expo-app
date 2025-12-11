import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/theme';

interface SupplierHeaderProps {
    title?: string;
}

export const SupplierHeader: React.FC<SupplierHeaderProps> = ({ title = 'Supplier' }) => {
    const router = useRouter();

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.title}>{title}</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: theme.colors.background.paper,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border.light,
        paddingTop: 50,
        paddingBottom: 12,
        paddingHorizontal: theme.spacing.lg,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    title: {
        fontSize: theme.typography.fontSize.xl,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.text.primary,
    },
});
