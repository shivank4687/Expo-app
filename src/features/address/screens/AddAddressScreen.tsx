import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    Platform,
} from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { addressApi } from '@/services/api/address.api';
import { coreApi, Country, State } from '@/services/api/core.api';
import { AddressFormData } from '../types/address.types';
import { theme } from '@/theme';
import { useToast } from '@/shared/components/Toast';
import { PickerModal, PickerItem } from '@/shared/components/PickerModal';

export const AddAddressScreen: React.FC = () => {
    const router = useRouter();
    const { showToast } = useToast();
    const { id } = useLocalSearchParams<{ id?: string }>();
    const isEditMode = !!id;

    // Form state
    const [formData, setFormData] = useState<AddressFormData>({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        company_name: '',
        address1: [''],
        vat_id: '',
        postcode: '',
        country: '',
        state: '',
        city: '',
        default_address: false,
    });

    // Validation errors
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Loading states
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [countries, setCountries] = useState<Country[]>([]);
    const [states, setStates] = useState<State[]>([]);
    const [loadingStates, setLoadingStates] = useState(false);
    
    // Modal states
    const [showCountryPicker, setShowCountryPicker] = useState(false);
    const [showStatePicker, setShowStatePicker] = useState(false);

    // Load countries on mount
    useEffect(() => {
        loadCountries();
        if (isEditMode) {
            loadAddress();
        }
    }, []);

    // Load states when country changes
    useEffect(() => {
        if (formData.country) {
            loadStates(formData.country);
        } else {
            setStates([]);
            setFormData(prev => ({ ...prev, state: '' }));
        }
    }, [formData.country]);

    const loadCountries = async () => {
        try {
            const data = await coreApi.getCountries();
            console.log('[AddAddressScreen] Loaded countries:', data.length);
            setCountries(data);
        } catch (error) {
            console.error('[AddAddressScreen] Error loading countries:', error);
            showToast({ message: 'Failed to load countries', type: 'error' });
        }
    };

    const loadStates = async (countryCode: string) => {
        try {
            setLoadingStates(true);
            const data = await coreApi.getStatesByCountry(countryCode);
            setStates(data);
        } catch (error) {
            console.error('[AddAddressScreen] Error loading states:', error);
            setStates([]);
        } finally {
            setLoadingStates(false);
        }
    };

    const loadAddress = async () => {
        if (!id) return;
        
        try {
            setIsLoading(true);
            const address = await addressApi.getAddressById(parseInt(id));
            
            // API returns 'address' field, but form expects 'address1'
            const addressLines = address.address || address.address1 || [];
            const normalizedAddress = Array.isArray(addressLines) 
                ? addressLines 
                : [addressLines];
            
            setFormData({
                first_name: address.first_name,
                last_name: address.last_name,
                email: address.email || '', // Email may not be returned by API
                phone: address.phone,
                company_name: address.company_name || '',
                address1: normalizedAddress.length > 0 ? normalizedAddress : [''],
                vat_id: address.vat_id || '',
                postcode: address.postcode,
                country: address.country,
                state: address.state,
                city: address.city,
                default_address: address.default_address || address.is_default || false,
            });
        } catch (error: any) {
            console.error('[AddAddressScreen] Error loading address:', error);
            showToast({ message: error.message || 'Failed to load address', type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        // Required fields
        if (!formData.first_name.trim()) {
            newErrors.first_name = 'First name is required';
        }
        if (!formData.last_name.trim()) {
            newErrors.last_name = 'Last name is required';
        }
        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Email is invalid';
        }
        if (!formData.phone.trim()) {
            newErrors.phone = 'Phone number is required';
        }
        if (!formData.address1[0]?.trim()) {
            newErrors.address1 = 'Street address is required';
        }
        if (!formData.country) {
            newErrors.country = 'Country is required';
        }
        if (!formData.state.trim()) {
            newErrors.state = 'State is required';
        }
        if (!formData.city.trim()) {
            newErrors.city = 'City is required';
        }
        if (!formData.postcode.trim()) {
            newErrors.postcode = 'Postal code is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = async () => {
        if (!validateForm()) {
            showToast({ message: 'Please fix the errors in the form', type: 'error' });
            return;
        }

        try {
            setIsSaving(true);
            
            if (isEditMode && id) {
                await addressApi.updateAddress(parseInt(id), formData);
                showToast({ message: 'Address updated successfully', type: 'success' });
            } else {
                await addressApi.createAddress(formData);
                showToast({ message: 'Address added successfully', type: 'success' });
            }
            
            router.back();
        } catch (error: any) {
            console.error('[AddAddressScreen] Error saving address:', error);
            showToast({ message: error.message || 'Failed to save address', type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    const updateField = (field: keyof AddressFormData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Clear error when user starts typing
        if (errors[field]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    const getSelectedCountryName = () => {
        const country = countries.find(c => c.code === formData.country);
        return country ? country.name : '';
    };

    const getSelectedStateName = () => {
        if (states.length > 0) {
            const state = states.find(s => s.code === formData.state);
            return state ? state.default_name : '';
        }
        return formData.state;
    };

    const countryItems: PickerItem[] = countries.map(country => ({
        label: country.name,
        value: country.code,
    }));

    const stateItems: PickerItem[] = states.map(state => ({
        label: state.default_name,
        value: state.code,
    }));

    const updateAddressLine = (index: number, value: string) => {
        const newAddress = [...formData.address1];
        newAddress[index] = value;
        updateField('address1', newAddress);
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary[500]} />
                <Text style={styles.loadingText}>Loading address...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Stack.Screen 
                options={{ 
                    title: isEditMode ? 'Edit Address' : 'Add New Address',
                    headerBackTitle: 'Back',
                }} 
            />
            
            <ScrollView 
                style={styles.scrollView}
                contentContainerStyle={styles.contentContainer}
                keyboardShouldPersistTaps="handled"
            >
                {/* First Name */}
                <View style={styles.formGroup}>
                    <Text style={styles.label}>
                        First Name <Text style={styles.required}>*</Text>
                    </Text>
                    <TextInput
                        style={[styles.input, errors.first_name && styles.inputError]}
                        value={formData.first_name}
                        onChangeText={(value) => updateField('first_name', value)}
                        placeholder="Enter first name"
                        placeholderTextColor={theme.colors.text.secondary}
                    />
                    {errors.first_name && (
                        <Text style={styles.errorText}>{errors.first_name}</Text>
                    )}
                </View>

                {/* Last Name */}
                <View style={styles.formGroup}>
                    <Text style={styles.label}>
                        Last Name <Text style={styles.required}>*</Text>
                    </Text>
                    <TextInput
                        style={[styles.input, errors.last_name && styles.inputError]}
                        value={formData.last_name}
                        onChangeText={(value) => updateField('last_name', value)}
                        placeholder="Enter last name"
                        placeholderTextColor={theme.colors.text.secondary}
                    />
                    {errors.last_name && (
                        <Text style={styles.errorText}>{errors.last_name}</Text>
                    )}
                </View>

                {/* Email */}
                <View style={styles.formGroup}>
                    <Text style={styles.label}>
                        Email <Text style={styles.required}>*</Text>
                    </Text>
                    <TextInput
                        style={[styles.input, errors.email && styles.inputError]}
                        value={formData.email}
                        onChangeText={(value) => updateField('email', value)}
                        placeholder="Enter email address"
                        placeholderTextColor={theme.colors.text.secondary}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />
                    {errors.email && (
                        <Text style={styles.errorText}>{errors.email}</Text>
                    )}
                </View>

                {/* Phone */}
                <View style={styles.formGroup}>
                    <Text style={styles.label}>
                        Phone <Text style={styles.required}>*</Text>
                    </Text>
                    <TextInput
                        style={[styles.input, errors.phone && styles.inputError]}
                        value={formData.phone}
                        onChangeText={(value) => updateField('phone', value)}
                        placeholder="Enter phone number"
                        placeholderTextColor={theme.colors.text.secondary}
                        keyboardType="phone-pad"
                    />
                    {errors.phone && (
                        <Text style={styles.errorText}>{errors.phone}</Text>
                    )}
                </View>

                {/* Company Name */}
                <View style={styles.formGroup}>
                    <Text style={styles.label}>Company Name</Text>
                    <TextInput
                        style={styles.input}
                        value={formData.company_name}
                        onChangeText={(value) => updateField('company_name', value)}
                        placeholder="Enter company name (optional)"
                        placeholderTextColor={theme.colors.text.secondary}
                    />
                </View>

                {/* Street Address */}
                <View style={styles.formGroup}>
                    <Text style={styles.label}>
                        Street Address <Text style={styles.required}>*</Text>
                    </Text>
                    <TextInput
                        style={[styles.input, errors.address1 && styles.inputError]}
                        value={formData.address1[0]}
                        onChangeText={(value) => updateAddressLine(0, value)}
                        placeholder="Enter street address"
                        placeholderTextColor={theme.colors.text.secondary}
                    />
                    {errors.address1 && (
                        <Text style={styles.errorText}>{errors.address1}</Text>
                    )}
                </View>

                {/* VAT ID */}
                <View style={styles.formGroup}>
                    <Text style={styles.label}>VAT ID</Text>
                    <TextInput
                        style={styles.input}
                        value={formData.vat_id}
                        onChangeText={(value) => updateField('vat_id', value)}
                        placeholder="Enter VAT ID (optional)"
                        placeholderTextColor={theme.colors.text.secondary}
                    />
                </View>

                {/* Country */}
                <View style={styles.formGroup}>
                    <Text style={styles.label}>
                        Country <Text style={styles.required}>*</Text>
                    </Text>
                    <TouchableOpacity
                        style={[styles.pickerButton, errors.country && styles.inputError]}
                        onPress={() => setShowCountryPicker(true)}
                    >
                        <Text style={[styles.pickerButtonText, !formData.country && styles.placeholderText]}>
                            {getSelectedCountryName() || 'Select Country'}
                        </Text>
                        <Ionicons name="chevron-down" size={20} color={theme.colors.text.secondary} />
                    </TouchableOpacity>
                    {errors.country && (
                        <Text style={styles.errorText}>{errors.country}</Text>
                    )}
                </View>

                {/* State */}
                <View style={styles.formGroup}>
                    <Text style={styles.label}>
                        State <Text style={styles.required}>*</Text>
                    </Text>
                    {loadingStates ? (
                        <View style={styles.loadingStatesContainer}>
                            <ActivityIndicator size="small" color={theme.colors.primary[500]} />
                            <Text style={styles.loadingStatesText}>Loading states...</Text>
                        </View>
                    ) : states.length > 0 ? (
                        <TouchableOpacity
                            style={[styles.pickerButton, errors.state && styles.inputError]}
                            onPress={() => setShowStatePicker(true)}
                            disabled={!formData.country}
                        >
                            <Text style={[styles.pickerButtonText, !formData.state && styles.placeholderText]}>
                                {getSelectedStateName() || 'Select State'}
                            </Text>
                            <Ionicons name="chevron-down" size={20} color={theme.colors.text.secondary} />
                        </TouchableOpacity>
                    ) : (
                        <TextInput
                            style={[styles.input, errors.state && styles.inputError]}
                            value={formData.state}
                            onChangeText={(value) => updateField('state', value)}
                            placeholder="Enter state"
                            placeholderTextColor={theme.colors.text.secondary}
                            editable={!!formData.country}
                        />
                    )}
                    {errors.state && (
                        <Text style={styles.errorText}>{errors.state}</Text>
                    )}
                </View>

                {/* City */}
                <View style={styles.formGroup}>
                    <Text style={styles.label}>
                        City <Text style={styles.required}>*</Text>
                    </Text>
                    <TextInput
                        style={[styles.input, errors.city && styles.inputError]}
                        value={formData.city}
                        onChangeText={(value) => updateField('city', value)}
                        placeholder="Enter city"
                        placeholderTextColor={theme.colors.text.secondary}
                    />
                    {errors.city && (
                        <Text style={styles.errorText}>{errors.city}</Text>
                    )}
                </View>

                {/* Postal Code */}
                <View style={styles.formGroup}>
                    <Text style={styles.label}>
                        Zip/Postal Code <Text style={styles.required}>*</Text>
                    </Text>
                    <TextInput
                        style={[styles.input, errors.postcode && styles.inputError]}
                        value={formData.postcode}
                        onChangeText={(value) => updateField('postcode', value)}
                        placeholder="Enter postal code"
                        placeholderTextColor={theme.colors.text.secondary}
                    />
                    {errors.postcode && (
                        <Text style={styles.errorText}>{errors.postcode}</Text>
                    )}
                </View>

                {/* Set as Default Checkbox */}
                <TouchableOpacity
                    style={styles.checkboxContainer}
                    onPress={() => updateField('default_address', !formData.default_address)}
                    activeOpacity={0.7}
                >
                    <View style={styles.checkbox}>
                        {formData.default_address && (
                            <Ionicons name="checkmark" size={18} color={theme.colors.primary[500]} />
                        )}
                    </View>
                    <Text style={styles.checkboxLabel}>Set as default address</Text>
                </TouchableOpacity>

                {/* Save Button */}
                <TouchableOpacity
                    style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
                    onPress={handleSave}
                    disabled={isSaving}
                    activeOpacity={0.8}
                >
                    {isSaving ? (
                        <ActivityIndicator size="small" color={theme.colors.white} />
                    ) : (
                        <>
                            <Ionicons name="save-outline" size={20} color={theme.colors.white} />
                            <Text style={styles.saveButtonText}>
                                {isEditMode ? 'Update Address' : 'Save Address'}
                            </Text>
                        </>
                    )}
                </TouchableOpacity>
            </ScrollView>

            {/* Country Picker Modal */}
            <PickerModal
                visible={showCountryPicker}
                title="Select Country"
                items={countryItems}
                selectedValue={formData.country}
                onSelect={(value) => updateField('country', value)}
                onClose={() => setShowCountryPicker(false)}
                searchable={true}
            />

            {/* State Picker Modal */}
            <PickerModal
                visible={showStatePicker}
                title="Select State"
                items={stateItems}
                selectedValue={formData.state}
                onSelect={(value) => updateField('state', value)}
                onClose={() => setShowStatePicker(false)}
                searchable={true}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background.default,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: theme.spacing.md,
        fontSize: theme.typography.fontSize.md,
        color: theme.colors.text.secondary,
    },
    scrollView: {
        flex: 1,
    },
    contentContainer: {
        padding: theme.spacing.md,
        paddingBottom: theme.spacing.xl * 2,
    },
    formGroup: {
        marginBottom: theme.spacing.lg,
    },
    label: {
        fontSize: theme.typography.fontSize.sm,
        fontWeight: theme.typography.fontWeight.medium,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.xs,
    },
    required: {
        color: theme.colors.error.main,
    },
    input: {
        borderWidth: 1,
        borderColor: theme.colors.gray[300],
        borderRadius: theme.borderRadius.md,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: Platform.OS === 'ios' ? theme.spacing.md : theme.spacing.sm,
        fontSize: theme.typography.fontSize.md,
        color: theme.colors.text.primary,
        backgroundColor: theme.colors.white,
    },
    inputError: {
        borderColor: theme.colors.error.main,
    },
    errorText: {
        fontSize: theme.typography.fontSize.xs,
        color: theme.colors.error.main,
        marginTop: theme.spacing.xs,
    },
    pickerButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.colors.gray[300],
        borderRadius: theme.borderRadius.md,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: Platform.OS === 'ios' ? theme.spacing.md : theme.spacing.sm,
        backgroundColor: theme.colors.white,
        minHeight: 48,
    },
    pickerButtonText: {
        fontSize: theme.typography.fontSize.md,
        color: theme.colors.text.primary,
        flex: 1,
    },
    placeholderText: {
        color: theme.colors.text.secondary,
    },
    loadingStatesContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: theme.spacing.md,
        borderWidth: 1,
        borderColor: theme.colors.gray[300],
        borderRadius: theme.borderRadius.md,
        backgroundColor: theme.colors.gray[50],
    },
    loadingStatesText: {
        marginLeft: theme.spacing.sm,
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.text.secondary,
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.spacing.xl,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderWidth: 2,
        borderColor: theme.colors.primary[500],
        borderRadius: theme.borderRadius.sm,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: theme.spacing.sm,
    },
    checkboxLabel: {
        fontSize: theme.typography.fontSize.md,
        color: theme.colors.text.primary,
    },
    saveButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.primary[500],
        paddingVertical: theme.spacing.md,
        borderRadius: theme.borderRadius.md,
        ...theme.shadows.sm,
    },
    saveButtonDisabled: {
        opacity: 0.6,
    },
    saveButtonText: {
        fontSize: theme.typography.fontSize.md,
        fontWeight: theme.typography.fontWeight.semiBold,
        color: theme.colors.white,
        marginLeft: theme.spacing.sm,
    },
});

export default AddAddressScreen;

