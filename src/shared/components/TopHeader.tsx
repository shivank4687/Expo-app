import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Platform,
    StyleProp,
    ViewStyle,
    TextStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@features/supplier-panel/styles/colors';

interface TopHeaderProps {
    title: string;
    subtitle?: string;
    onBack?: () => void;
    showBackButton?: boolean;
    rightContent?: React.ReactNode;
    backgroundColor?: string;
    containerStyle?: StyleProp<ViewStyle>;
    titleStyle?: StyleProp<TextStyle>;
    subtitleStyle?: StyleProp<TextStyle>;
    rightContentStyle?: StyleProp<ViewStyle>;
}

const DEFAULT_PADDING_TOP = Platform.OS === 'ios' ? 60 : 40;

export const TopHeader: React.FC<TopHeaderProps> = ({
    title,
    subtitle,
    onBack,
    showBackButton = true,
    rightContent,
    backgroundColor,
    containerStyle,
    titleStyle,
    subtitleStyle,
    rightContentStyle,
}) => {
    const handleBack = () => {
        if (onBack) {
            onBack();
        }
    };

    return (
        <View
            style={[
                styles.header,
                { backgroundColor: backgroundColor ?? COLORS.background },
                containerStyle,
            ]}
        >
            <View style={styles.headerContent}>
                {showBackButton ? (
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={handleBack}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="arrow-back" size={18} color={COLORS.textPrimary} />
                    </TouchableOpacity>
                ) : (
                    <View style={styles.backButtonPlaceholder} />
                )}

                <View style={styles.titleContainer}>
                    <Text style={[styles.headerTitle, titleStyle]} numberOfLines={1}>
                        {title}
                    </Text>
                    {subtitle ? (
                        <Text style={[styles.subtitle, subtitleStyle]} numberOfLines={1}>
                            {subtitle}
                        </Text>
                    ) : null}
                </View>

                <View style={[styles.rightContent, rightContentStyle]}>
                    {rightContent ?? <View style={styles.backButtonPlaceholder} />}
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    header: {
        paddingTop: DEFAULT_PADDING_TOP,
        paddingBottom: 16,
        paddingHorizontal: 16,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    backButton: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: COLORS.white,
        alignItems: 'center',
        justifyContent: 'center',
    },
    backButtonPlaceholder: {
        width: 32,
        height: 32,
    },
    titleContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    headerTitle: {
        fontFamily: 'Inter',
        fontWeight: '400',
        fontSize: 16,
        color: '#000000',
    },
    subtitle: {
        fontFamily: 'Inter',
        fontWeight: '300',
        fontSize: 14,
        color: '#4B5563',
    },
    rightContent: {
        minWidth: 32,
        height: 32,
        alignItems: 'flex-end',
        justifyContent: 'center',
    },
});
