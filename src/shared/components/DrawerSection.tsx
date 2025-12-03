import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/theme';
import { getAbsoluteImageUrl } from '@/shared/utils/imageUtils';

interface DrawerSectionProps {
    title: string;
    icon?: keyof typeof Ionicons.glyphMap;
    children: React.ReactNode;
    defaultExpanded?: boolean;
}

export const DrawerSection: React.FC<DrawerSectionProps> = ({
    title,
    icon,
    children,
    defaultExpanded = false,
}) => {
    const [expanded, setExpanded] = useState(defaultExpanded);

    return (
        <View style={styles.container}>
            <TouchableOpacity
                style={styles.header}
                onPress={() => setExpanded(!expanded)}
                activeOpacity={0.7}
            >
                <View style={styles.headerLeft}>
                    {icon && (
                        <Ionicons
                            name={icon}
                            size={20}
                            color={theme.colors.text.primary}
                            style={styles.icon}
                        />
                    )}
                    <Text style={styles.title}>{title}</Text>
                </View>
                <Ionicons
                    name={expanded ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color={theme.colors.text.secondary}
                />
            </TouchableOpacity>
            {expanded && <View style={styles.content}>{children}</View>}
        </View>
    );
};

interface DrawerItemProps {
    label: string;
    icon?: keyof typeof Ionicons.glyphMap;
    imageUrl?: string;
    onPress: () => void;
    badge?: string;
    rightText?: string;
    level?: number;
}

export const DrawerItem: React.FC<DrawerItemProps> = ({ label, icon, imageUrl, onPress, badge, rightText, level = 0 }) => {
    const imageSource = imageUrl !== undefined 
        ? (() => {
            const url = getAbsoluteImageUrl(imageUrl);
            return typeof url === 'string' ? { uri: url } : url;
        })()
        : null;
    
    return (
        <TouchableOpacity 
            style={[
                styles.item, 
                level > 0 && { paddingLeft: theme.spacing['2xl'] + (level * theme.spacing.lg) }
            ]} 
            onPress={onPress} 
            activeOpacity={0.7}
        >
            <View style={styles.itemLeft}>
                {imageSource ? (
                    <Image
                        source={imageSource}
                        style={styles.itemImage}
                    />
                ) : icon ? (
                    <Ionicons
                        name={icon}
                        size={18}
                        color={theme.colors.text.secondary}
                        style={styles.itemIcon}
                    />
                ) : null}
                <Text style={styles.itemLabel}>{label}</Text>
            </View>
            {rightText && (
                <Text style={styles.rightText}>{rightText}</Text>
            )}
            {badge && (
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>{badge}</Text>
                </View>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: theme.spacing.sm,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.lg,
        backgroundColor: theme.colors.gray[50],
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    icon: {
        marginRight: theme.spacing.sm,
    },
    title: {
        fontSize: theme.typography.fontSize.md,
        fontWeight: theme.typography.fontWeight.semiBold,
        color: theme.colors.text.primary,
    },
    content: {
        backgroundColor: theme.colors.white,
    },
    item: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: theme.spacing.sm,
        paddingHorizontal: theme.spacing.lg,
        paddingLeft: theme.spacing['2xl'],
    },
    itemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    itemIcon: {
        marginRight: theme.spacing.sm,
    },
    itemImage: {
        width: 32,
        height: 32,
        borderRadius: 16,
        marginRight: theme.spacing.sm,
        backgroundColor: theme.colors.gray[200],
    },
    itemLabel: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.text.secondary,
    },
    rightText: {
        fontSize: theme.typography.fontSize.xs,
        color: theme.colors.primary[500],
        fontWeight: theme.typography.fontWeight.medium,
        marginLeft: theme.spacing.sm,
    },
    badge: {
        backgroundColor: theme.colors.primary[500],
        borderRadius: 10,
        paddingHorizontal: 8,
        paddingVertical: 2,
        minWidth: 20,
        alignItems: 'center',
    },
    badgeText: {
        fontSize: theme.typography.fontSize.xs,
        color: theme.colors.white,
        fontWeight: theme.typography.fontWeight.semiBold,
    },
});
