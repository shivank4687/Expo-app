import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Modal,
    FlatList,
    TextInput,
    StyleSheet,
    Image,
    Platform,
    KeyboardAvoidingView,
    Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/theme';
import { Country } from '@/services/api/core.api';
import { coreApi } from '@/services/api/core.api';

interface CountryCodeDropdownProps {
    onCountrySelect: (country: Country) => void;
    defaultCode?: string;
    selectedCountry?: Country | null;
}

export const CountryCodeDropdown: React.FC<CountryCodeDropdownProps> = ({
    onCountrySelect,
    defaultCode = '+52',
    selectedCountry,
}) => {
    const [isVisible, setIsVisible] = useState(false);
    const [countries, setCountries] = useState<Country[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentCountry, setCurrentCountry] = useState<Country | null>(selectedCountry || null);

    useEffect(() => {
        loadCountries();
    }, []);

    useEffect(() => {
        if (selectedCountry) {
            setCurrentCountry(selectedCountry);
        }
    }, [selectedCountry]);

    const loadCountries = async () => {
        try {
            const data = await coreApi.getCountries();
            // Filter countries that have dial_code
            const countriesWithDialCode = data.filter(c => c.dial_code);
            setCountries(countriesWithDialCode);
            
            // Set default country if not already set
            if (!currentCountry) {
                const defaultCountry = countriesWithDialCode.find(
                    c => c.dial_code === defaultCode
                ) || countriesWithDialCode[0];
                if (defaultCountry) {
                    setCurrentCountry(defaultCountry);
                    onCountrySelect(defaultCountry);
                }
            }
        } catch (error) {
            console.error('Error loading countries:', error);
        }
    };

    const filteredCountries = countries.filter(country => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (
            (country.name && country.name.toLowerCase().includes(term)) ||
            (country.dial_code && country.dial_code.includes(term)) ||
            (country.code && country.code.toLowerCase().includes(term))
        );
    });

    const handleSelectCountry = (country: Country) => {
        setCurrentCountry(country);
        onCountrySelect(country);
        setIsVisible(false);
        setSearchTerm('');
    };

    const renderCountryItem = ({ item }: { item: Country }) => (
        <TouchableOpacity
            style={[
                styles.countryItem,
                currentCountry?.id === item.id && styles.selectedCountryItem,
            ]}
            onPress={() => handleSelectCountry(item)}
        >
            {item.flag ? (
                <Image
                    source={{ uri: item.flag }}
                    style={styles.flag}
                    resizeMode="contain"
                />
            ) : (
                <View style={styles.flagPlaceholder}>
                    <Text style={styles.flagPlaceholderText}>
                        {item.code?.toUpperCase().slice(0, 2) || '🌐'}
                    </Text>
                </View>
            )}
            <Text style={styles.dialCode}>{item.dial_code}</Text>
            <Text style={styles.countryName} numberOfLines={1}>
                {item.name}
            </Text>
        </TouchableOpacity>
    );

    return (
        <>
            <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => setIsVisible(true)}
                activeOpacity={0.7}
            >
                {currentCountry?.flag ? (
                    <Image
                        source={{ uri: currentCountry.flag }}
                        style={styles.flagSmall}
                        resizeMode="contain"
                    />
                ) : (
                    <View style={styles.flagPlaceholderSmall}>
                        <Text style={styles.flagPlaceholderTextSmall}>
                            {currentCountry?.code?.toUpperCase().slice(0, 2) || '🌐'}
                        </Text>
                    </View>
                )}
                <Text style={styles.dialCodeText}>
                    {currentCountry?.dial_code || defaultCode}
                </Text>
                <Ionicons
                    name="chevron-down"
                    size={16}
                    color={theme.colors.neutral[600]}
                />
            </TouchableOpacity>

            <Modal
                visible={isVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setIsVisible(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    style={styles.modalOverlay}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
                >
                    <TouchableOpacity
                        style={styles.modalOverlay}
                        activeOpacity={1}
                        onPress={() => setIsVisible(false)}
                    >
                        <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Select Country</Text>
                                <TouchableOpacity
                                    onPress={() => setIsVisible(false)}
                                    style={styles.closeButton}
                                >
                                    <Ionicons
                                        name="close"
                                        size={24}
                                        color={theme.colors.text.primary}
                                    />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.searchContainer}>
                                <Ionicons
                                    name="search"
                                    size={20}
                                    color={theme.colors.neutral[400]}
                                    style={styles.searchIcon}
                                />
                                <TextInput
                                    style={styles.searchInput}
                                    placeholder="Search country or code..."
                                    placeholderTextColor={theme.colors.neutral[400]}
                                    value={searchTerm}
                                    onChangeText={setSearchTerm}
                                    autoCapitalize="none"
                                />
                            </View>

                            <View style={styles.countryListContainer}>
                                <FlatList
                                    data={filteredCountries}
                                    renderItem={renderCountryItem}
                                    keyExtractor={(item) => item.id}
                                    style={styles.countryList}
                                    contentContainerStyle={styles.countryListContent}
                                    showsVerticalScrollIndicator={true}
                                    keyboardShouldPersistTaps="handled"
                                    ListEmptyComponent={
                                        <View style={styles.emptyContainer}>
                                            <Text style={styles.emptyText}>
                                                No countries found
                                            </Text>
                                        </View>
                                    }
                                />
                            </View>
                        </View>
                    </TouchableOpacity>
                </KeyboardAvoidingView>
            </Modal>
        </>
    );
};

