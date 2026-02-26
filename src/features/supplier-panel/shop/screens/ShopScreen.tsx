import { COLORS } from '@/features/supplier-panel/styles';
import { useToast } from '@/shared/components/Toast/ToastContext';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getSupplierProfile, SupplierProfile, updateSupplierProfile } from '../api/supplier-profile.api';
import { AddressCard, DeliveryMethodCard, IdentityCard, PoliciesCard, SalesShippingCard, ShopDetailsCard, ShopMediaCard, SocialMediaCard } from '../components';
import { consumeContactUpdate } from '@/features/supplier-panel/profile/contactUpdateTracker';

export default function ShopScreen() {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [profileData, setProfileData] = useState<Partial<SupplierProfile>>({});
    const [errors, setErrors] = useState<Record<string, string>>({});

    const fetchProfile = useCallback(async () => {
        try {
            setLoading(true);
            const response = await getSupplierProfile();
            setProfileData(response);
        } catch (error) {
            console.error('Error fetching profile:', error);
            showToast({
                type: 'error',
                message: 'Failed to load profile data.'
            });
        } finally {
            setLoading(false);
        }
    }, []);

    const isFirstFocus = useRef(true);

    useFocusEffect(
        useCallback(() => {
            if (isFirstFocus.current) {
                isFirstFocus.current = false;
                return;
            }

            if (consumeContactUpdate()) {
                fetchProfile();
            }
        }, [fetchProfile])
    );

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    const handleInputChange = (field: string, value: any) => {
        setProfileData(prev => ({
            ...prev,
            [field]: value
        }));

        // Clear error when user types
        if (errors[field]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    const validateForm = () => {
        const requiredFields = [
            { key: 'company_name', label: 'Company Name' },
            { key: 'company_tag_line', label: 'Tagline' },
            { key: 'registerd_in', label: 'Registered In' },
            { key: 'designation', label: 'Designation' },
            { key: 'team_size', label: 'Team Size' },
            { key: 'certification', label: 'Certification' },
            { key: 'response_time', label: 'Response Time' },
            { key: 'address1', label: 'Address' },
            { key: 'city', label: 'City/Region' },
            { key: 'country', label: 'Country' },
            { key: 'state', label: 'State' },
            { key: 'postcode', label: 'Postcode' },
        ];
        const newErrors: Record<string, string> = {};
        for (const field of requiredFields) {
            if (!profileData[field.key as keyof SupplierProfile]) {
                newErrors[field.key] = `${field.label} is required`;
            }
        }

        // Validate discount special percentage
        if (profileData.discount_special_percentage !== null &&
            profileData.discount_special_percentage !== undefined &&
            profileData.discount_special_percentage > 100) {
            newErrors['discount_special_percentage'] = 'Discount percentage cannot exceed 100%';
        }

        // Validate buyer spend discounts percentages
        if (profileData.buyer_spend_discounts && Array.isArray(profileData.buyer_spend_discounts)) {
            profileData.buyer_spend_discounts.forEach((discount: any, index: number) => {
                const percentage = parseFloat(discount.discount_percentage);
                if (!isNaN(percentage) && percentage > 100) {
                    newErrors[`buyer_spend_discount_${index}`] = `Discount ${index + 1}: Percentage cannot exceed 100%`;
                }
            });
        }

        // Validate holiday period dates
        if (profileData.holiday_start_date && profileData.holiday_end_date) {
            const startDate = new Date(profileData.holiday_start_date);
            const endDate = new Date(profileData.holiday_end_date);
            if (endDate <= startDate) {
                newErrors['holiday_end_date'] = 'Holiday end date must be after start date';
            }
        }

        // Validate discount special time dates
        if (profileData.discount_special_start_date && profileData.discount_special_end_date) {
            const startDate = new Date(profileData.discount_special_start_date);
            const endDate = new Date(profileData.discount_special_end_date);
            if (endDate <= startDate) {
                newErrors['discount_special_end_date'] = 'Discount end date must be after start date';
            }
        }

        setErrors(newErrors);

        if (Object.keys(newErrors).length > 0) {
            showToast({
                type: 'warning',
                title: 'Validation Error',
                message: 'Please check the required fields.'
            });
            return false;
        }

        return true;
    };

    const handleSave = async () => {
        if (!validateForm()) return;

        try {
            setSaving(true);
            const updateData = { ...profileData };

            // Clean up data for update API if needed (e.g. remove nulls or specific fields)
            delete (updateData as any).id;

            await updateSupplierProfile(updateData);
            showToast({
                type: 'success',
                message: 'Profile updated successfully.'
            });
        } catch (error: any) {
            console.error('Error updating profile:', error);
            const errorMessage =
                error.response?.data?.message ||
                error.response?.data?.error ||
                error.message ||
                'Failed to update profile.';
            showToast({
                type: 'error',
                message: errorMessage
            });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#00615E" />
                <Text style={styles.loadingText}>Loading shop data...</Text>
            </View>
        );
    }

    return (
        <View style={styles.mainContainer}>
            <SafeAreaView style={styles.safeArea} edges={['top']}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>My Shop</Text>
                </View>
            </SafeAreaView>

            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.card}>
                    <IdentityCard
                        data={profileData}
                        onChange={handleInputChange}
                        errors={errors}
                    />
                    <ShopDetailsCard
                        data={profileData}
                        onChange={handleInputChange}
                    />
                </View>

                <View style={styles.card}>
                    <AddressCard
                        data={profileData}
                        onChange={handleInputChange}
                        errors={errors}
                    />
                </View>

                <View style={styles.card}>
                    <PoliciesCard
                        data={profileData}
                        onChange={handleInputChange}
                    />
                </View>

                <View style={styles.card}>
                    <SalesShippingCard
                        data={profileData}
                        onChange={handleInputChange}
                        errors={errors}
                    />
                </View>

                <View style={styles.card}>
                    <DeliveryMethodCard />
                </View>

                <View style={styles.card}>
                    <ShopMediaCard
                        data={profileData}
                        onChange={handleInputChange}
                    />
                </View>

                <View style={styles.card}>
                    <SocialMediaCard
                        data={profileData}
                        onChange={handleInputChange}
                    />
                </View>

                {/* Action Buttons */}
                <View style={styles.actionRow}>
                    <TouchableOpacity style={styles.previewButton}>
                        <Ionicons name="eye-outline" size={16} color="#000000" />
                        <Text style={styles.previewButtonText}>Preview</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.saveButton}
                        onPress={handleSave}
                        disabled={saving}
                    >
                        {saving ? (
                            <ActivityIndicator size="small" color="#F5F5F5" />
                        ) : (
                            <>
                                <Ionicons name="checkmark-outline" size={16} color="#F5F5F5" />
                                <Text style={styles.saveButtonText}>Save</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.background,
    },
    loadingText: {
        marginTop: 12,
        fontFamily: 'Inter',
        fontSize: 16,
        color: '#666666',
    },
    mainContainer: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    safeArea: {
        backgroundColor: COLORS.background,
    },
    header: {
        paddingHorizontal: 16,
        paddingVertical: 16,
        backgroundColor: COLORS.background,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    headerTitle: {
        fontFamily: 'Inter',
        fontWeight: '700',
        fontSize: 24,
        lineHeight: 24,
        color: '#000000',
    },
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    content: {
        padding: 16,
        paddingTop: 8,
        gap: 16,
        alignItems: 'stretch',
    },
    card: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'flex-start',
        padding: 16,
        gap: 16,
        width: "100%",
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        shadowColor: '#000000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 3,
        alignSelf: 'stretch',
    },
    actionRow: {
        flexDirection: 'row',
        gap: 8,
        width: "100%",
        height: 40,
        alignSelf: 'stretch',
        marginTop: 8,
        marginBottom: 32,
    },
    previewButton: {
        flex: 1,
        height: 40,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#00615E',
        borderRadius: 8,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    saveButton: {
        flex: 1,
        height: 40,
        backgroundColor: '#00615E',
        borderRadius: 8,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    previewButtonText: {
        fontFamily: 'Inter',
        fontSize: 16,
        color: '#000000',
    },
    saveButtonText: {
        fontFamily: 'Inter',
        fontSize: 16,
        color: '#F5F5F5',
    }
});
