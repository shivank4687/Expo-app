import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    LayoutAnimation,
    Platform,
    UIManager,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/theme';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface AccordionProps {
    title: string;
    children: React.ReactNode;
    defaultExpanded?: boolean;
    style?: any;
    titleStyle?: any;
    contentStyle?: any;
}

/**
 * Accordion Component
 * A collapsible/expandable panel for organizing content
 * Perfect for product descriptions, FAQs, and other long content
 */
export const Accordion: React.FC<AccordionProps> = ({
    title,
    children,
    defaultExpanded = false,
    style,
    titleStyle,
    contentStyle,
}) => {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);

    const toggleExpand = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setIsExpanded(!isExpanded);
    };

    return (
        <View style={[styles.container, style]}>
            <TouchableOpacity
                style={styles.header}
                onPress={toggleExpand}
                activeOpacity={0.7}
            >
                <Text style={[styles.title, titleStyle]}>{title}</Text>
                <Ionicons
                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                    size={24}
                    color={theme.colors.text.secondary}
                />
            </TouchableOpacity>

            {isExpanded && (
                <View style={[styles.content, contentStyle]}>
                    {children}
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        borderWidth: 1,
        borderColor: theme.colors.border.main,
        borderRadius: theme.borderRadius.md,
        marginBottom: theme.spacing.md,
        backgroundColor: theme.colors.white,
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: theme.spacing.md,
        backgroundColor: theme.colors.background.paper,
    },
    title: {
        flex: 1,
        fontSize: theme.typography.fontSize.base,
        fontWeight: theme.typography.fontWeight.semiBold,
        color: theme.colors.text.primary,
    },
    content: {
        padding: theme.spacing.md,
        paddingTop: theme.spacing.sm,
    },
});

export default Accordion;

