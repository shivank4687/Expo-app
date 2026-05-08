import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { theme } from '@/theme';

interface SearchHeaderProps {
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    handleSearch: () => void;
    handleClearSearch: () => void;
    handleVoiceSearch: () => void;
    searchInputRef: React.RefObject<TextInput>;
    autoFocus?: boolean;
}

export const SearchHeader: React.FC<SearchHeaderProps> = ({
    searchQuery,
    setSearchQuery,
    handleSearch,
    handleClearSearch,
    handleVoiceSearch,
    searchInputRef,
    autoFocus = false,
}) => {
    const router = useRouter();
    const { t } = useTranslation();

    return (
        <View style={styles.header}>
            <TouchableOpacity
                onPress={() => router.back()}
                style={styles.backButton}
                activeOpacity={0.7}
            >
                <Ionicons name="arrow-back" size={18} color={theme.colors.text.primary} />
            </TouchableOpacity>

            <View style={styles.searchInputContainer}>
                <Ionicons
                    name="search-outline"
                    size={20}
                    color={theme.colors.text.secondary}
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
                onPress={handleVoiceSearch}
                style={styles.micButton}
            >
                <Ionicons name="mic-outline" size={24} color={theme.colors.text.primary} />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingHorizontal: theme.spacing.md,
        backgroundColor: theme.colors.background.default,
        ...theme.shadows.sm,
    },
    backButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: theme.colors.white,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: theme.spacing.sm,
        ...theme.shadows.sm,
    },
    searchInputContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.white,
        borderRadius: theme.borderRadius.full,
        paddingHorizontal: theme.spacing.md,
        height: 44,
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
    micButton: {
        padding: theme.spacing.xs,
        marginLeft: theme.spacing.sm,
    },
});
