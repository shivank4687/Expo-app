import React, { useEffect, useRef } from 'react';
import { TouchableOpacity, Animated, StyleSheet, View } from 'react-native';

interface ToggleSliderProps {
    isActive: boolean;
    onToggle: () => void;
    size?: number;
}

export const ToggleSlider: React.FC<ToggleSliderProps> = ({
    isActive,
    onToggle,
    size = 24,
}) => {
    const slideAnim = useRef(new Animated.Value(isActive ? 1 : 0)).current;

    useEffect(() => {
        Animated.timing(slideAnim, {
            toValue: isActive ? 1 : 0,
            duration: 200,
            useNativeDriver: true,
        }).start();
    }, [isActive, slideAnim]);

    const backgroundColor = slideAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['#666666', '#00615E'],
    });

    const translateX = slideAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [2, size - 10], // 2px padding on left, size - circle size - padding on right
    });

    return (
        <TouchableOpacity
            onPress={onToggle}
            activeOpacity={0.7}
            style={[styles.container, { width: size, height: size }]}
        >
            <Animated.View
                style={[
                    styles.track,
                    {
                        backgroundColor,
                        width: size,
                        height: size * 0.67, // 16px for 24px size
                        borderRadius: size * 0.335,
                    },
                ]}
            >
                <Animated.View
                    style={[
                        styles.thumb,
                        {
                            width: size * 0.33, // 8px for 24px size
                            height: size * 0.33,
                            borderRadius: size * 0.165,
                            transform: [{ translateX }],
                        },
                    ]}
                />
            </Animated.View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    track: {
        justifyContent: 'center',
        position: 'relative',
    },
    thumb: {
        backgroundColor: '#FFFFFF',
        position: 'absolute',
    },
});

export default ToggleSlider;
