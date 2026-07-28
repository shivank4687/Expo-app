import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Platform,
    FlatList,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchCountriesThunk } from '@/store/slices/coreSlice';
import { updateCustomerGroupId } from '@/store/slices/authSlice';
import { clearRecentlyViewed } from '@/store/slices/recentlyViewedSlice';
import { resetCart, fetchCartThunk } from '@/store/slices/cartSlice';
import { resetWishlist, fetchWishlistThunk } from '@/store/slices/wishlistSlice';
import { PickerModal, PickerItem } from '@/shared/components/PickerModal';
import { TopHeader } from '@/shared/components/TopHeader';
import { useToast } from '@/shared/components/Toast';
import {
    getCustomerProfile,
    getCustomerGroups,
    getCustomerTaxProfile,
    updateCustomerGroup,
    updateCustomerTaxProfile,
    CustomerGroup,
} from '../api/customer-tax-profile.api';

// ─── Constants ────────────────────────────────────────────────────────────────

const WHOLESALE_CODE = 'wholesale';

const vatModeOptions = [
    { value: '1', label: 'Yes, I have a Tax ID' },
    { value: '0', label: 'Not Applicable' },
];

const fiscalRegimeOptions = [
    { value: 'general_personas_morales', label: 'General de Ley Personas Morales' },
    { value: 'regimen_incorporacion_fiscal', label: 'Régimen de Incorporación Fiscal' },
];

// ─── Inline Dropdown ──────────────────────────────────────────────────────────
// Renders the menu in-place (below the trigger, pushing nothing).
// The KEY z-index fix: each dropdown gets a `zIndex` prop passed from the
// parent so the topmost dropdown always renders above the ones beneath it.

interface DropdownOption {
    value: string;
    label: string;
}

interface InlineDropProps {
    label: string;
    options: DropdownOption[];
    value: string | null;
    onSelect: (v: string) => void;
    placeholder?: string;
    disabled?: boolean;
    /** Pass descending values so the first dropdown overlaps those below it */
    zIndex?: number;
}

