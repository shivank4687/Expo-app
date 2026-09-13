import React, { useState, useEffect } from 'react';
import {
    View,
    KeyboardAvoidingView,
    Platform,
    Keyboard,
    StyleProp,
    ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface StickyBottomContainerProps {
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
    minBottomPadding?: number;
}

export const StickyBottomContainer: React.FC<StickyBottomContainerProps> = ({
    children,
    style,
    minBottomPadding = 0,
}) => {
    const insets = useSafeAreaInsets();
    const [keyboardHeight, setKeyboardHeight] = useState(0);

    // Manually track keyboard height — KeyboardAvoidingView is unreliable
    // on Android with edgeToEdgeEnabled:true in app.json
    useEffect(() => {
        const show = Keyboard.addListener('keyboardDidShow', (e) => {
            if (Platform.OS === 'android') {
                setKeyboardHeight(e.endCoordinates.height);
            }
        });
        const hide = Keyboard.addListener('keyboardDidHide', () => {
            if (Platform.OS === 'android') {
                setKeyboardHeight(0);
            }
        });
        return () => {
            show.remove();
            hide.remove();
        };
    }, []);

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View
                style={[
                    style,
                    { paddingBottom: Math.max(insets.bottom, minBottomPadding) + keyboardHeight },
                ]}
            >
                {children}
            </View>
        </KeyboardAvoidingView>
    );
};
