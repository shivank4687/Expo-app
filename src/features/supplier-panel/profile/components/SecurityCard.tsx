import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Switch,
    Text,
    TextStyle,
    TouchableOpacity,
    View,
    ViewStyle,
    StyleSheet,
    Alert,
} from 'react-native';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { updateSupplierSecurityThunk } from '@/store/slices/supplierAuthSlice';

// ---------------------------------------------------------------------------
// Static 2FA data — replace with real API data when backend is ready
// ---------------------------------------------------------------------------
const STATIC_2FA_DATA = {
    enabled: false,
    method: 'SMS', // 'SMS' | 'Email' | 'Authenticator App'
    phoneHint: '+52 *** *** 4821',
    description:
        'Add an extra layer of security to your account. When enabled, you will be asked for a verification code each time you log in.',
    lastUpdated: '2025-04-10',
};
// ---------------------------------------------------------------------------

interface SecurityCardStyles {
    contactCard: ViewStyle;       // reused card container style from parent
    businessHeader: ViewStyle;
    businessIconBg: ViewStyle;
    businessTextContainer: ViewStyle;
    businessTitle: TextStyle;
    businessDescription: TextStyle;
    chevronContainer: ViewStyle;
}

interface SecurityCardProps {
    expanded: boolean;
    onToggle: () => void;
    styles: SecurityCardStyles;
}

export default function SecurityCard({ expanded, onToggle, styles }: SecurityCardProps) {
    const dispatch = useAppDispatch();
    const supplier = useAppSelector(state => state.supplierAuth.supplier);
    
    // Local state for immediate UI responsiveness
    const [twoFactorEnabled, setTwoFactorEnabled] = React.useState(supplier?.two_factor_enabled ?? false);
    const [isUpdating, setIsUpdating] = React.useState(false);

    // Sync local state if Redux changes
    React.useEffect(() => {
        if (supplier) {
            setTwoFactorEnabled(!!supplier.two_factor_enabled);
        }
    }, [supplier]);

    const handleToggle2FA = async (value: boolean) => {
        try {
            setTwoFactorEnabled(value);
            setIsUpdating(true);

            const resultAction = await dispatch(updateSupplierSecurityThunk({ two_factor_enabled: value }));

            if (updateSupplierSecurityThunk.rejected.match(resultAction)) {
                // Revert on failure
                setTwoFactorEnabled(!value);
                Alert.alert('Error', resultAction.payload as string || 'Failed to update security settings.');
            }
        } catch (error) {
            setTwoFactorEnabled(!value);
            Alert.alert('Error', 'Something went wrong.');
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <View style={styles.contactCard}>
            {/* ── Card Header (always visible) ── */}
            <TouchableOpacity style={styles.businessHeader} onPress={onToggle} activeOpacity={0.7}>
                <View style={styles.businessIconBg}>
                    <Ionicons name="shield-checkmark-outline" size={16} color="#FFFFFF" />
                </View>

                <View style={styles.businessTextContainer}>
                    <Text style={styles.businessTitle}>Security</Text>
                    <Text style={styles.businessDescription}>Manage account security settings</Text>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
                    <View style={styles.chevronContainer}>
                        <Ionicons
                            name={expanded ? 'chevron-up' : 'chevron-down'}
                            size={16}
                            color="#0A292D"
                        />
                    </View>
                </View>
            </TouchableOpacity>

            {/* ── Expanded Body ── */}
            {expanded && (
                <View style={localStyles.body}>
                    {/* Divider */}
                    <View style={localStyles.divider} />

                    {/* 2FA Row */}
                    <View style={localStyles.settingRow}>
                        {/* Left: icon + text */}
                        <View style={localStyles.settingLeft}>
                            <View style={localStyles.settingIconBg}>
                                <Ionicons name="phone-portrait-outline" size={16} color="#00615E" />
                            </View>
                            <View style={localStyles.settingTextGroup}>
                                <Text style={localStyles.settingTitle}>Two-Factor Authentication</Text>
                                <Text style={localStyles.settingSubtitle}>
                                    {twoFactorEnabled
                                        ? `Active · via ${STATIC_2FA_DATA.method}`
                                        : 'Disabled · tap to enable'}
                                </Text>
                            </View>
                        </View>

                        {/* Right: toggle */}
                        <Switch
                            value={twoFactorEnabled}
                            onValueChange={handleToggle2FA}
                            disabled={isUpdating}
                            trackColor={{ false: '#E9E3D3', true: '#00615E' }}
                            thumbColor="#FFFFFF"
                            ios_backgroundColor="#E9E3D3"
                        />
                    </View>

                    {/* Info box — shown when 2FA is off */}
                    {!twoFactorEnabled && (
                        <View style={localStyles.infoBox}>
                            <Ionicons
                                name="information-circle-outline"
                                size={16}
                                color="#BB5625"
                                style={{ marginTop: 2 }}
                            />
                            <Text style={localStyles.infoText}>{STATIC_2FA_DATA.description}</Text>
                        </View>
                    )}

                    {/* Success box — shown when 2FA is on */}
                    {twoFactorEnabled && (
                        <View style={localStyles.successBox}>
                            <Ionicons
                                name="checkmark-circle-outline"
                                size={16}
                                color="#00615E"
                                style={{ marginTop: 2 }}
                            />
                            <View>
                                <Text style={localStyles.successText}>
                                    Verification codes are sent to
                                </Text>
                                <Text style={localStyles.successHighlight}>
                                    {supplier?.phone ? supplier.phone : STATIC_2FA_DATA.phoneHint}
                                </Text>
                            </View>
                        </View>
                    )}
                </View>
            )}
        </View>
    );
}

const localStyles = StyleSheet.create({
    body: {
        flexDirection: 'column',
        gap: 8,
        width: '100%',
    },
    divider: {
        width: '100%',
        height: 1,
        backgroundColor: '#EEEEEF',
    },
    settingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 4,
        gap: 8,
    },
    settingLeft: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    settingIconBg: {
        width: 36,
        height: 36,
        borderRadius: 8,
        backgroundColor: '#EDF7F6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    settingTextGroup: {
        flex: 1,
        flexDirection: 'column',
        gap: 2,
    },
    settingTitle: {
        fontFamily: 'Inter',
        fontWeight: '500',
        fontSize: 15,
        lineHeight: 20,
        color: '#000000',
    },
    settingSubtitle: {
        fontFamily: 'Inter',
        fontWeight: '400',
        fontSize: 12,
        lineHeight: 16,
        color: '#6B7280',
    },
    infoBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 6,
        backgroundColor: '#FFF8F3',
        borderWidth: 1,
        borderColor: '#F5D9C8',
        borderRadius: 8,
        padding: 10,
    },
    infoText: {
        flex: 1,
        fontFamily: 'Inter',
        fontWeight: '400',
        fontSize: 13,
        lineHeight: 18,
        color: '#6B3A1F',
    },
    successBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 6,
        backgroundColor: '#F0FCF8',
        borderWidth: 1,
        borderColor: '#B2DFDB',
        borderRadius: 8,
        padding: 10,
    },
    successText: {
        fontFamily: 'Inter',
        fontWeight: '400',
        fontSize: 13,
        lineHeight: 18,
        color: '#0A292D',
    },
    successHighlight: {
        fontFamily: 'Inter',
        fontWeight: '600',
        fontSize: 13,
        lineHeight: 18,
        color: '#00615E',
    },
});
