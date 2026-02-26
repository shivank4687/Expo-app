import InlineDropdown, { DropdownOption } from '@/features/supplier-panel/components/InlineDropdown';
import {
    getSupplierTaxProfile,
    SupplierTaxProfilePayload,
    updateSupplierTaxProfile,
} from '@/features/supplier-panel/profile/api/supplier-tax-profile.api';
import { coreApi, Country } from '@/services/api/core.api';
import { PickerItem, PickerModal } from '@/shared/components/PickerModal';
import { useToast } from '@/shared/components/Toast';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Text, TextInput, TextStyle, TouchableOpacity, View, ViewStyle } from 'react-native';

interface VatTaxesCardStyles {
    vatCard: ViewStyle;
    businessHeader: ViewStyle;
    businessIconBg: ViewStyle;
    businessTextContainer: ViewStyle;
    businessTitle: TextStyle;
    businessDescription: TextStyle;
    chevronContainer: ViewStyle;
    doneBadgeVat: ViewStyle;
    doneText: TextStyle;
    formSection: ViewStyle;
    inputRow: ViewStyle;
    vatLabel: TextStyle;
    inputLabel: TextStyle;
    inputChip: ViewStyle;
    inputField: TextStyle;
    smallInputField: ViewStyle;
    inputTextSmall: TextStyle;
    noticeText: TextStyle;
}

interface VatTaxesCardProps {
    expanded: boolean;
    onToggle: () => void;
    onStatusChange?: (completed: boolean) => void;
    onReady?: () => void;
    styles: VatTaxesCardStyles;
}

const fiscalRegimeOptions: DropdownOption[] = [
    {
        value: 'general_personas_morales',
        label: 'General de Ley Personas Morales',
    },
    {
        value: 'regimen_incorporacion_fiscal',
        label: 'Régimen de Incorporación Fiscal',
    },
];

const vatModeOptions: DropdownOption[] = [
    { value: '1', label: 'Yes, I have a Tax ID' },
    { value: '0', label: 'Not Applicable' },
];

const isVatProfileComplete = (
    businessType: string | null,
    vatMode: string | null,
    values: {
        rfc: string;
        regime: string | null;
        vatPercent: string;
        phone: string;
        address: string;
        city: string;
        region: string;
        postcode: string;
        country: string | null;
    }
): boolean => {
    if (!businessType) {
        return false;
    }

    if (vatMode === '0') {
        return true;
    }

    return !!(
        values.rfc.trim() &&
        values.regime &&
        values.vatPercent.trim() &&
        values.phone.trim() &&
        values.address.trim() &&
        values.city.trim() &&
        values.region.trim() &&
        values.postcode.trim() &&
        values.country
    );
};

