import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchCountriesThunk } from '@/store/slices/coreSlice';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Text,
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

    useEffect(() => {
        if (supplier?.phone_country_id) {
            dispatch(fetchCountriesThunk());
        }
    }, [dispatch, supplier?.phone_country_id]);

    const getDialCode = () => {
        if (!supplier?.phone_country_id) return '';
        const country = (countries || []).find(c => String(c.id) === String(supplier.phone_country_id));
        return country?.dial_code ? `+${country.dial_code}` : '';
    };

    const displayPhone = () => {
        if (!supplier?.phone) return 'Not provided';
        const dialCode = getDialCode();
        return dialCode ? `${dialCode} ${supplier.phone}` : supplier.phone;
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
                        <View style={{ flex: 1, height: 40, borderWidth: 1, borderColor: '#E1D9CF', borderRadius: 8, paddingHorizontal: 12, justifyContent: 'center', backgroundColor: '#F3F0E7' }}>
                            <Text style={{ fontFamily: 'Inter', fontSize: 14, color: '#0A292D' }}>
                                {supplier?.email || 'Not provided'}
                            </Text>
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
