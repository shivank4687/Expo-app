import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PickerModal, PickerItem } from '@/shared/components/PickerModal';
import { coreApi, Country, State } from '@/services/api/core.api';

interface AddressCardProps {
    data: {
        address1?: string;
        city?: string;
        country?: string;
        state?: string;
        postcode?: string;
    };
    onChange: (field: string, value: string) => void;
    errors?: Record<string, string>;
}

export const AddressCard: React.FC<AddressCardProps> = ({ data, onChange, errors = {} }) => {
    const [countries, setCountries] = useState<Country[]>([]);
    const [loading, setLoading] = useState(true);

    const [showCountryPicker, setShowCountryPicker] = useState(false);

    // Fetch countries on mount
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const countriesData = await coreApi.getCountries();
                setCountries(countriesData);
            } catch (error) {
                console.error('Error fetching countries:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const countryItems: PickerItem[] = countries.map(country => ({
        label: country.name,
        value: country.code
    }));

    const getSelectedCountryName = () => {
        const country = countries.find(c => c.code === data.country);
        return country ? country.name : '';
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>2) Address</Text>

            {/* Address */}
            <View style={[styles.fieldContainerSmall, errors.address1 ? styles.fieldContainerWithError : null]}>
                <Text style={styles.label}>Address <Text style={styles.required}>*</Text></Text>
                <View style={[styles.inputContainerSmall, errors.address1 ? styles.inputError : null]}>
                    <TextInput
                        style={styles.inputSmall}
                        placeholder="Enter address"
                        placeholderTextColor="#666666"
                        value={data.address1}
                        onChangeText={(val) => onChange('address1', val)}
                        textContentType="streetAddressLine1"
                        autoComplete="address-line1"
                    />
                </View>
                {errors.address1 && <Text style={styles.errorText}>{errors.address1}</Text>}
            </View>

            {/* City/Region */}
            <View style={[styles.fieldContainerSmall, errors.city ? styles.fieldContainerWithError : null]}>
                <Text style={styles.label}>City/Region <Text style={styles.required}>*</Text></Text>
                <View style={[styles.inputContainerSmall, errors.city ? styles.inputError : null]}>
                    <TextInput
                        style={styles.inputSmall}
                        placeholder="Enter city or region"
                        placeholderTextColor="#666666"
                        value={data.city}
                        onChangeText={(val) => onChange('city', val)}
                        textContentType="addressCity"
                        autoComplete="address-line2"
                    />
                </View>
                {errors.city && <Text style={styles.errorText}>{errors.city}</Text>}
            </View>

            {/* Country */}
            <View style={[styles.fieldContainerSmall, errors.country ? styles.fieldContainerWithError : null]}>
                <Text style={styles.label}>Country <Text style={styles.required}>*</Text></Text>
                <TouchableOpacity
                    style={[styles.inputContainerSmall, errors.country ? styles.inputError : null]}
                    onPress={() => setShowCountryPicker(true)}
                    disabled={loading}
                >
                    <Text style={[styles.inputSmall, !data.country && styles.placeholderText]}>
                        {loading ? 'Loading...' : (data.country ? getSelectedCountryName() : 'Select Country')}
                    </Text>
                    {loading ? (
                        <ActivityIndicator size="small" color="#666666" />
                    ) : (
                        <Ionicons name="chevron-down" size={16} color="#666666" />
                    )}
                </TouchableOpacity>
                {errors.country && <Text style={styles.errorText}>{errors.country}</Text>}
            </View>

            {/* State */}
            <View style={[styles.fieldContainerSmall, errors.state ? styles.fieldContainerWithError : null]}>
                <Text style={styles.label}>State <Text style={styles.required}>*</Text></Text>
                <View style={[styles.inputContainerSmall, errors.state ? styles.inputError : null]}>
                    <TextInput
                        style={styles.inputSmall}
                        placeholder="Enter state"
                        placeholderTextColor="#666666"
                        value={data.state}
                        onChangeText={(val) => onChange('state', val)}
                        textContentType="addressState"
                        autoComplete="off"
                    />
                </View>
                {errors.state && <Text style={styles.errorText}>{errors.state}</Text>}
            </View>

            {/* Postcode */}
            <View style={[styles.fieldContainerSmall, errors.postcode ? styles.fieldContainerWithError : null]}>
                <Text style={styles.label}>Postcode <Text style={styles.required}>*</Text></Text>
                <View style={[styles.inputContainerSmall, errors.postcode ? styles.inputError : null]}>
                    <TextInput
                        style={styles.inputSmall}
                        placeholder="Enter here..."
                        placeholderTextColor="#666666"
                        keyboardType="numeric"
                        value={data.postcode}
                        onChangeText={(val) => onChange('postcode', val)}
                        textContentType="postalCode"
                        autoComplete="postal-code"
                    />
                </View>
                {errors.postcode && <Text style={styles.errorText}>{errors.postcode}</Text>}
            </View>

            {/* Country Picker Modal */}
            <PickerModal
                visible={showCountryPicker}
                title="Select Country"
                items={countryItems}
                selectedValue={data.country || ''}
                onSelect={(val) => onChange('country', val)}
                onClose={() => setShowCountryPicker(false)}
                searchable={true}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        padding: 0,
        gap: 16,
        alignSelf: 'stretch',
    },
    title: {
        width: "100%",
        height: 24,
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '500',
        fontSize: 20,
        lineHeight: 24,
        color: '#000000',
    },
    required: {
        color: '#FF0000',
    },
    fieldContainerSmall: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        padding: 0,
        gap: 8,
        width: "100%",
        minHeight: 67,
        marginBottom: 8,
    },
    fieldContainerWithError: {
        minHeight: 85,
    },
    label: {
        width: "100%",
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '500',
        fontSize: 16,
        lineHeight: 19,
        color: '#000000',
    },
    inputContainerSmall: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 16,
        gap: 10,
        width: "100%",
        height: 40,
        backgroundColor: '#EEEEEF',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    inputError: {
        borderColor: '#FF0000',
        backgroundColor: '#FFF5F5',
    },
    errorText: {
        color: '#FF0000',
        fontSize: 12,
        fontFamily: 'Inter',
        marginTop: 4,
    },
    inputSmall: {
        flex: 1,
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '400',
        fontSize: 16,
        lineHeight: 20,
        color: '#000000',
        padding: 0,
        margin: 0,
    },
    placeholderText: {
        color: '#666666',
    },
});
