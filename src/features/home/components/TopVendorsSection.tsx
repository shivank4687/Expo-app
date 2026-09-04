import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { suppliersApi, TopSeller } from '@/services/api/suppliers.api';
import { DetailCard } from '@/shared/components/DetailCard';
import { theme } from '@/theme';

// Deterministic color palette for letter avatars
const AVATAR_COLORS = [
    '#1A6B5A', '#2D4E8A', '#7B3F9E', '#C04D2E',
    '#0E7C7B', '#8B5E3C', '#2E6B3E', '#5A3472',
    '#336699', '#8B2252',
];

const getAvatarColor = (name: string): string => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

interface TopVendorsSectionProps {
    vendors: TopSeller[];
    isLoading?: boolean;
}

export const TopVendorsSection: React.FC<TopVendorsSectionProps> = ({ vendors, isLoading }) => {
    const router = useRouter();

    if (isLoading) {
        return (
            <View style={styles.container}>
                <DetailCard title="Top Sellers" showBadge={false} noPadding={true}>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.scrollContent}
                    >
                        {[1, 2, 3, 4, 5].map((i) => (
                            <View key={i} style={styles.vendorItem}>
                                <View style={[styles.avatarCircle, styles.skeletonCircle]} />
                                <View style={styles.skeletonName} />
                            </View>
                        ))}
                    </ScrollView>
                </DetailCard>
            </View>
        );
    }

    if (!vendors || vendors.length === 0) return null;

    return (
        <View style={styles.container}>
            <DetailCard
                title="Top Sellers"
                badgeText="See All"
                onBadgePress={() => router.push('/suppliers' as any)}
                noPadding={true}
            >
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                >
                    {vendors.map((vendor) => {
                        const initial = (vendor.company_name || '?')[0].toUpperCase();
                        const avatarColor = getAvatarColor(vendor.company_name || '');

                        return (
                            <TouchableOpacity
                                key={vendor.id}
                                style={styles.vendorItem}
                                onPress={() => router.push(`/supplier/${vendor.url}` as any)}
                                activeOpacity={0.75}
                            >
                                {vendor.logo_url ? (
                                    <Image
                                        source={{ uri: vendor.logo_url }}
                                        style={styles.avatarCircle}
                                        resizeMode="cover"
                                    />
                                ) : (
                                    <View style={[styles.avatarCircle, { backgroundColor: avatarColor }]}>
                                        <Text style={styles.avatarInitial}>{initial}</Text>
                                    </View>
                                )}
                                <Text style={styles.vendorName} numberOfLines={2}>
                                    {vendor.company_name}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </DetailCard>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: theme.spacing.xs,
        marginBottom: theme.spacing.xs,
    },
    scrollContent: {
        paddingVertical: theme.spacing.sm,
        paddingHorizontal: theme.spacing.xs,
    },
    vendorItem: {
        alignItems: 'center',
        marginRight: theme.spacing.md,
        width: 72,
    },
    avatarCircle: {
        width: 68,
        height: 68,
        borderRadius: 34,
        backgroundColor: '#E8E8E8',
        justifyContent: 'center',
        alignItems: 'center',
        // Subtle shadow for depth
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.10,
        shadowRadius: 4,
        elevation: 3,
        overflow: 'hidden',
    },
    avatarInitial: {
        fontSize: 26,
        fontWeight: '700',
        color: '#FFFFFF',
        fontFamily: 'Inter',
    },
    vendorName: {
        marginTop: 6,
        fontSize: 11,
        fontWeight: '500',
        color: theme.colors.text?.primary || '#1A1A1A',
        textAlign: 'center',
        lineHeight: 15,
        fontFamily: 'Inter',
    },
    // Skeleton placeholders
    skeletonCircle: {
        backgroundColor: '#EBEBEB',
    },
    skeletonName: {
        marginTop: 6,
        width: 52,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#EBEBEB',
    },
});
