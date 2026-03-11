import { SupplierAddress, SupplierAddressUpdateData, getSupplierAddress, updateSupplierAddress } from '@/features/supplier-panel/shop/api/supplier-address.api';
import { PickerItem, PickerModal } from '@/shared/components/PickerModal';
import { useToast } from '@/shared/components/Toast';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchCountriesThunk } from '@/store/slices/coreSlice';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Text,
    TextInput,
    TextStyle,
    TouchableOpacity,
    View,
    ViewStyle,
} from 'react-native';
import { markContactUpdated } from '@/features/supplier-panel/profile/contactUpdateTracker';

interface ContactCardStyles {
    contactCard: ViewStyle;
    businessHeader: ViewStyle;
    businessIconBg: ViewStyle;
    businessTextContainer: ViewStyle;
    businessTitle: TextStyle;
    businessDescription: TextStyle;
    chevronContainer: ViewStyle;
    headerActions: ViewStyle;
    formSection: ViewStyle;
    inputRow: ViewStyle;
    phoneLabel: TextStyle;
    emailLabel: TextStyle;
    addressLabel: TextStyle;
    noticeText: TextStyle;
    toBeCompletedBadge: ViewStyle;
    toBeCompletedText: TextStyle;
    doneBadge: ViewStyle;
    doneText: TextStyle;
    inputLabel: TextStyle;
    inputField: TextStyle;
    smallInputField: ViewStyle;
    saveButton: ViewStyle;
    saveButtonText: TextStyle;
}

interface ContactCardProps {
    expanded: boolean;
    onToggle: () => void;
    onStatusChange?: (done: boolean) => void;
    onReady?: () => void;
    styles: ContactCardStyles;
}

const isAddressComplete = (address: SupplierAddress | null | undefined): boolean => {
    if (!address) {
        return false;
    }

    return !!(
        address.phone?.trim() &&
        address.address1?.trim() &&
        address.city?.trim() &&
        address.state?.trim() &&
        address.postcode?.trim() &&
        address.country?.trim()
    );
};

