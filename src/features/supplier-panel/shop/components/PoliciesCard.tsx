import React from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { AiIcon } from '@/assets/icons';
import { COLORS } from '@/features/supplier-panel/styles';
import { useAppSelector } from '@/store/hooks';

interface PoliciesCardProps {
    data: {
        shipping_policy?: string;
        privacy_policy?: string;
        return_policy?: string;
    };
    onChange: (field: string, value: string) => void;
    onAIGenerateClick: () => void;
}

export const PoliciesCard: React.FC<PoliciesCardProps> = ({ data, onChange, onAIGenerateClick }) => {
    const isConnected = useAppSelector((state) => state.network.isConnected);

    return (
        <View style={styles.container}>
            <View style={styles.headerRow}>
                <Text style={styles.title}>3) Policies</Text>
                <TouchableOpacity
                    style={[styles.aiButton, !isConnected && styles.aiButtonDisabled]}
                    onPress={onAIGenerateClick}
                    disabled={!isConnected}
                >
                    <AiIcon width={14} height={14} color={isConnected ? COLORS.primary : '#999999'} />
                    <Text style={[styles.aiButtonText, !isConnected && styles.aiButtonTextDisabled]}>Auto-generate</Text>
                </TouchableOpacity>
            </View>

            {/* Shipping Policy */}
            <View style={styles.fieldContainerLarge}>
                <Text style={styles.label}>Shipping Policy</Text>
                <View style={styles.inputContainerLarge}>
                    <TextInput
                        style={styles.inputLarge}
                        placeholder="Enter shipping policy details..."
                        placeholderTextColor="#666666"
                        multiline
                        scrollEnabled={true}
                        textAlignVertical="top"
                        value={data.shipping_policy}
                        onChangeText={(val) => onChange('shipping_policy', val)}
                    />
                </View>
            </View>

            {/* Privacy Policy */}
            <View style={styles.fieldContainerLarge}>
                <Text style={styles.label}>Privacy Policy</Text>
                <View style={styles.inputContainerLarge}>
                    <TextInput
                        style={styles.inputLarge}
                        placeholder="Enter privacy policy details..."
                        placeholderTextColor="#666666"
                        multiline
                        scrollEnabled={true}
                        textAlignVertical="top"
                        value={data.privacy_policy}
                        onChangeText={(val) => onChange('privacy_policy', val)}
                    />
                </View>
            </View>

            {/* Return Policy */}
            <View style={styles.fieldContainerLarge}>
                <Text style={styles.label}>Return Policy</Text>
                <View style={styles.inputContainerLarge}>
                    <TextInput
                        style={styles.inputLarge}
                        placeholder="Enter return policy details..."
                        placeholderTextColor="#666666"
                        multiline
                        scrollEnabled={true}
                        textAlignVertical="top"
                        value={data.return_policy}
                        onChangeText={(val) => onChange('return_policy', val)}
                    />
                </View>
            </View>
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
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
    },
    title: {
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '500',
        fontSize: 20,
        lineHeight: 24,
        color: '#000000',
    },
    aiButton: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 6,
        paddingHorizontal: 12,
        gap: 6,
        backgroundColor: COLORS.primaryLight,
        borderWidth: 1,
        borderColor: COLORS.primary,
        borderRadius: 8,
    },
    aiButtonDisabled: {
        backgroundColor: '#F3F3F3',
        borderColor: '#D1D1D1',
        opacity: 0.55,
    },
    aiButtonText: {
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '500',
        fontSize: 14,
        color: COLORS.primary,
    },
    aiButtonTextDisabled: {
        color: '#999999',
    },
    fieldContainerLarge: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        padding: 0,
        gap: 8,
        width: "100%",
    },
    label: {
        width: "100%",
        height: 19,
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '500',
        fontSize: 16,
        lineHeight: 19,
        color: '#000000',
    },
    inputContainerLarge: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'flex-start',
        paddingLeft: 16,
        gap: 10,
        width: "100%",
        height: 112,
        backgroundColor: '#EEEEEF',
        borderRadius: 8,
    },
    inputLarge: {
        flex: 1,
        height: 112,
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '400',
        fontSize: 16,
        lineHeight: 16,
        color: '#666666',
        padding: 0,
        paddingTop: 12,
        paddingLeft: 4,
    },
});