const InlineDrop: React.FC<InlineDropProps> = ({
    label,
    options,
    value,
    onSelect,
    placeholder = 'Select...',
    disabled = false,
    zIndex = 10,
}) => {
    const [open, setOpen] = useState(false);
    const selected = options.find((o) => o.value === value);

    return (
        <View
            style={[
                dropStyles.wrapper,
                // When open, the wrapper must be on top of everything below
                { zIndex: open ? 9999 : zIndex },
            ]}
        >
            {/* Label + trigger in a row */}
            <View style={dropStyles.row}>
                <Text style={dropStyles.label}>{label}</Text>
                <TouchableOpacity
                    style={[dropStyles.trigger, disabled && dropStyles.triggerDisabled]}
                    onPress={() => !disabled && setOpen((p) => !p)}
                    activeOpacity={0.7}
                >
                    <Text
                        style={[dropStyles.triggerText, !selected && dropStyles.placeholder]}
                        numberOfLines={1}
                    >
                        {selected ? selected.label : placeholder}
                    </Text>
                    <Ionicons
                        name={open ? 'chevron-up' : 'chevron-down'}
                        size={16}
                        color={disabled ? '#A6A6A6' : '#0A292D'}
                    />
                </TouchableOpacity>
            </View>

            {/* Inline menu — position:absolute so it overlaps content below */}
            {open && (
                <>
                    {/* Invisible full-screen tap-away overlay at low z */}
                    <TouchableOpacity
                        style={dropStyles.overlay}
                        activeOpacity={1}
                        onPress={() => setOpen(false)}
                    />
                    <View style={dropStyles.menu}>
                        {options.map((item) => {
                            const isActive = item.value === value;
                            return (
                                <TouchableOpacity
                                    key={item.value}
                                    style={[dropStyles.option, isActive && dropStyles.optionActive]}
                                    onPress={() => {
                                        onSelect(item.value);
                                        setOpen(false);
                                    }}
                                    activeOpacity={0.7}
                                >
                                    <Text
                                        style={[
                                            dropStyles.optionText,
                                            isActive && dropStyles.optionTextActive,
                                        ]}
                                    >
                                        {item.label}
                                    </Text>
                                    {isActive && (
                                        <Ionicons name="checkmark-circle" size={16} color="#00615E" />
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </>
            )}
        </View>
    );
};

const dropStyles = StyleSheet.create({
    wrapper: {
        // overflow must be visible so the menu escapes the card boundary
        overflow: 'visible',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        minHeight: 44,
    },
    label: {
        fontFamily: 'Inter',
        fontWeight: '500',
        fontSize: 13,
        color: '#0A292D',
        width: 110,
        flexShrink: 0,
    },
    trigger: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: '#E1D9CF',
        borderRadius: 8,
        backgroundColor: '#FAF9F6',
        paddingHorizontal: 12,
        paddingVertical: 10,
    },
    triggerDisabled: {
        backgroundColor: '#F0F0F0',
    },
    triggerText: {
        flex: 1,
        fontFamily: 'Inter',
        fontSize: 14,
        color: '#0A292D',
        marginRight: 6,
    },
    placeholder: {
        color: '#7D8A8C',
    },
    // Full-screen tap-away target, sits behind the menu
    overlay: {
        position: 'absolute',
        top: -1000,
        left: -1000,
        right: -1000,
        bottom: -1000,
        zIndex: 1,
    },
    // The floating menu itself
    menu: {
        position: 'absolute',
        // Sits just below the trigger (44 px row height)
        top: 44,
        left: 110 + 12, // label width + gap
        right: 0,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E1D9CF',
        borderRadius: 10,
        paddingVertical: 4,
        zIndex: 9999,
        // Shadows
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.12,
                shadowRadius: 12,
            },
            android: { elevation: 20 },
        }),
    },
    option: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 8,
        marginHorizontal: 4,
    },
    optionActive: {
        backgroundColor: '#F0FCF8',
    },
    optionText: {
        fontFamily: 'Inter',
        fontSize: 14,
        color: '#0A292D',
        flex: 1,
    },
    optionTextActive: {
        color: '#00615E',
        fontWeight: '600',
    },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export const CustomerTypeTaxScreen: React.FC = () => {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const { showToast } = useToast();

    const countries = useAppSelector((state) => state.core.countries);
    const isLoadingCountries = useAppSelector((state) => state.core.isLoadingCountries);

    // ── Group state ──────────────────────────────────────────────────────────
    const [groups, setGroups] = useState<CustomerGroup[]>([]);
    const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
    const [selectedGroupCode, setSelectedGroupCode] = useState<string | null>(null);

    // ── Tax profile state ────────────────────────────────────────────────────
    const [vatMode, setVatMode] = useState<string | null>(null);
    const [taxId, setTaxId] = useState('');
    const [selectedRegime, setSelectedRegime] = useState<string | null>(null);
    const [vatPercent, setVatPercent] = useState('16');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [city, setCity] = useState('');
    const [region, setRegion] = useState('');
    const [postcode, setPostcode] = useState('');
    const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
    const [showCountryPicker, setShowCountryPicker] = useState(false);

    // ── UI state ─────────────────────────────────────────────────────────────
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // ── Derived ──────────────────────────────────────────────────────────────
    const isWholesale = selectedGroupCode === WHOLESALE_CODE;
    const showTaxFields = isWholesale && vatMode === '1';

    // ─── Load data ────────────────────────────────────────────────────────────

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            dispatch(fetchCountriesThunk());

            const [customerProfile, groupList, taxProfile] = await Promise.all([
                getCustomerProfile(),
                getCustomerGroups(),
                getCustomerTaxProfile(),
            ]);

            setGroups(groupList);

            // Pre-select the customer's current group.
            // The API returns a nested `group` object: { id, code, name }
            const currentGroup = customerProfile?.group;
            if (currentGroup?.id) {
                setSelectedGroupId(String(currentGroup.id));
                setSelectedGroupCode(currentGroup.code ?? null);
            } else if (customerProfile?.customer_group_id) {
                // Fallback: match by id if group object is absent
                const currentId = String(customerProfile.customer_group_id);
                setSelectedGroupId(currentId);
                const matched = groupList.find((g) => String(g.id) === currentId);
                setSelectedGroupCode(matched?.code ?? null);
            }

            // Restore saved tax profile
            if (taxProfile && Object.keys(taxProfile).length > 0) {
                setVatMode(taxProfile.tax_mode ? '1' : '0');
                setTaxId(taxProfile.tax_id ?? '');
                setSelectedRegime(taxProfile.fiscal_regime ?? null);
                setVatPercent(String(taxProfile.tax_percentage ?? 16));
                setPhone(taxProfile.phone ?? '');
                setAddress(taxProfile.address ?? '');
                setCity(taxProfile.city ?? '');
                setRegion(taxProfile.state ?? '');
                setPostcode(taxProfile.postcode ?? '');
                setSelectedCountry(taxProfile.country ?? null);
            }
        } catch (error) {
            console.error('Error loading customer type/tax data:', error);
            showToast({ message: 'Unable to load your settings.', type: 'error' });
        } finally {
            setLoading(false);
        }
    }, [dispatch, showToast]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // ─── Helpers ──────────────────────────────────────────────────────────────

    const groupOptions: DropdownOption[] = groups.map((g) => ({
        value: String(g.id),
        label: g.name,
    }));

    const handleGroupSelect = (value: string) => {
        setSelectedGroupId(value);
        const group = groups.find((g) => String(g.id) === value);
        setSelectedGroupCode(group?.code ?? null);
        if (group?.code !== WHOLESALE_CODE) {
            setVatMode(null);
        }
    };

    const getSelectedCountryName = () =>
        (countries || []).find((c) => c.code === selectedCountry)?.name ?? '';

    const countryItems: PickerItem[] = (countries || []).map((c) => ({
        label: c.name,
        value: c.code,
    }));

    // ─── Save ─────────────────────────────────────────────────────────────────

    const handleSave = async () => {
        if (saving || loading) return;

        if (!selectedGroupId) {
            showToast({ message: 'Please select a customer group.', type: 'warning' });
            return;
        }
        if (isWholesale && !vatMode) {
            showToast({ message: 'Please select a VAT mode.', type: 'warning' });
            return;
        }
        if (showTaxFields && (!taxId.trim() || !selectedRegime || !vatPercent.trim())) {
            showToast({ message: 'Please complete all required tax fields.', type: 'warning' });
            return;
        }

        setSaving(true);
        try {
            await updateCustomerGroup(Number(selectedGroupId));

            if (isWholesale && vatMode) {
                await updateCustomerTaxProfile({
                    tax_mode: vatMode === '1',
                    tax_id: taxId.trim() || null,
                    tax_percentage: Number(vatPercent) || 16,
                    fiscal_regime: selectedRegime,
                    phone: phone.trim() || null,
                    address: address.trim() || null,
                    city: city.trim() || null,
                    state: region.trim() || null,
                    country: selectedCountry,
                    postcode: postcode.trim() || null,
                });
            }

            // Clear stale state values since product prices change based on customer group
            dispatch(updateCustomerGroupId({ id: Number(selectedGroupId), code: selectedGroupCode }));
            dispatch(clearRecentlyViewed());
            dispatch(resetCart());
            dispatch(fetchCartThunk());
            dispatch(resetWishlist());
            dispatch(fetchWishlistThunk());

            showToast({ message: 'Settings saved successfully.', type: 'success' });
        } catch (error) {
            console.error('Error saving:', error);
            showToast({ message: 'Unable to save settings.', type: 'error' });
        } finally {
            setSaving(false);
        }
    };

    // ─── Render ───────────────────────────────────────────────────────────────

    return (
        <View style={styles.screenContainer}>
            <Stack.Screen options={{ headerShown: false }} />
            <TopHeader title="Customer Type & Tax" onBack={() => router.back()} />

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#00615E" />
                </View>
            ) : (
                // overflow:visible is required so absolute menus escape the ScrollView
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* ── Customer Group Card ─────────────────────────────── */}
                    {/* overflow:visible so the dropdown menu escapes the card */}
                    <View style={[styles.card, { overflow: 'visible', zIndex: 200 }]}>
                        <View style={styles.cardHeader}>
                            <View style={styles.cardIconBg}>
                                <Ionicons name="people-outline" size={16} color="#FFFFFF" />
                            </View>
                            <View style={styles.cardHeaderText}>
                                <Text style={styles.cardTitle}>Customer Group</Text>
                                <Text style={styles.cardSubtitle}>
                                    Select the type that best describes your account.
                                </Text>
                            </View>
                        </View>

                        {/* zIndex 100 — only dropdown in this card */}
                        <InlineDrop
                            label="Group"
                            options={groupOptions}
                            value={selectedGroupId}
                            onSelect={handleGroupSelect}
                            placeholder="Select group"
                            zIndex={100}
                        />

                        {isWholesale && (
                            <View style={styles.infoBox}>
                                <Ionicons name="information-circle-outline" size={16} color="#00615E" />
                                <Text style={styles.infoText}>
                                    Wholesale accounts may be required to provide tax information below.
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* ── Tax / VAT Card (wholesale only) ─────────────────── */}
                    {isWholesale && (
                        // zIndex lower than the group card so group dropdown appears above this card
                        <View style={[styles.card, { overflow: 'visible', zIndex: 100 }]}>
                            <View style={styles.cardHeader}>
                                <View style={styles.cardIconBg}>
                                    <Ionicons name="receipt-outline" size={16} color="#FFFFFF" />
                                </View>
                                <View style={styles.cardHeaderText}>
                                    <Text style={styles.cardTitle}>VAT & Tax Information</Text>
                                    <Text style={styles.cardSubtitle}>
                                        Tax settings applied to your wholesale orders.
                                    </Text>
                                </View>
                            </View>

                            {/* VAT Mode — highest zIndex inside this card so it tops Fiscal below */}
                            <InlineDrop
                                label="VAT Mode"
                                options={vatModeOptions}
                                value={vatMode}
                                onSelect={setVatMode}
                                placeholder="Select"
                                zIndex={90}
                            />

                            {showTaxFields && (
                                <>
                                    <Text style={styles.noticeText}>
                                        All fields below are required when VAT mode is active.
                                    </Text>

                                    <View style={styles.tfRow}>
                                        <Text style={styles.tfLabel}>Tax ID</Text>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Enter Tax ID / RFC"
                                            placeholderTextColor="#7D8A8C"
                                            value={taxId}
                                            onChangeText={setTaxId}
                                            autoCapitalize="characters"
                                        />
                                    </View>

                                    {/* Fiscal Regime — below VAT Mode, so lower zIndex */}
                                    <InlineDrop
                                        label="Fiscal Regime"
                                        options={fiscalRegimeOptions}
                                        value={selectedRegime}
                                        onSelect={setSelectedRegime}
                                        placeholder="Select regime"
                                        zIndex={80}
                                    />

                                    <View style={styles.tfRow}>
                                        <Text style={styles.tfLabel}>VAT (%)</Text>
                                        <TextInput
                                            style={[styles.input, { flex: 0, width: 90 }]}
                                            placeholder="16"
                                            placeholderTextColor="#7D8A8C"
                                            value={vatPercent}
                                            onChangeText={setVatPercent}
                                            keyboardType="numeric"
                                        />
                                    </View>

                                    <View style={styles.tfRow}>
                                        <Text style={styles.tfLabel}>Phone</Text>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Enter phone number"
                                            placeholderTextColor="#7D8A8C"
                                            value={phone}
                                            onChangeText={setPhone}
                                            keyboardType="phone-pad"
                                        />
                                    </View>

                                    <View style={styles.tfRow}>
                                        <Text style={styles.tfLabel}>Address</Text>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Enter address"
                                            placeholderTextColor="#7D8A8C"
                                            value={address}
                                            onChangeText={setAddress}
                                        />
                                    </View>

                                    <View style={styles.tfRow}>
                                        <Text style={styles.tfLabel}>City</Text>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Enter city"
                                            placeholderTextColor="#7D8A8C"
                                            value={city}
                                            onChangeText={setCity}
                                        />
                                    </View>

                                    <View style={styles.tfRow}>
                                        <Text style={styles.tfLabel}>State / Province</Text>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Enter state"
                                            placeholderTextColor="#7D8A8C"
                                            value={region}
                                            onChangeText={setRegion}
                                        />
                                    </View>

                                    <View style={styles.tfRow}>
                                        <Text style={styles.tfLabel}>Postcode</Text>
                                        <TextInput
                                            style={[styles.input, { flex: 0, width: 90 }]}
                                            placeholder="Enter postcode"
                                            placeholderTextColor="#7D8A8C"
                                            value={postcode}
                                            onChangeText={setPostcode}
                                            keyboardType="numeric"
                                        />
                                    </View>

                                    <View style={styles.tfRow}>
                                        <Text style={styles.tfLabel}>Country</Text>
                                        <TouchableOpacity
                                            style={[styles.input, styles.countryBtn]}
                                            onPress={() => setShowCountryPicker(true)}
                                            disabled={isLoadingCountries}
                                        >
                                            <Text
                                                style={[
                                                    styles.countryBtnText,
                                                    !selectedCountry && { color: '#7D8A8C' },
                                                ]}
                                                numberOfLines={1}
                                            >
                                                {isLoadingCountries
                                                    ? 'Loading...'
                                                    : selectedCountry
                                                        ? getSelectedCountryName()
                                                        : 'Select country'}
                                            </Text>
                                            {isLoadingCountries ? (
                                                <ActivityIndicator size="small" color="#666" />
                                            ) : (
                                                <Ionicons name="chevron-down" size={16} color="#666" />
                                            )}
                                        </TouchableOpacity>
                                    </View>
                                </>
                            )}
                        </View>
                    )}

                    {/* ── Save Button ─────────────────────────────────────── */}
                    <TouchableOpacity
                        style={[styles.saveBtn, (saving || loading) && { opacity: 0.6 }]}
                        onPress={handleSave}
                        disabled={saving || loading}
                        activeOpacity={0.85}
                    >
                        {saving ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                            <>
                                <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />
                                <Text style={styles.saveBtnText}>Save Changes</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </ScrollView>
            )}

            <PickerModal
                visible={showCountryPicker}
                title="Select Country"
                items={countryItems}
                selectedValue={selectedCountry || ''}
                onSelect={(val) => { setSelectedCountry(val); setShowCountryPicker(false); }}
                onClose={() => setShowCountryPicker(false)}
                searchable
            />
        </View>
    );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    screenContainer: { flex: 1, backgroundColor: '#F5F3EE' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scrollView: { flex: 1 },
    scrollContent: { padding: 16, paddingBottom: 40, gap: 16 },

    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E9E3D3',
        padding: 16,
        gap: 14,
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6 },
            android: { elevation: 2 },
        }),
    },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    cardIconBg: {
        width: 32, height: 32, borderRadius: 8,
        backgroundColor: '#00615E', justifyContent: 'center', alignItems: 'center',
    },
    cardHeaderText: { flex: 1, gap: 2 },
    cardTitle: { fontFamily: 'Inter', fontWeight: '700', fontSize: 15, color: '#000' },
    cardSubtitle: { fontFamily: 'Inter', fontSize: 12, color: '#5A6A6C' },

    infoBox: {
        flexDirection: 'row', alignItems: 'flex-start', gap: 8,
        backgroundColor: 'rgba(0,97,94,0.07)', borderRadius: 8, padding: 10,
    },
    infoText: { flex: 1, fontFamily: 'Inter', fontSize: 12, color: '#00615E', lineHeight: 17 },

    noticeText: { fontFamily: 'Inter', fontSize: 12, color: '#7D8A8C', lineHeight: 17, fontStyle: 'italic' },

    // Text-input field rows
    tfRow: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 44 },
    tfLabel: { fontFamily: 'Inter', fontWeight: '500', fontSize: 13, color: '#0A292D', width: 110, flexShrink: 0 },
    input: {
        flex: 1, borderWidth: 1, borderColor: '#E1D9CF', borderRadius: 8,
        backgroundColor: '#FAF9F6', paddingHorizontal: 12, paddingVertical: 10,
        fontFamily: 'Inter', fontSize: 14, color: '#0A292D',
    },
    countryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    countryBtnText: { flex: 1, fontFamily: 'Inter', fontSize: 14, color: '#0A292D', marginRight: 6 },

    saveBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 8, backgroundColor: '#00615E', borderRadius: 10, paddingVertical: 14, marginTop: 4,
        ...Platform.select({
            ios: { shadowColor: '#00615E', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8 },
            android: { elevation: 4 },
        }),
    },
    saveBtnText: { fontFamily: 'Inter', fontWeight: '700', fontSize: 15, color: '#FFFFFF' },
});

export default CustomerTypeTaxScreen;