export default function ContactCard({ expanded, onToggle, onStatusChange, onReady, styles }: ContactCardProps) {
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [address1, setAddress1] = useState('');
    const [address2, setAddress2] = useState('');
    const [city, setCity] = useState('');
    const [region, setRegion] = useState('');
    const [postcode, setPostcode] = useState('');
    const dispatch = useAppDispatch();
    const countries = useAppSelector(state => state.core.countries);
    const isLoadingCountries = useAppSelector(state => state.core.isLoadingCountries);
    const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
    const [showCountryPicker, setShowCountryPicker] = useState(false);
    const [loadingAddress, setLoadingAddress] = useState(true);
    const [savingAddress, setSavingAddress] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [hasSignaledReady, setHasSignaledReady] = useState(false);
    const { showToast } = useToast();
    useEffect(() => {
        onStatusChange?.(isSaved ? true : false);
    }, [isSaved]);

    useEffect(() => {
        if (!hasSignaledReady && !isLoadingCountries && !loadingAddress) {
            setHasSignaledReady(true);
            onReady?.();
        }
    }, [hasSignaledReady, isLoadingCountries, loadingAddress, onReady]);

    useEffect(() => {
        dispatch(fetchCountriesThunk());
    }, [dispatch]);

    useEffect(() => {
        let isMounted = true;

        const loadAddress = async () => {
            try {
                setLoadingAddress(true);
                const addressData = await getSupplierAddress();
                if (!isMounted) {
                    return;
                }

                setPhone(addressData.phone ?? '');
                setAddress1(addressData.address1 ?? '');
                setAddress2(addressData.address2 ?? '');
                setCity(addressData.city ?? '');
                setRegion(addressData.state ?? '');
                setPostcode(addressData.postcode ?? '');
                setSelectedCountry(addressData.country ?? null);
                setIsSaved(isAddressComplete(addressData));
            } catch (error) {
                console.error('Error loading supplier address:', error);
                showToast({
                    message: 'Unable to load contact information.',
                    type: 'error',
                });
            } finally {
                if (isMounted) {
                    setLoadingAddress(false);
                }
            }
        };

        loadAddress();

        return () => {
            isMounted = false;
        };
    }, [showToast]);

    const handleSave = async () => {
        if (savingAddress || loadingAddress) {
            return;
        }

        if (
            !phone.trim() ||
            !address1.trim() ||
            !city.trim() ||
            !region.trim() ||
            !postcode.trim() ||
            !selectedCountry
        ) {
            showToast({
                message: 'Fill every required address field before saving.',
                type: 'warning',
            });
            return;
        }

        setSavingAddress(true);

        const payload: SupplierAddressUpdateData = {
            phone: phone.trim(),
            address1: address1.trim(),
            //address2: address2.trim() || undefined,
            city: city.trim(),
            country: selectedCountry,
            state: region.trim(),
            postcode: postcode.trim(),
        };

        try {
            const updatedAddress = await updateSupplierAddress(payload);
            setPhone(updatedAddress.phone ?? '');
            setAddress1(updatedAddress.address1 ?? '');
            //setAddress2(updatedAddress.address2 ?? '');
            setCity(updatedAddress.city ?? '');
            setRegion(updatedAddress.state ?? '');
            setPostcode(updatedAddress.postcode ?? '');
            setSelectedCountry(updatedAddress.country ?? null);
            setIsSaved(isAddressComplete(updatedAddress));

            showToast({
                message: 'Address saved successfully.',
                type: 'success',
            });
            markContactUpdated();
        } catch (error) {
            console.error('Error saving supplier address:', error);
            showToast({
                message: 'Unable to update address. Please try again.',
                type: 'error',
            });
        } finally {
            setSavingAddress(false);
        }
    };

    const countryItems: PickerItem[] = (countries || []).map(country => ({
        label: country.name,
        value: country.code,
    }));

    const getSelectedCountryName = () => {
        const country = (countries || []).find(c => c.code === selectedCountry);
        return country ? country.name : '';
    };

    return (
        <View style={styles.contactCard}>
            <TouchableOpacity style={styles.businessHeader} onPress={onToggle} activeOpacity={0.7}>
                <View style={styles.businessIconBg}>
                    <Ionicons name="call-outline" size={16} color="#FFFFFF" />
                </View>

                <View style={styles.businessTextContainer}>
                    <Text style={styles.businessTitle}>Contact</Text>
                    <Text style={styles.businessDescription}>Fill in or change contact details</Text>
                </View>

                <View style={styles.headerActions}>
                    {isSaved ? (
                        <View style={styles.doneBadge}>
                            <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
                            <Text style={styles.doneText}>Done</Text>
                        </View>
                    ) : (
                        <View style={styles.toBeCompletedBadge}>
                            <Text style={styles.toBeCompletedText}>To be completed</Text>
                        </View>
                    )}
                    <View style={styles.chevronContainer}>
                        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={16} color="#0A292D" />
                    </View>
                </View>
            </TouchableOpacity>

            {expanded && (
                <View style={styles.formSection}>
                    {loadingAddress ? (
                        <View style={{ width: '100%', paddingVertical: 20, alignItems: 'center' }}>
                            <ActivityIndicator size="small" color="#00615E" />
                        </View>
                    ) : (
                        <>
                            <View style={styles.inputRow}>
                                <Text style={styles.phoneLabel}>Phone</Text>
                                <TextInput
                                    style={styles.inputField as any}
                                    placeholder="Enter phone"
                                    placeholderTextColor="#7D8A8C"
                                    keyboardType="phone-pad"
                                    value={phone}
                                    onChangeText={setPhone}
                                    textContentType="telephoneNumber"
                                    autoComplete="tel"
                                />
                            </View>

                            {/* <View style={styles.inputRow}>
                                <Text style={styles.emailLabel}>Email</Text>
                                <TextInput
                                    style={styles.inputField}
                                    placeholder="Enter email"
                                    placeholderTextColor="#7D8A8C"
                                    keyboardType="email-address"
                                    value={email}
                                    onChangeText={setEmail}
                                    textContentType="emailAddress"
                                    autoComplete="email"
                                    autoCapitalize="none"
                                />
                            </View> */}

                            {/* <Text style={styles.inputLabel}>Address</Text> */}
                            <View style={styles.inputRow}>
                                <Text style={styles.addressLabel}>Street</Text>
                                <TextInput
                                    style={styles.inputField as any}
                                    placeholder="Enter address"
                                    placeholderTextColor="#7D8A8C"
                                    value={address1}
                                    onChangeText={setAddress1}
                                    textContentType="streetAddressLine1"
                                    autoComplete="address-line1"
                                />
                            </View>
                            {/* <View style={styles.inputRow}>
                                <Text style={styles.addressLabel}>Street 2</Text>
                                <TextInput
                                    style={styles.inputField}
                                    placeholder="Optional"
                                    placeholderTextColor="#7D8A8C"
                                    value={address2}
                                    onChangeText={setAddress2}
                                    textContentType="streetAddressLine2"
                                    autoComplete="address-line2"
                                />
                            </View> */}
                            <View style={styles.inputRow}>
                                <Text style={styles.addressLabel}>City</Text>
                                <TextInput
                                    style={styles.inputField as any}
                                    placeholder="Enter city"
                                    placeholderTextColor="#7D8A8C"
                                    value={city}
                                    onChangeText={setCity}
                                    textContentType="addressCity"
                                    autoComplete="address-line2"
                                />
                            </View>
                            <View style={styles.inputRow}>
                                <Text style={styles.addressLabel}>State</Text>
                                <TextInput
                                    style={styles.inputField as any}
                                    placeholder="Enter state/province"
                                    placeholderTextColor="#7D8A8C"
                                    value={region}
                                    onChangeText={setRegion}
                                    textContentType="addressState"
                                    autoComplete="address-line1"
                                />
                            </View>
                            <View style={styles.inputRow}>
                                <Text style={styles.addressLabel}>Postcode</Text>
                                <TextInput
                                    style={[styles.inputField, styles.smallInputField] as any}
                                    placeholder="Enter code"
                                    placeholderTextColor="#7D8A8C"
                                    value={postcode}
                                    onChangeText={setPostcode}
                                    keyboardType="numeric"
                                    textContentType="postalCode"
                                    autoComplete="postal-code"
                                />
                            </View>
                            <View style={styles.inputRow}>
                                <Text style={styles.addressLabel}>Country</Text>
                                <TouchableOpacity
                                    style={[styles.inputField, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}
                                    onPress={() => setShowCountryPicker(true)}
                                    disabled={isLoadingCountries}
                                >
                                    <Text style={{ color: selectedCountry ? '#0A292D' : '#7D8A8C', flex: 1 }} numberOfLines={1}>
                                        {isLoadingCountries
                                            ? 'Loading...'
                                            : (selectedCountry ? getSelectedCountryName() : 'Select country')}
                                    </Text>
                                    {isLoadingCountries ? (
                                        <ActivityIndicator size="small" color="#666666" />
                                    ) : (
                                        <Ionicons name="chevron-down" size={16} color="#666666" />
                                    )}
                                </TouchableOpacity>
                            </View>
                            <TouchableOpacity
                                style={[
                                    styles.saveButton,
                                    (loadingAddress || savingAddress) && { opacity: 0.6 },
                                ]}
                                onPress={handleSave}
                                disabled={loadingAddress || savingAddress}
                            >
                                {savingAddress ? (
                                    <ActivityIndicator size="small" color="#FFFFFF" />
                                ) : (
                                    <Text style={styles.saveButtonText}>Save</Text>
                                )}
                            </TouchableOpacity>
                            <Text style={styles.noticeText}>Used for returns and shipment validation</Text>
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
