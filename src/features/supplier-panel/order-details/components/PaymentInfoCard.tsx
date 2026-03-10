import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { COLORS } from '../../styles/colors';
import { OrderDetails } from '../../orders/api/orders.api';
import { regenerateOxxoVoucher } from '../api/payment.api';
import { useToast } from '../../../../shared/components/Toast/ToastContext';

interface PaymentInfoCardProps {
    order: OrderDetails;
    onVoucherRegenerated?: (newPaymentData: any) => void;
}

export const PaymentInfoCard = ({ order, onVoucherRegenerated }: PaymentInfoCardProps) => {
    const [isRegenerating, setIsRegenerating] = useState(false);
    const { showToast } = useToast();

    if (!order.payment) return null;

    const { method, method_title, additional } = order.payment;
    const isOxxo = method === 'stripeoxxo';

    // Check if voucher is expired
    let isExpired = false;
    let expiryDateObj = null;
    let timeRemainingHours = 0;

    if (isOxxo && additional?.voucher_expires_at) {
        expiryDateObj = new Date(additional.voucher_expires_at);
        const now = new Date();
        isExpired = expiryDateObj < now;
        timeRemainingHours = (expiryDateObj.getTime() - now.getTime()) / (1000 * 60 * 60);
    }

    const handleCopyVoucher = async () => {
        if (additional?.voucher_number) {
            await Clipboard.setStringAsync(additional.voucher_number);
            showToast({ message: 'Voucher number copied to clipboard', type: 'success' });
        }
    };

    const handleOpenVoucher = async () => {
        if (additional?.voucher_url) {
            const supported = await Linking.canOpenURL(additional.voucher_url);
            if (supported) {
                await Linking.openURL(additional.voucher_url);
            } else {
                showToast({ message: "Don't know how to open this URL", type: 'error' });
            }
        }
    };

    const handleRegenerate = async () => {
        try {
            setIsRegenerating(true);
            const response: any = await regenerateOxxoVoucher(order.id);
            if (response.data?.payment && onVoucherRegenerated) {
                onVoucherRegenerated(response.data.payment);
                showToast({ message: 'Voucher regenerated successfully', type: 'success' });
            }
        } catch (error: any) {
            console.error('Failed to regenerate voucher:', error);
            showToast({
                message: error?.response?.data?.message || error?.message || 'Failed to regenerate voucher',
                type: 'error'
            });
        } finally {
            setIsRegenerating(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Ionicons name="card-outline" size={20} color={COLORS.primary} />
                <Text style={styles.title}>Payment Information</Text>
            </View>

            <View style={styles.content}>
                <View style={styles.row}>
                    <Text style={styles.label}>Method</Text>
                    <Text style={styles.value}>{method_title || method || 'N/A'}</Text>
                </View>

                {isOxxo && additional && (
                    <View style={styles.oxxoContainer}>
                        <View style={styles.divider} />

                        <View style={styles.row}>
                            <Text style={styles.label}>OXXO Voucher</Text>
                            <TouchableOpacity onPress={handleCopyVoucher} style={styles.copyRow}>
                                <Text style={styles.voucherNumber}>{additional.voucher_number}</Text>
                                <Ionicons name="copy-outline" size={14} color={COLORS.primary} />
                            </TouchableOpacity>
                        </View>

                        {expiryDateObj && (
                            <View style={styles.row}>
                                <Text style={styles.label}>Expires At</Text>
                                <Text style={[
                                    styles.expiryValue,
                                    isExpired ? styles.expiredText : (timeRemainingHours < 24 ? styles.expiringSoonText : styles.validText)
                                ]}>
                                    {expiryDateObj.toLocaleString()}
                                    {isExpired ? ' (Expired)' : ''}
                                </Text>
                            </View>
                        )}

                        <View style={styles.actionsContainer}>
                            <TouchableOpacity
                                style={styles.viewButton}
                                onPress={handleOpenVoucher}
                            >
                                <Ionicons name="open-outline" size={16} color={COLORS.primary} />
                                <Text style={styles.viewButtonText}>View Voucher</Text>
                            </TouchableOpacity>

                            {isExpired && (
                                <TouchableOpacity
                                    style={[styles.regenerateButton, isRegenerating && styles.regenerateButtonDisabled]}
                                    onPress={handleRegenerate}
                                    disabled={isRegenerating}
                                >
                                    {isRegenerating ? (
                                        <ActivityIndicator size="small" color="#FFFFFF" />
                                    ) : (
                                        <>
                                            <Ionicons name="refresh-outline" size={16} color="#FFFFFF" />
                                            <Text style={styles.regenerateButtonText}>Regenerate</Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: '#E9E3D3',
        borderRadius: 8,
        padding: 16,
        gap: 16,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    title: {
        fontFamily: 'Inter',
        fontWeight: '600',
        fontSize: 16,
        color: '#111827',
    },
    content: {
        gap: 12,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    label: {
        fontFamily: 'Inter',
        fontSize: 14,
        color: '#6B7280',
        flex: 1,
    },
    value: {
        fontFamily: 'Inter',
        fontWeight: '500',
        fontSize: 14,
        color: '#111827',
        flex: 2,
        textAlign: 'right',
    },
    oxxoContainer: {
        gap: 12,
        marginTop: 4,
    },
    divider: {
        height: 1,
        backgroundColor: '#F3F4F6',
        marginVertical: 4,
    },
    copyRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        flex: 2,
        justifyContent: 'flex-end',
    },
    voucherNumber: {
        fontFamily: 'Menlo', // Monospace for numbers
        fontWeight: '600',
        fontSize: 14,
        color: '#111827',
        letterSpacing: 1,
    },
    expiryValue: {
        fontFamily: 'Inter',
        fontWeight: '500',
        fontSize: 14,
        flex: 2,
        textAlign: 'right',
    },
    expiredText: {
        color: '#EF4444',
    },
    expiringSoonText: {
        color: '#F59E0B',
    },
    validText: {
        color: '#10B981',
    },
    actionsContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 12,
        marginTop: 8,
    },
    viewButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: COLORS.primary,
        borderRadius: 6,
        backgroundColor: '#F0FDF4',
    },
    viewButtonText: {
        fontFamily: 'Inter',
        fontWeight: '500',
        fontSize: 14,
        color: COLORS.primary,
    },
    regenerateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 8,
        paddingHorizontal: 16,
        backgroundColor: '#EF4444',
        borderRadius: 6,
    },
    regenerateButtonDisabled: {
        opacity: 0.7,
    },
    regenerateButtonText: {
        fontFamily: 'Inter',
        fontWeight: '500',
        fontSize: 14,
        color: '#FFFFFF',
    },
});
