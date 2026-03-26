import React from 'react';
import { View, Text, StyleSheet, ViewProps, TouchableOpacity, StyleProp, ViewStyle } from 'react-native';
import { theme } from '@/theme';

interface DetailCardProps extends ViewProps {
    title?: string;
    badgeText?: string;
    onBadgePress?: () => void;
    children?: React.ReactNode;
    contentContainerStyle?: StyleProp<ViewStyle>;
}

export const DetailCard: React.FC<DetailCardProps> = ({
    title = 'Product details',
    badgeText = 'Copy',
    onBadgePress,
    children,
    style,
    contentContainerStyle,
    ...props
}) => {
    return (
        <View style={[styles.container, style]} {...props}>
            <View style={styles.header}>
                <View style={styles.titleContainer}>
                    <Text style={styles.title}>{title}</Text>
                </View>
                
                <TouchableOpacity 
                    style={styles.badge} 
                    onPress={onBadgePress} 
                    activeOpacity={0.7}
                    disabled={!onBadgePress}
                >
                    <Text style={styles.badgeText}>{badgeText}</Text>
                </TouchableOpacity>
            </View>
            
            <View style={[styles.content, contentContainerStyle]}>
                {children}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'column',
        alignItems: 'stretch',
        padding: 12,
        gap: 12,
        width: '100%',
        backgroundColor: theme.colors.white,
        borderWidth: 1,
        borderColor: theme.colors.border.light,
        borderRadius: theme.borderRadius.lg,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 0,
        gap: 12,
        height: 23,
        alignSelf: 'stretch',
    },
    titleContainer: {
        flexDirection: 'column',
        alignItems: 'flex-start',
        padding: 0,
        gap: 4,
        flexGrow: 1,
    },
    title: {
        fontFamily: 'Inter',
        fontWeight: '700',
        fontSize: 16,
        lineHeight: 16,
        color: '#000000',
    },
    badge: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 4,
        paddingHorizontal: 8,
        gap: 10,
        backgroundColor: 'rgba(0, 97, 94, 0.1)',
        borderRadius: 50,
    },
    badgeText: {
        fontFamily: 'Inter',
        fontWeight: '600',
        fontSize: 11,
        lineHeight: 15,
        color: '#00615E',
    },
    content: {
        flexGrow: 1,
        alignSelf: 'stretch',
    }
});

export default DetailCard;
