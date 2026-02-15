import React from 'react';
import { View, Text, StyleSheet, TextInput } from 'react-native';

interface PoliciesCardProps {
    data: {
        shipping_policy?: string;
        privacy_policy?: string;
        return_policy?: string;
    };
    onChange: (field: string, value: string) => void;
}

export const PoliciesCard: React.FC<PoliciesCardProps> = ({ data, onChange }) => {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>3) Policies</Text>

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
