import React, { useState } from 'react';
import {
    View,
    Text,
    Modal,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    TextInput,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/theme';

export interface PickerItem {
    label: string;
    value: string;
}

interface PickerModalProps {
    visible: boolean;
    title: string;
    items: PickerItem[];
    selectedValue: string;
    onSelect: (value: string) => void;
    onClose: () => void;
    searchable?: boolean;
}

export const PickerModal: React.FC<PickerModalProps> = ({
    visible,
    title,
    items,
    selectedValue,
    onSelect,
    onClose,
    searchable = true,
}) => {
    const [searchQuery, setSearchQuery] = useState('');

    const filteredItems = searchable
        ? items.filter((item) =>
              item.label.toLowerCase().includes(searchQuery.toLowerCase())
          )
        : items;

    const handleSelect = (value: string) => {
        onSelect(value);
        setSearchQuery('');
        onClose();
    };

    const handleClose = () => {
        setSearchQuery('');
        onClose();
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={handleClose}
        >
            <View style={styles.overlay}>
                <View style={styles.modalContainer}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.title}>{title}</Text>
                        <TouchableOpacity
                            onPress={handleClose}
                            style={styles.closeButton}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <Ionicons name="close" size={24} color={theme.colors.text.primary} />
                        </TouchableOpacity>
                    </View>

                    {/* Search Bar */}
                    {searchable && (
                        <View style={styles.searchContainer}>
                            <Ionicons
                                name="search"
                                size={20}
                                color={theme.colors.text.secondary}
                                style={styles.searchIcon}
                            />
                            <TextInput
                                style={styles.searchInput}
                                placeholder={`Search ${title.toLowerCase()}...`}
                                placeholderTextColor={theme.colors.text.secondary}
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                autoCorrect={false}
                                autoCapitalize="none"
                            />
                            {searchQuery.length > 0 && (
                                <TouchableOpacity
                                    onPress={() => setSearchQuery('')}
                                    style={styles.clearButton}
                                >
                                    <Ionicons
                                        name="close-circle"
                                        size={20}
                                        color={theme.colors.text.secondary}
                                    />
                                </TouchableOpacity>
                            )}
                        </View>
                    )}

                    {/* Items List */}
                    <FlatList
                        data={filteredItems}
                        keyExtractor={(item) => item.value}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={[
                                    styles.item,
                                    item.value === selectedValue && styles.selectedItem,
                                ]}
                                onPress={() => handleSelect(item.value)}
                            >
                                <Text
                                    style={[
                                        styles.itemText,
                                        item.value === selectedValue && styles.selectedItemText,
                                    ]}
                                >
                                    {item.label}
                                </Text>
                                {item.value === selectedValue && (
                                    <Ionicons
                                        name="checkmark"
                                        size={20}
                                        color={theme.colors.primary[500]}
                                    />
                                )}
                            </TouchableOpacity>
                        )}
                        ItemSeparatorComponent={() => <View style={styles.separator} />}
                        ListEmptyComponent={() => (
                            <View style={styles.emptyContainer}>
                                <Text style={styles.emptyText}>
                                    {searchQuery
                                        ? 'No results found'
                                        : `No ${title.toLowerCase()} available`}
                                </Text>
                            </View>
                        )}
                        contentContainerStyle={styles.listContainer}
                    />
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        backgroundColor: theme.colors.white,
        borderTopLeftRadius: theme.borderRadius.xl,
        borderTopRightRadius: theme.borderRadius.xl,
        maxHeight: '80%',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: -2 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
            },
            android: {
                elevation: 8,
            },
        }),
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: theme.spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.gray[200],
    },
    title: {
        fontSize: theme.typography.fontSize.lg,
        fontWeight: theme.typography.fontWeight.semiBold,
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
        paddingVertical: Platform.OS === 'ios' ? theme.spacing.sm : theme.spacing.xs,
        backgroundColor: theme.colors.gray[100],
        borderRadius: theme.borderRadius.full,
    },
    searchIcon: {
        marginRight: theme.spacing.sm,
    },
    searchInput: {
        flex: 1,
        fontSize: theme.typography.fontSize.md,
        color: theme.colors.text.primary,
        paddingVertical: 0,
    },
    clearButton: {
        padding: theme.spacing.xs,
    },
    listContainer: {
        paddingBottom: Platform.OS === 'ios' ? theme.spacing.xl * 2 : theme.spacing.lg,
    },
    item: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.lg,
    },
    selectedItem: {
        backgroundColor: theme.colors.primary[50],
    },
    itemText: {
        fontSize: theme.typography.fontSize.md,
        color: theme.colors.text.primary,
        flex: 1,
    },
    selectedItemText: {
        fontWeight: theme.typography.fontWeight.semiBold,
        color: theme.colors.primary[500],
    },
    separator: {
        height: 1,
        backgroundColor: theme.colors.gray[200],
        marginLeft: theme.spacing.lg,
    },
    emptyContainer: {
        padding: theme.spacing.xl * 2,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: theme.typography.fontSize.md,
        color: theme.colors.text.secondary,
    },
});

