import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchCountriesThunk } from '@/store/slices/coreSlice';
import { checkSupplierAuthThunk, updateSupplierEmail } from '@/store/slices/supplierAuthSlice';
import supplierAuthApi from '@/services/api/supplierAuth.api';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { useToast } from '@/shared/components/Toast';
import {
    ActivityIndicator,
    Text,
    TextInput,
    TextStyle,
    TouchableOpacity,
    View,
    ViewStyle,
} from 'react-native';

interface ApplicationDataCardStyles {
    contactCard: ViewStyle;
    businessHeader: ViewStyle;
    businessIconBg: ViewStyle;
    businessTextContainer: ViewStyle;
    businessTitle: TextStyle;
    businessDescription: TextStyle;
    chevronContainer: ViewStyle;
    formSection: ViewStyle;
    inputRow: ViewStyle;
    phoneLabel: TextStyle;
    emailLabel: TextStyle;
    inputField: TextStyle;
    smallInputField: ViewStyle;
}

interface ApplicationDataCardProps {
    expanded: boolean;
    onToggle: () => void;
    styles: ApplicationDataCardStyles;
}

export default function ApplicationDataCard({ expanded, onToggle, styles }: ApplicationDataCardProps) {
    const supplier = useAppSelector(state => state.supplierAuth.supplier);
    const dispatch = useAppDispatch();
    const countries = useAppSelector(state => state.core.countries);
    const isLoadingCountries = useAppSelector(state => state.core.isLoadingCountries);
    const { showToast } = useToast();

    const [isEditingEmail, setIsEditingEmail] = useState(false);
    const [emailInput, setEmailInput] = useState('');
    const [isSavingEmail, setIsSavingEmail] = useState(false);

    useEffect(() => {
        if (supplier?.phone_country_id) {
            dispatch(fetchCountriesThunk());
        }
        if (supplier?.email) {
            setEmailInput(supplier.email);
            setIsEditingEmail(false);
        } else {
            setIsEditingEmail(true);
        }
    }, [dispatch, supplier]);

    const getDialCode = () => {
        if (!supplier?.phone_country_id) return '';
        const country = (countries || []).find(c => String(c.id) === String(supplier.phone_country_id));
        return country?.dial_code ? `${country.dial_code}` : '';
    };

    const displayPhone = () => {
        if (!supplier?.phone) return 'Not provided';
        const dialCode = getDialCode();
        return dialCode ? `${dialCode} ${supplier.phone}` : supplier.phone;
    };

    const handleSaveEmail = async () => {
        if (!emailInput.trim()) {
            showToast({ message: 'Please enter a valid email address.', type: 'error' });
            return;
        }

        setIsSavingEmail(true);
        try {
            await supplierAuthApi.updateEmail(emailInput.trim());
            showToast({ message: 'Email updated successfully.', type: 'success' });
            setIsEditingEmail(false);

            // Update Redux state
            dispatch(updateSupplierEmail(emailInput.trim()));

            // Update local storage so it persists across reloads
            if (supplier) {
                const updatedSupplier = { ...supplier, email: emailInput.trim() };
                const { secureStorage } = await import('@/services/storage/secureStorage');
                const { STORAGE_KEYS } = await import('@/config/constants');
                await secureStorage.setItem(STORAGE_KEYS.SUPPLIER_DATA, JSON.stringify(updatedSupplier));
            }
        } catch (error: any) {
            const errorMessage = error?.response?.data?.message || 'Failed to update email. Please try again.';
            showToast({ message: errorMessage, type: 'error' });
        } finally {
            setIsSavingEmail(false);
        }
    };

    return (
        <View style={styles.contactCard}>
            <TouchableOpacity style={styles.businessHeader} onPress={onToggle} activeOpacity={0.7}>
                <View style={styles.businessIconBg}>
                    <Ionicons name="person-outline" size={16} color="#FFFFFF" />
                </View>

                <View style={styles.businessTextContainer}>
                    <Text style={styles.businessTitle}>Application data</Text>
                    <Text style={styles.businessDescription}>View your registered details</Text>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
                    <View style={styles.chevronContainer}>
                        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={16} color="#0A292D" />
                    </View>
                </View>
            </TouchableOpacity>

            {expanded && (
                <View style={styles.formSection}>
                    <View style={styles.inputRow}>
                        <Text style={styles.emailLabel}>Email</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                            <View style={{ flex: 1, height: 40, borderWidth: 1, borderColor: '#E1D9CF', borderRadius: 8, paddingHorizontal: 12, justifyContent: 'center', backgroundColor: supplier?.email && !isEditingEmail ? '#F3F0E7' : '#FFFFFF' }}>
                                {supplier?.email && !isEditingEmail ? (
                                    <Text style={{ fontFamily: 'Inter', fontSize: 14, color: '#0A292D' }}>
                                        {supplier.email}
                                    </Text>
                                ) : (
                                    <TextInput
                                        style={{ fontFamily: 'Inter', fontSize: 14, color: '#0A292D', flex: 1, padding: 0 }}
                                        value={emailInput}
                                        onChangeText={setEmailInput}
                                        placeholder="Enter your email"
                                        placeholderTextColor="#A09E9A"
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        editable={!isSavingEmail}
                                    />
                                )}
                            </View>
                            {(!supplier?.email || isEditingEmail) && (
                                <TouchableOpacity
                                    onPress={handleSaveEmail}
                                    disabled={isSavingEmail}
                                    style={{
                                        height: 40,
                                        paddingHorizontal: 16,
                                        backgroundColor: '#00615E',
                                        borderRadius: 8,
                                        justifyContent: 'center',
                                        alignItems: 'center'
                                    }}
                                >
                                    {isSavingEmail ? (
                                        <ActivityIndicator size="small" color="#FFFFFF" />
                                    ) : (
                                        <Text style={{ fontFamily: 'Inter-SemiBold', fontSize: 14, color: '#FFFFFF' }}>
                                            Save
                                        </Text>
                                    )}
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>

                    <View style={styles.inputRow}>
                        <Text style={styles.phoneLabel}>Phone</Text>
                        <View style={{ flex: 1, height: 40, borderWidth: 1, borderColor: '#E1D9CF', borderRadius: 8, paddingHorizontal: 12, justifyContent: 'center', backgroundColor: '#F3F0E7' }}>
                            {isLoadingCountries && supplier?.phone_country_id ? (
                                <ActivityIndicator size="small" color="#00615E" />
                            ) : (
                                <Text style={{ fontFamily: 'Inter', fontSize: 14, color: '#0A292D' }}>
                                    {displayPhone()}
                                </Text>
                            )}
                        </View>
                    </View>
                </View>
            )}
        </View>
    );
}