const styles = StyleSheet.create({
    dropdownButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: theme.spacing.xs,
        borderRightWidth: 1,
        borderRightColor: theme.colors.border.main,
        marginRight: theme.spacing.sm,
    },
    flagSmall: {
        width: 24,
        height: 16,
        marginRight: theme.spacing.xs,
        borderRadius: 2,
    },
    flagPlaceholderSmall: {
        width: 24,
        height: 16,
        marginRight: theme.spacing.xs,
        borderRadius: 2,
        backgroundColor: theme.colors.neutral[200],
        justifyContent: 'center',
        alignItems: 'center',
    },
    flagPlaceholderTextSmall: {
        fontSize: 10,
    },
    dialCodeText: {
        fontSize: theme.typography.fontSize.base,
        color: theme.colors.text.primary,
        fontWeight: theme.typography.fontWeight.medium,
        marginRight: theme.spacing.xs,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: theme.colors.white,
        borderTopLeftRadius: theme.borderRadius.xl,
        borderTopRightRadius: theme.borderRadius.xl,
        maxHeight: Dimensions.get('window').height * 0.65,
        paddingBottom: Platform.OS === 'ios' ? 34 : theme.spacing.md,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: theme.spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border.main,
    },
    modalTitle: {
        fontSize: theme.typography.fontSize.xl,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.text.primary,
    },
    closeButton: {
        padding: theme.spacing.xs,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        margin: theme.spacing.md,
        paddingHorizontal: theme.spacing.md,
        borderWidth: 1,
        borderColor: theme.colors.border.main,
        borderRadius: theme.borderRadius.md,
        backgroundColor: theme.colors.neutral[50],
    },
    searchIcon: {
        marginRight: theme.spacing.sm,
    },
    searchInput: {
        flex: 1,
        paddingVertical: theme.spacing.sm,
        fontSize: theme.typography.fontSize.base,
        color: theme.colors.text.primary,
    },
    countryListContainer: {
        height: Dimensions.get('window').height * 0.4,
        minHeight: 250,
    },
    countryList: {
        flex: 1,
    },
    countryListContent: {
        flexGrow: 1,
    },
    countryItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border.light,
    },
    selectedCountryItem: {
        backgroundColor: theme.colors.primary[50],
    },
    flag: {
        width: 32,
        height: 24,
        marginRight: theme.spacing.md,
        borderRadius: 4,
    },
    flagPlaceholder: {
        width: 32,
        height: 24,
        marginRight: theme.spacing.md,
        borderRadius: 4,
        backgroundColor: theme.colors.neutral[200],
        justifyContent: 'center',
        alignItems: 'center',
    },
    flagPlaceholderText: {
        fontSize: 12,
    },
    dialCode: {
        fontSize: theme.typography.fontSize.base,
        fontWeight: theme.typography.fontWeight.medium,
        color: theme.colors.text.primary,
        width: 60,
        marginRight: theme.spacing.md,
    },
    countryName: {
        flex: 1,
        fontSize: theme.typography.fontSize.base,
        color: theme.colors.text.primary,
    },
    emptyContainer: {
        padding: theme.spacing.xl,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: theme.typography.fontSize.base,
        color: theme.colors.text.secondary,
    },
});

export default CountryCodeDropdown;

