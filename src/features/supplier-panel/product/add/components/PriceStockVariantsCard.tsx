import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/features/supplier-panel/styles';
import { Dropdown } from '@/features/supplier-panel/components';
import { AiIcon } from '@/assets/icons';
import { ProductAttribute, productAttributesApi } from '../api/product-attributes.api';
import { InputModal } from '@/shared/components';
import { useToast } from '@/shared/components/Toast';

export interface PriceStockVariantsCardProps {
    attributes?: ProductAttribute[];
    onAttributesRefresh?: () => Promise<void>;
}

export interface PriceStockVariantsCardRef {
    getData: () => any;
}

const PriceStockVariantsCard = forwardRef<PriceStockVariantsCardRef, PriceStockVariantsCardProps>(({ attributes = [], onAttributesRefresh }, ref) => {
    // Selected attributes for configuration (e.g. Color, Size)
    // Storing IDs as strings
    const [selectedVariantAttributes, setSelectedVariantAttributes] = useState<string[]>([]);

    // Generated Variants
    // Structure: { id: string, attributes: { [attrId]: optionId }, price: string, stock: string, ... }
    const [variants, setVariants] = useState<any[]>([]);
    const [mainVariantId, setMainVariantId] = useState<string | null>(null);

    // Temp state for multi-attribute selection
    const [tempSelection, setTempSelection] = useState<Record<string, string>>({});

    // UI States
    const [inStockEnabled, setInStockEnabled] = useState(false);
    const [madeToOrderEnabled, setMadeToOrderEnabled] = useState(false);
    const [isAddingOption, setIsAddingOption] = useState(false);
    const [showOptionModal, setShowOptionModal] = useState(false);
    const [targetAttributeId, setTargetAttributeId] = useState<string | null>(null);

    const { showToast } = useToast();

    // Filter relevant attributes for variants (select/multiselect types)
    // Strictly filtering for Color and Size as per user request to match web app
    const validAttributes = attributes.filter(a =>
        ['color', 'size'].includes(a.code)
    );

    useImperativeHandle(ref, () => ({
        getData: () => ({
            super_attributes: selectedVariantAttributes.map(id => {
                const attr = attributes.find(a => a.id.toString() === id);
                return {
                    attribute_code: attr?.code,
                    attribute_id: attr?.id,
                };
            }),
            variants: variants.map(v => ({
                ...v,
                manage_stock: inStockEnabled ? 1 : 0,
                made_to_order: madeToOrderEnabled ? 1 : 0,
            })),
            main_variant_id: mainVariantId,
        })
    }));

    // Reset variants when variant group changes
    useEffect(() => {
        setVariants(prev => prev.filter(v => {
            // Keep variant only if it has keys for all selected attributes
            return selectedVariantAttributes.every(attrId => v.attributes && v.attributes[attrId]);
        }));
    }, [selectedVariantAttributes]);


    const handleAddVariantOption = async (optionName: string) => {
        if (!targetAttributeId) return;

        setIsAddingOption(true);
        try {
            const attr = attributes.find(a => a.id.toString() === targetAttributeId);
            if (!attr) throw new Error('Attribute not found');

            const newOption = await productAttributesApi.createAttributeOption(
                attr.code,
                optionName
            );

            if (onAttributesRefresh) {
                await onAttributesRefresh();
            }

            // Auto-select the new option if in Single Attribute Mode
            if (selectedVariantAttributes.length === 1) {
                toggleVariantSingleAttr(targetAttributeId, newOption.id.toString());
            }

            showToast({
                message: `Option "${optionName}" added successfully!`,
                type: 'success',
            });

        } catch (error) {
            console.error('Error adding option:', error);
            showToast({
                message: 'Failed to add option.',
                type: 'error',
            });
        } finally {
            setIsAddingOption(false);
            setShowOptionModal(false);
        }
    };

    const toggleVariantSingleAttr = (attrId: string, optionId: string) => {
        // Check if variant exists
        const exists = variants.find(v => v.attributes[attrId] === optionId);

        if (exists) {
            // Remove
            setVariants(prev => prev.filter(v => v.id !== exists.id));
            if (mainVariantId === exists.id) setMainVariantId(null);
        } else {
            // Add
            const newVariant = {
                id: Date.now().toString(),
                attributes: { [attrId]: optionId },
                sku: '',
                price: '',
                stock: '',
            };
            setVariants(prev => [...prev, newVariant]);
            if (!mainVariantId) setMainVariantId(newVariant.id);
        }
    };

    const addMultiAttrVariant = () => {
        // Check if all selected attributes have a value in tempSelection
        const allSelected = selectedVariantAttributes.every(id => tempSelection[id]);
        if (!allSelected) {
            Alert.alert('Selection Missing', 'Please select values for all attributes.');
            return;
        }

        // Check if duplicate
        const isDuplicate = variants.some(v =>
            selectedVariantAttributes.every(attrId => v.attributes[attrId] === tempSelection[attrId])
        );

        if (isDuplicate) {
            Alert.alert('Duplicate', 'This variant already exists.');
            return;
        }

        const newVariant = {
            id: Date.now().toString(),
            attributes: { ...tempSelection },
            sku: '',
            price: '',
            stock: '',
        };

        setVariants(prev => [...prev, newVariant]);
        if (!mainVariantId) setMainVariantId(newVariant.id);
    };

    const removeVariant = (id: string) => {
        setVariants(prev => prev.filter(v => v.id !== id));
        if (mainVariantId === id) setMainVariantId(null);
    };

    const updateVariantField = (id: string, field: string, value: string) => {
        setVariants(prev => prev.map(v =>
            v.id === id ? { ...v, [field]: value } : v
        ));
    };

    const isOptionSelected = (attrId: string, optionId: string) => {
        return variants.some(v => v.attributes[attrId] === optionId);
    };

    const getVariantLabel = (variant: any) => {
        return selectedVariantAttributes.map(attrId => {
            const attr = attributes.find(a => a.id.toString() === attrId);
            const opt = attr?.options?.find(o => o.id.toString() === variant.attributes[attrId]);
            return opt?.admin_name || '?';
        }).join(' - ');
    };

    return (
        <View style={styles.card}>
            {/* Card Title */}
            <Text style={styles.cardTitle}>2) Price & Stock & Variants</Text>

            {/* Variant Group Section */}
            <View style={styles.section}>
                <View style={styles.inputGroup}>
                    <Text style={styles.sectionTitle}>Variant Group</Text>
                    <Text style={styles.tipText}>Choose or create your group.</Text>
                    <Dropdown
                        placeholder="Choose attributes (e.g. Color, Size)..."
                        options={validAttributes.map(a => ({ label: a.admin_name, value: a.id.toString() }))}
                        value={selectedVariantAttributes}
                        onSelect={setSelectedVariantAttributes}
                        multiple
                    />
                </View>
            </View>

            {/* Values Section */}
            <View style={styles.section}>
                <View style={styles.valuesHeader}>
                    <Text style={styles.sectionTitle}>Values</Text>
                    <Text style={styles.tipText}>
                        {selectedVariantAttributes.length > 1
                            ? 'Select values and click Add Variant.'
                            : 'Tap a value to add/remove it as a variant.'}
                    </Text>
                </View>

                {/* Single Attribute Selection */}
                {selectedVariantAttributes.length === 1 && (() => {
                    const attrId = selectedVariantAttributes[0];
                    const attr = attributes.find(a => a.id.toString() === attrId);

                    if (!attr) return null;

                    return (
                        <View style={styles.chipsContainer}>
                            {(attr.options || []).map((option, index) => {
                                const selected = isOptionSelected(attrId, option.id.toString());
                                return (
                                    <TouchableOpacity
                                        key={index}
                                        style={[
                                            styles.chip,
                                            selected && styles.chipActive
                                        ]}
                                        onPress={() => toggleVariantSingleAttr(attrId, option.id.toString())}
                                    >
                                        <Text style={styles.chipText}>{option.admin_name}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                            <TouchableOpacity
                                style={styles.addChipButton}
                                onPress={() => {
                                    setTargetAttributeId(attrId);
                                    setShowOptionModal(true);
                                }}
                            >
                                <Ionicons name="add" size={24} color="#FFFFFF" />
                            </TouchableOpacity>
                        </View>
                    );
                })()}

                {/* Multiple Attribute Selection */}
                {selectedVariantAttributes.length > 1 && (
                    <View style={styles.multiSelectContainer}>
                        {selectedVariantAttributes.map(attrId => {
                            const attr = attributes.find(a => a.id.toString() === attrId);
                            return (
                                <View key={attrId} style={styles.inputGroup}>
                                    <Text style={styles.label}>{attr?.admin_name}</Text>
                                    <Dropdown
                                        placeholder={`Select ${attr?.admin_name}...`}
                                        options={(attr?.options || []).map(o => ({ label: o.admin_name, value: o.id.toString() }))}
                                        value={tempSelection[attrId] || ''}
                                        onSelect={(val) => setTempSelection(prev => ({ ...prev, [attrId]: val }))}
                                    />
                                </View>
                            );
                        })}
                        <TouchableOpacity style={styles.addButton} onPress={addMultiAttrVariant}>
                            <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" />
                            <Text style={styles.addButtonText}>Add Variant</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* AI Suggestion */}
                <TouchableOpacity style={styles.aiButton}>
                    <AiIcon width={16} height={16} color="#000000" />
                    <Text style={styles.buttonText}>Suggest values with AI</Text>
                </TouchableOpacity>
            </View>

            {/* Main Variant Selector */}
            {variants.length > 0 && (
                <View style={styles.section}>
                    <View style={styles.valuesHeader}>
                        <Text style={styles.sectionTitle}>Main Variant (Default)</Text>
                        <Text style={styles.tipText}>Select the default variant to show.</Text>
                    </View>

                    <View style={styles.variantChipsContainer}>
                        {variants.map((variant, index) => (
                            <TouchableOpacity
                                key={variant.id}
                                style={[
                                    styles.variantChip,
                                    mainVariantId === variant.id && styles.chipActive
                                ]}
                                onPress={() => setMainVariantId(variant.id)}
                            >
                                <Text style={styles.chipText}>{getVariantLabel(variant)}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            )}

            {/* Generated Variants Editors */}
            {variants.map((variant) => (
                <View key={variant.id} style={styles.variantEditorCard}>
                    <View style={styles.variantHeader}>
                        <Text style={styles.variantTitle}>{getVariantLabel(variant)}</Text>
                        <TouchableOpacity onPress={() => removeVariant(variant.id)}>
                            <Ionicons name="trash-outline" size={20} color={COLORS.error} />
                        </TouchableOpacity>
                    </View>


                    <View style={styles.rowInputs}>
                        <View style={styles.halfInputContainer}>
                            <Text style={styles.sectionTitle}>Price</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Price"
                                keyboardType="numeric"
                                value={variant.price}
                                onChangeText={v => updateVariantField(variant.id, 'price', v)}
                            />
                        </View>
                        <View style={styles.halfInputContainer}>
                            <Text style={styles.sectionTitle}>Stock</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Qty"
                                keyboardType="numeric"
                                value={variant.stock}
                                onChangeText={v => updateVariantField(variant.id, 'stock', v)}
                            />
                        </View>
                    </View>
                </View>
            ))}

            {/* Footer */}
            <View style={styles.footer}>
                <TouchableOpacity style={styles.publishButton}>
                    <Text style={styles.publishButtonText}>Apply Changes</Text>
                </TouchableOpacity>
            </View>

            {/* Option Creation Modal */}
            <InputModal
                visible={showOptionModal}
                onClose={() => setShowOptionModal(false)}
                onSubmit={handleAddVariantOption}
                title={`Add ${targetAttributeId ? attributes.find(a => a.id.toString() === targetAttributeId)?.admin_name : 'Option'}`}
                placeholder="Option name..."
                submitButtonText="Add Option"
                isLoading={isAddingOption}
            />
        </View>
    );
});

export default PriceStockVariantsCard;

const styles = StyleSheet.create({
    card: {
        flexDirection: 'column',
        padding: 16,
        gap: 16,
        width: '100%',
        backgroundColor: COLORS.white,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 3,
        borderRadius: 16,
        marginBottom: 80, // Extra space at bottom for scrolling
    },
    cardTitle: {
        fontFamily: 'Inter',
        fontWeight: '500',
        fontSize: 20,
        marginBottom: 8,
        color: '#000000',
    },
    section: {
        flexDirection: 'column',
        gap: 8,
        width: '100%',
    },
    sectionTitle: {
        fontFamily: 'Inter',
        fontWeight: '500',
        fontSize: 16,
        color: '#000000',
    },
    valuesHeader: {
        marginBottom: 4,
    },
    tipText: {
        fontFamily: 'Inter',
        fontWeight: '400',
        fontSize: 14,
        color: '#666666',
    },
    inputGroup: {
        gap: 8,
    },
    input: {
        width: '100%',
        height: 40,
        backgroundColor: '#EEEEEF',
        borderRadius: 8,
        paddingHorizontal: 16,
        fontFamily: 'Inter',
        fontSize: 16,
        color: '#000000',
    },
    chipsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    chip: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        backgroundColor: '#EEEEEF',
        borderRadius: 8,
        minWidth: 40,
        alignItems: 'center',
    },
    chipActive: {
        backgroundColor: COLORS.primaryLight,
        borderWidth: 1,
        borderColor: COLORS.primary,
    },
    chipText: {
        fontFamily: 'Inter',
        fontSize: 14,
        color: '#000000',
    },
    addChipButton: {
        width: 40,
        height: 36, // Approximate height to match chips
        backgroundColor: COLORS.primary,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    multiSelectContainer: {
        gap: 12,
        padding: 12,
        backgroundColor: '#f9f9f9',
        borderRadius: 8,
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.primary,
        padding: 10,
        borderRadius: 8,
        gap: 8,
        marginTop: 8,
    },
    addButtonText: {
        color: '#FFF',
        fontWeight: '600',
        fontFamily: 'Inter',
    },
    aiButton: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 12,
        gap: 8,
        height: 40,
        backgroundColor: COLORS.primaryLight,
        borderWidth: 1,
        borderColor: COLORS.primary,
        borderRadius: 8,
    },
    buttonText: {
        fontFamily: 'Inter',
        fontWeight: '400',
        fontSize: 16,
        color: '#000000',
    },
    variantChipsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8
    },
    variantChip: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        backgroundColor: '#F3F4F6',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    variantEditorCard: {
        padding: 12,
        backgroundColor: '#FAFAFA',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#EEEEEE',
        gap: 12,
    },
    variantHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    variantTitle: {
        fontWeight: '600',
        fontSize: 16,
        color: '#1F2937',
    },
    rowInputs: {
        flexDirection: 'row',
        gap: 12,
    },
    halfInputContainer: {
        flex: 1,
        gap: 8,
    },
    footer: {
        marginTop: 16,
    },
    publishButton: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 12,
        height: 44,
        backgroundColor: COLORS.primary,
        borderRadius: 8,
    },
    publishButtonText: {
        fontFamily: 'Inter',
        fontWeight: '600',
        fontSize: 16,
        color: '#F5F5F5',
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: '#374151',
    }
});
