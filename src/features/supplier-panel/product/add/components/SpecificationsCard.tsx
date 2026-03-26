import React, { useState, forwardRef, useImperativeHandle } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/features/supplier-panel/styles';

export interface Specification {
    key: string;
    value: string;
}

export interface SpecificationsCardRef {
    getData: () => ({ specifications: Specification[] });
    updateFields: (data: any) => void;
}

const SpecificationsCard = forwardRef<SpecificationsCardRef, {}>((props, ref) => {
    const [specifications, setSpecifications] = useState<Specification[]>([]);

    useImperativeHandle(ref, () => ({
        getData: () => {
            // Filter out empty key/value pairs before returning
            return {
                specifications: specifications.filter(spec => spec.key.trim() !== '' && spec.value.trim() !== '')
            };
        },
        updateFields: (data) => {
            if (data?.specifications && Array.isArray(data.specifications)) {
                setSpecifications(data.specifications);
            }
        }
    }));

    const handleAddRow = () => {
        setSpecifications(prev => [...prev, { key: '', value: '' }]);
    };

    const handleRemoveRow = (index: number) => {
        setSpecifications(prev => prev.filter((_, i) => i !== index));
    };

    const handleChangeKey = (text: string, index: number) => {
        setSpecifications(prev => {
            const newSpecs = [...prev];
            newSpecs[index].key = text;
            return newSpecs;
        });
    };

    const handleChangeValue = (text: string, index: number) => {
        setSpecifications(prev => {
            const newSpecs = [...prev];
            newSpecs[index].value = text;
            return newSpecs;
        });
    };

    return (
        <View style={styles.card}>
            <View style={styles.titleContainer}>
                <Text style={styles.cardTitle}>Specifications</Text>
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>Optional</Text>
                </View>
            </View>

            <View style={styles.content}>
                <Text style={styles.tipText}>
                    Add dynamic specifications globally visible for your product (e.g., Set: 2 mugs).
                </Text>

                {specifications.map((spec, index) => (
                    <View key={index} style={styles.row}>
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.input}
                                placeholder="Key (e.g. Set)"
                                value={spec.key}
                                onChangeText={(text) => handleChangeKey(text, index)}
                                placeholderTextColor="#999"
                            />
                        </View>
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.input}
                                placeholder="Value (e.g. 2 mugs)"
                                value={spec.value}
                                onChangeText={(text) => handleChangeValue(text, index)}
                                placeholderTextColor="#999"
                            />
                        </View>
                        <TouchableOpacity style={styles.deleteBtn} onPress={() => handleRemoveRow(index)}>
                            <Ionicons name="trash-outline" size={20} color="#DC2626" />
                        </TouchableOpacity>
                    </View>
                ))}

                <TouchableOpacity style={styles.addButton} onPress={handleAddRow}>
                    <Ionicons name="add" size={16} color="#000" />
                    <Text style={styles.addButtonText}>Add Specification</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
});

export default SpecificationsCard;

const styles = StyleSheet.create({
    card: {
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'flex-start',
        padding: 16,
        gap: 8,
        width: '100%',
        backgroundColor: COLORS.white,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 3,
        borderRadius: 16,
        position: 'relative',
    },
    titleContainer: {
        width: '100%',
        position: 'relative',
    },
    cardTitle: {
        width: '100%',
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '500',
        fontSize: 20,
        lineHeight: 24,
        color: '#000000',
    },
    badge: {
        position: 'absolute',
        right: 0,
        top: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 4,
        paddingHorizontal: 8,
        backgroundColor: COLORS.primaryLight,
        borderWidth: 1,
        borderColor: COLORS.primary,
        borderRadius: 70,
    },
    badgeText: {
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '400',
        fontSize: 12,
        lineHeight: 14,
        color: '#000000',
    },
    content: {
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 12,
        width: '100%',
    },
    tipText: {
        width: '100%',
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '400',
        fontSize: 14,
        lineHeight: 20,
        color: '#666666',
        marginBottom: 8,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        width: '100%',
    },
    inputContainer: {
        flex: 1,
        height: 44,
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 8,
        justifyContent: 'center',
        paddingHorizontal: 12,
    },
    input: {
        fontFamily: 'Inter',
        fontSize: 14,
        color: '#000',
        flex: 1,
    },
    deleteBtn: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FEF2F2',
        borderWidth: 1,
        borderColor: '#FECACA',
        borderRadius: 8,
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        gap: 8,
        width: '100%',
        height: 44,
        backgroundColor: COLORS.primaryLight,
        borderWidth: 1,
        borderColor: COLORS.primary,
        borderRadius: 8,
        marginTop: 8,
    },
    addButtonText: {
        fontFamily: 'Inter',
        fontWeight: '500',
        fontSize: 14,
        color: '#000',
    },
});