export default function VatTaxesCard({
    expanded,
    onToggle,
    onStatusChange,
    onReady,
    styles,
}: VatTaxesCardProps) {
    const [rfc, setRfc] = useState('');
    const [selectedRegime, setSelectedRegime] = useState<string | null>(null);
    const [vatMode, setVatMode] = useState<string | null>(null);
    const [vatPercent, setVatPercent] = useState('16');
    const [address1, setAddress1] = useState('');
    const [city, setCity] = useState('');
    const [region, setRegion] = useState('');
    const [postcode, setPostcode] = useState('');
    const [taxPhone, setTaxPhone] = useState('');
    const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
    const [countries, setCountries] = useState<Country[]>([]);
    const [loadingCountries, setLoadingCountries] = useState(true);
    const [showCountryPicker, setShowCountryPicker] = useState(false);
    const [selectedBusinessOption, setSelectedBusinessOption] = useState<string | null>(null);
    const [loadingProfile, setLoadingProfile] = useState(true);
    const [savingProfile, setSavingProfile] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [hasSignaledReady, setHasSignaledReady] = useState(false);
    const { showToast } = useToast();
    useEffect(() => {
        onStatusChange?.(isSaved ? true : false)
    }, [isSaved]);
    useEffect(() => {
        if (selectedBusinessOption === 'company' && vatMode !== '1') {
            setVatMode('1');
        }
    }, [selectedBusinessOption, vatMode]);

    useEffect(() => {
        let isMounted = true;

        const fetchCountries = async () => {
            try {
                setLoadingCountries(true);
                const countriesData = await coreApi.getCountries();
                if (isMounted) {
                    setCountries(countriesData);
                }
            } catch (error) {
                console.error('Error fetching countries:', error);
            } finally {
                if (isMounted) {
                    setLoadingCountries(false);
                }
            }
        };

        fetchCountries();

        return () => {
            isMounted = false;
        };
    }, []);

    const countryItems: PickerItem[] = countries.map(country => ({
        label: country.name,
        value: country.code,
    }));

    const getSelectedCountryName = () => {
        const country = countries.find(c => c.code === selectedCountry);
        return country ? country.name : '';
    };

    const vatValues = {
        rfc,
        regime: selectedRegime,
        vatPercent,
        phone: taxPhone,
        address: address1,
        city,
        region,
        postcode,
        country: selectedCountry,
    };

    const isVatDetailsComplete = vatMode
        ? isVatProfileComplete(selectedBusinessOption ?? null, vatMode, vatValues)
        : false;

    const isBusinessTypeSelected = Boolean(selectedBusinessOption);

    useEffect(() => {
        let isMounted = true;

        const loadProfile = async () => {
            try {
                setLoadingProfile(true);
                const data = await getSupplierTaxProfile();
                if (!isMounted) {
                    return;
                }

                const businessType = data.business_type ?? null;
                const mode = data.tax_mode ? '1' : '0';
                setSelectedBusinessOption(businessType);
                setVatMode(mode);
                setRfc(data.tax_id ?? '');
                setSelectedRegime(data.fiscal_regime ?? null);
                setVatPercent(String(data.tax_percentage ?? 16));
                setTaxPhone(data.phone ?? '');
                setAddress1(data.address ?? '');
                setCity(data.city ?? '');
                setRegion(data.state ?? '');
                setPostcode(data.postcode ?? '');
                setSelectedCountry(data.country ?? null);
                setIsSaved(
                    isVatProfileComplete(businessType, mode, {
                        rfc: data.tax_id ?? '',
                        regime: data.fiscal_regime ?? null,
                        vatPercent: String(data.tax_percentage ?? 16),
                        phone: data.phone ?? '',
                        address: data.address ?? '',
                        city: data.city ?? '',
                        region: data.state ?? '',
                        postcode: data.postcode ?? '',
                        country: data.country ?? null,
                    })
                );
            } catch (error) {
                console.error('Error loading tax profile:', error);
                showToast({
                    message: 'Unable to load tax settings.',
                    type: 'error',
                });
            } finally {
                if (isMounted) {
                    setLoadingProfile(false);
                }
            }
        };

        loadProfile();

        return () => {
            isMounted = false;
        };
    }, [showToast]);

    useEffect(() => {
        if (!hasSignaledReady && !loadingCountries && !loadingProfile) {
            setHasSignaledReady(true);
            onReady?.();
        }
    }, [hasSignaledReady, loadingCountries, loadingProfile, onReady]);

    const handleSave = async () => {
        if (savingProfile || loadingProfile) {
            return;
        }

        if (!isBusinessTypeSelected) {
            showToast({
                message: 'Please select a business type before saving.',
                type: 'warning',
            });
            return;
        }

        if (!vatMode) {
            showToast({
                message: 'Please select a VAT mode before saving.',
                type: 'warning',
            });
            return;
        }

        if (!isVatDetailsComplete) {
            showToast({
                message: 'Complete all required VAT details before saving.',
                type: 'warning',
            });
            return;
        }

        const payload: SupplierTaxProfilePayload = {
            business_type: selectedBusinessOption ?? '',
            tax_mode: vatMode === '1',
            tax_id: rfc.trim() || '',
            tax_percentage: Number(vatPercent) || 16,
            fiscal_regime: selectedRegime ?? '',
            phone: taxPhone.trim() || null,
            address: address1.trim() || null,
            city: city.trim() || null,
            state: region.trim() || null,
            country: selectedCountry || null,
            postcode: postcode.trim() || null,
        };

        setSavingProfile(true);

        try {
            await updateSupplierTaxProfile(payload);
            setIsSaved(
                isVatProfileComplete(payload.business_type ?? null, payload.tax_mode ? '1' : '0', {
                    rfc: payload.tax_id,
                    regime: payload.fiscal_regime,
                    vatPercent: String(payload.tax_percentage ?? 0),
                    phone: payload.phone ?? '',
                    address: payload.address ?? '',
                    city: payload.city ?? '',
                    region: payload.state ?? '',
                    postcode: payload.postcode ?? '',
                    country: payload.country ?? null,
                })
            );
            showToast({
                message: 'Tax profile saved.',
                type: 'success',
            });
        } catch (error) {
            console.error('Error saving tax profile:', error);
            showToast({
                message: 'Unable to save tax settings.',
                type: 'error',
            });
        } finally {
            setSavingProfile(false);
        }
    };

    const businessOptions: DropdownOption[] = [
        {
            value: 'artisan',
            label: 'Artisan / Local shop / Independent professional',
        },
        {
            value: 'company',
            label: 'Company / Business',
        },
    ];

    return (
        <View style={styles.vatCard}>
            <TouchableOpacity
                style={styles.businessHeader}
                onPress={onToggle}
                activeOpacity={0.7}
            >
                <View style={styles.businessIconBg}>
                    <Ionicons name="receipt-outline" size={16} color="#FFFFFF" />
                </View>

                <View style={styles.businessTextContainer}>
                    <Text style={styles.businessTitle}>VAT and taxes</Text>
                    <Text style={styles.businessDescription}>Tax settings (only if applicable)</Text>
                </View>

                <View style={styles.headerActions}>
                    {isSaved ? (
                        <View style={styles.doneBadgeVat}>
                            <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
                            <Text style={styles.doneText}>Done</Text>
                        </View>
                    ) : (
                        <View style={styles.toBeCompletedBadge}>
                            <Text style={styles.toBeCompletedText}>To be completed</Text>
                        </View>
                    )}
                    <View style={styles.chevronContainer}>
                        <Ionicons
                            name={expanded ? 'chevron-up' : 'chevron-down'}
                            size={16}
                            color="#0A292D"
                        />
                    </View>
                </View>
            </TouchableOpacity>

            {expanded && (
                <View style={styles.formSection}>
                    {loadingProfile ? (
                        <View style={{ width: '100%', paddingVertical: 20, alignItems: 'center' }}>
                            <ActivityIndicator size="small" color="#00615E" />
                        </View>
                    ) : (
                        <>
                            <View style={styles.inputRow}>
                                <Text style={styles.vatLabel}>Type of business</Text>
                                <InlineDropdown
                                    options={businessOptions}
                                    value={selectedBusinessOption}
                                    onSelect={setSelectedBusinessOption}
                                    placeholder="Select type"
                                    style={{ container: { flex: 1 } }}
                                />
                            </View>
                            <View style={styles.inputRow}>
                                <Text style={styles.vatLabel}>VAT Mode</Text>
                                <InlineDropdown
                                    options={vatModeOptions}
                                    value={vatMode}
                                    onSelect={setVatMode}
                                    placeholder="Select"
                                    style={{ container: { flex: 1 } }}
                                    disabled={selectedBusinessOption === 'company'}
                                />
                            </View>

                            {vatMode === '1' && (
                                <>
                                    <Text style={styles.noticeText}>
                                        Recommended: If you don't have a Tax ID, use "Not Applicable" for frictionless selling. All fields below are required when VAT mode is set to "Yes, I have a Tax ID".
                                    </Text>
                                    <View style={styles.inputRow}>
                                        <Text style={styles.inputLabel}>RFC (Tax ID)</Text>
                                        <TextInput
                                            style={styles.inputField}
                                            placeholder="Enter RFC"
                                            placeholderTextColor="#7D8A8C"
                                            value={rfc}
                                            onChangeText={setRfc}
                                            autoCapitalize="characters"
                                        />
                                    </View>
                                    <View style={styles.inputRow}>
                                        <Text style={styles.inputLabel}>Fiscal regime</Text>
                                        <InlineDropdown
                                            options={fiscalRegimeOptions}
                                            value={selectedRegime}
                                            onSelect={(value) => setSelectedRegime(value)}
                                            placeholder="Select fiscal regime"
                                            style={{
                                                container: { flex: 1 },
                                            }}
                                        />
                                    </View>
                                    <View style={styles.inputRow}>
                                        <Text style={styles.inputLabel}>VAT (%)</Text>
                                        <TextInput
                                            style={[styles.inputField, styles.smallInputField]}
                                            placeholder="16"
                                            placeholderTextColor="#7D8A8C"
                                            value={vatPercent}
                                            onChangeText={setVatPercent}
                                            keyboardType="numeric"
                                        />
                                    </View>
                                    <View style={styles.inputRow}>
                                        <Text style={styles.inputLabel}>Phone</Text>
                                        <TextInput
                                            style={styles.inputField}
                                            placeholder="Enter phone number"
                                            placeholderTextColor="#7D8A8C"
                                            value={taxPhone}
                                            onChangeText={setTaxPhone}
                                            keyboardType="phone-pad"
                                            textContentType="telephoneNumber"
                                            autoComplete="tel"
                                        />
                                    </View>
                                    {/* <Text style={styles.vatLabel}>Address for VAT</Text> */}
                                    <View style={styles.inputRow}>
                                        <Text style={styles.inputLabel}>Address</Text>
                                        <TextInput
                                            style={styles.inputField}
                                            placeholder="Enter address"
                                            placeholderTextColor="#7D8A8C"
                                            value={address1}
                                            onChangeText={setAddress1}
                                            textContentType="streetAddressLine1"
                                            autoComplete="address-line1"
                                        />
                                    </View>
                                    <View style={styles.inputRow}>
                                        <Text style={styles.inputLabel}>City/Region</Text>
                                        <TextInput
                                            style={styles.inputField}
                                            placeholder="Enter city or region"
                                            placeholderTextColor="#7D8A8C"
                                            value={city}
                                            onChangeText={setCity}
                                            textContentType="addressCity"
                                            autoComplete="address-level2"
                                        />
                                    </View>
                                    <View style={styles.inputRow}>
                                        <Text style={styles.inputLabel}>State/Province</Text>
                                        <TextInput
                                            style={styles.inputField}
                                            placeholder="Enter state or province"
                                            placeholderTextColor="#7D8A8C"
                                            value={region}
                                            onChangeText={setRegion}
                                            textContentType="addressState"
                                            autoComplete="off"
                                        />
                                    </View>
                                    <View style={styles.inputRow}>
                                        <Text style={styles.inputLabel}>Postcode</Text>
                                        <TextInput
                                            style={[styles.inputField, styles.smallInputField]}
                                            placeholder="Enter postcode"
                                            placeholderTextColor="#7D8A8C"
                                            value={postcode}
                                            onChangeText={setPostcode}
                                            keyboardType="numeric"
                                            textContentType="postalCode"
                                            autoComplete="postal-code"
                                        />
                                    </View>
                                    <View style={styles.inputRow}>
                                        <Text style={styles.inputLabel}>Country</Text>
                                        <TouchableOpacity
                                            style={[styles.inputField, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}
                                            onPress={() => setShowCountryPicker(true)}
                                            disabled={loadingCountries}
                                        >
                                            <Text style={{ color: selectedCountry ? '#0A292D' : '#7D8A8C', flex: 1 }} numberOfLines={1}>
                                                {loadingCountries
                                                    ? 'Loading...'
                                                    : (selectedCountry ? getSelectedCountryName() : 'Select country')
                                                }
                                            </Text>
                                            {loadingCountries ? (
                                                <ActivityIndicator size="small" color="#666666" />
                                            ) : (
                                                <Ionicons name="chevron-down" size={16} color="#666666" />
                                            )}
                                        </TouchableOpacity>
                                    </View>
                                </>
                            )}
                            <TouchableOpacity
                                style={styles.saveButton}
                                onPress={handleSave}
                                disabled={loadingProfile || savingProfile}
                            >
                                {savingProfile ? (
                                    <ActivityIndicator size="small" color="#FFFFFF" />
                                ) : (
                                    <Text style={styles.saveButtonText}>Save</Text>
                                )}
                            </TouchableOpacity>
                        </>
                    )}
                </View>
            )}
            <PickerModal
                visible={showCountryPicker}
                title="Select Country"
                items={countryItems}
                selectedValue={selectedCountry || ''}
                onSelect={(val) => {
                    setSelectedCountry(val);
                    setShowCountryPicker(false);
                }}
                onClose={() => setShowCountryPicker(false)}
                searchable
            />
        </View>
    );
}
