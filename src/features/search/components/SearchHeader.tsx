import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '@/store/hooks';
import { theme } from '@/theme';

interface SearchHeaderProps {
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    handleSearch: () => void;
    handleClearSearch: () => void;
    searchInputRef: React.RefObject<TextInput>;
    autoFocus?: boolean;
}

export const SearchHeader: React.FC<SearchHeaderProps> = ({
    searchQuery,
    setSearchQuery,
    handleSearch,
    handleClearSearch,
    searchInputRef,
    autoFocus = false,
}) => {
    const router = useRouter();
    const { t } = useTranslation();
    const cartItemsCount = useAppSelector((state) => state.cart.cart?.items_count || 0);

    return (
        <View style={styles.header}>
            <TouchableOpacity
                onPress={() => router.back()}
                style={styles.backButton}
                activeOpacity={0.7}
            >
                <Ionicons name="arrow-back" size={26} color={theme.colors.white} />
            </TouchableOpacity>

            <View style={styles.searchInputContainer}>
                <Ionicons
                    name="search-outline"
                    size={20}
                    color={theme.colors.primary[500]}
                />
                <TextInput
                    ref={searchInputRef}
                    style={styles.searchInput}
                    placeholder={t('search.searchProducts')}
                    placeholderTextColor={theme.colors.text.secondary}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    onSubmitEditing={handleSearch}
                    returnKeyType="search"
                    autoFocus={autoFocus}
                    autoCorrect={false}
                    autoCapitalize="none"
                />
                {searchQuery.length > 0 && (
                    <TouchableOpacity
                        onPress={handleClearSearch}
                        style={styles.clearIcon}
                    >
                        <Ionicons
                            name="close-circle"
                            size={20}
                            color={theme.colors.text.secondary}
                        />
                    </TouchableOpacity>
                )}
            </View>

            <TouchableOpacity
                onPress={() => router.push('/(drawer)/(tabs)/cart')}
                style={styles.cartButton}
                activeOpacity={0.7}
            >
                <View style={styles.iconWrapper}>
                    <Ionicons name="cart-outline" size={26} color={theme.colors.white} />
                    {cartItemsCount > 0 && (
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>
                                {cartItemsCount > 99 ? '99+' : cartItemsCount}
                            </Text>
                        </View>
                    )}
                </View>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingBottom: theme.spacing.sm,
        paddingHorizontal: theme.spacing.sm,
        backgroundColor: theme.colors.primary[500],
        ...theme.shadows.sm,
    },
    backButton: {
        padding: theme.spacing.xs,
        marginRight: theme.spacing.xs,
        justifyContent: 'center',
        alignItems: 'center',
    },
    searchInputContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.white,
        borderRadius: theme.borderRadius.full,
        paddingHorizontal: theme.spacing.md,
        height: 42,
        ...theme.shadows.sm,
        borderWidth: 1,
        borderColor: theme.colors.gray[100],
    },
    searchInput: {
        flex: 1,
        marginLeft: theme.spacing.sm,
        fontSize: theme.typography.fontSize.md,
        color: theme.colors.text.primary,
        paddingVertical: 0,
    },
    clearIcon: {
        padding: theme.spacing.xs,
    },
    cartButton: {
        padding: theme.spacing.xs,
        marginLeft: theme.spacing.sm,
    },
    iconWrapper: {
        position: 'relative',
        justifyContent: 'center',
        alignItems: 'center',
    },
    badge: {
        position: 'absolute',
        top: -4,
        right: -10,
        minWidth: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: theme.colors.error.main,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 3,
    },
    badgeText: {
        color: theme.colors.white,
        fontSize: 9,
        fontWeight: '700',
        lineHeight: 12,
    },
});
