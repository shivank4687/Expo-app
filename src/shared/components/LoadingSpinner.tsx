import React from 'react';
import { View, ActivityIndicator, StyleSheet, Modal } from 'react-native';
import { theme } from '@/theme';

interface LoadingSpinnerProps {
    size?: 'small' | 'large';
    color?: string;
    overlay?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
    size = 'large',
    color = theme.colors.primary[500],
    overlay = false,
}) => {
    const spinner = (
        <View style={[styles.container, overlay && styles.overlay]}>
            <ActivityIndicator size={size} color={color} />
        </View>
    );

    if (overlay) {
        return (
            <Modal transparent visible animationType="fade">
                {spinner}
            </Modal>
        );
    }

    return spinner;
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    overlay: {
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
    },
});

export default LoadingSpinner;
