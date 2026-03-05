import React from 'react';
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export type AlertVariant = 'danger' | 'warning' | 'info';

interface AlertAction {
    label: string;
    onPress: () => void;
    /** Defaults to 'default'. Use 'destructive' for the confirm button on dangerous actions. */
    style?: 'default' | 'destructive' | 'cancel';
}

interface ConfirmAlertModalProps {
    visible: boolean;
    onClose: () => void;
    /** Short title shown at the top, e.g. "Reject Quote" */
    title: string;
    /** Longer descriptive message body */
    message: string;
    /** Visual theme of the modal icon. Defaults to 'warning'. */
    variant?: AlertVariant;
    /**
     * Primary action button (confirm / destructive).
     * If omitted, only the cancel/close button is shown.
     */
    confirmAction?: AlertAction;
    /** Override label for the dismiss/cancel button. Defaults to "Cancel". */
    cancelLabel?: string;
}

const VARIANT_CONFIG: Record<
    AlertVariant,
    { icon: React.ComponentProps<typeof Ionicons>['name']; iconColor: string; bgColor: string }
> = {
    danger: {
        icon: 'alert-circle-outline',
        iconColor: '#E53935',
        bgColor: '#FFEBEE',
    },
    warning: {
        icon: 'warning-outline',
        iconColor: '#F57C00',
        bgColor: '#FFF3E0',
    },
    info: {
        icon: 'information-circle-outline',
        iconColor: '#0288D1',
        bgColor: '#E1F5FE',
    },
};

export function ConfirmAlertModal({
    visible,
    onClose,
    title,
    message,
    variant = 'warning',
    confirmAction,
    cancelLabel = 'Cancel',
}: ConfirmAlertModalProps) {
    const { icon, iconColor, bgColor } = VARIANT_CONFIG[variant];

    const handleConfirm = () => {
        onClose();
        confirmAction?.onPress();
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            statusBarTranslucent
            onRequestClose={onClose}
        >
            <TouchableOpacity
                style={s.backdrop}
                activeOpacity={1}
                onPress={onClose}
            >
                {/* Prevent touches on the card from closing the modal */}
                <TouchableOpacity
                    activeOpacity={1}
                    style={s.card}
                    onPress={() => { }}
                >
                    {/* Icon circle */}
                    <View style={[s.iconCircle, { backgroundColor: bgColor }]}>
                        <Ionicons name={icon} size={32} color={iconColor} />
                    </View>

                    {/* Title */}
                    <Text style={s.title}>{title}</Text>

                    {/* Message */}
                    <Text style={s.message}>{message}</Text>

                    {/* Buttons */}
                    <View style={s.btnRow}>
                        {/* Cancel button */}
                        <TouchableOpacity
                            style={[s.btn, s.cancelBtn]}
                            onPress={onClose}
                            activeOpacity={0.8}
                        >
                            <Text style={s.cancelBtnText}>{cancelLabel}</Text>
                        </TouchableOpacity>

                        {/* Confirm button (only if provided) */}
                        {confirmAction && (
                            <TouchableOpacity
                                style={[
                                    s.btn,
                                    confirmAction.style === 'destructive'
                                        ? s.destructiveBtn
                                        : s.defaultConfirmBtn,
                                ]}
                                onPress={handleConfirm}
                                activeOpacity={0.8}
                            >
                                <Text
                                    style={[
                                        s.confirmBtnText,
                                        confirmAction.style === 'destructive' && s.destructiveBtnText,
                                    ]}
                                >
                                    {confirmAction.label}
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </TouchableOpacity>
            </TouchableOpacity>
        </Modal>
    );
}

const s = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.50)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 28,
    },
    card: {
        width: '100%',
        backgroundColor: '#fff',
        borderRadius: 18,
        paddingHorizontal: 24,
        paddingTop: 28,
        paddingBottom: 22,
        alignItems: 'center',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.15,
                shadowRadius: 24,
            },
            android: {
                elevation: 16,
            },
        }),
    },
    iconCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 17,
        fontWeight: '700',
        color: '#111',
        textAlign: 'center',
        marginBottom: 8,
    },
    message: {
        fontSize: 14,
        color: '#555',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 24,
    },
    btnRow: {
        flexDirection: 'row',
        gap: 10,
        width: '100%',
    },
    btn: {
        flex: 1,
        paddingVertical: 13,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelBtn: {
        backgroundColor: '#F2F2F2',
    },
    cancelBtnText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#444',
    },
    defaultConfirmBtn: {
        backgroundColor: '#00615E',
    },
    destructiveBtn: {
        backgroundColor: '#FFEBEE',
        borderWidth: 1.5,
        borderColor: '#E53935',
    },
    confirmBtnText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#fff',
    },
    destructiveBtnText: {
        color: '#E53935',
    },
});
