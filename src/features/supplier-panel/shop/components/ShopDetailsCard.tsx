import React from 'react';
import { View, Text, StyleSheet, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export const ShopDetailsCard = () => {
    return (
        <View style={styles.container}>
            {/* Overview */}
            <View style={styles.fieldContainerLarge}>
                <Text style={styles.label}>Overview</Text>
                <View style={styles.inputContainerLarge}>
                    <TextInput
                        style={styles.inputLarge}
                        placeholder="Enter here..."
                        placeholderTextColor="#666666"
                        multiline
                        textAlignVertical="top"
                    />
                </View>
                <Text style={styles.tipText}>
                    Tip: Add origin, technique, materials, time spent, and "made in...".
                </Text>
            </View>

            {/* Country */}
            <View style={styles.fieldContainerSmall}>
                <Text style={styles.label}>Country</Text>
                <View style={styles.inputContainerSmall}>
                    <TextInput
                        style={styles.inputSmall}
                        placeholder="Enter here..."
                        placeholderTextColor="#666666"
                    />
                    <Ionicons name="chevron-down" size={16} color="#666666" />
                </View>
            </View>

            {/* City/Region */}
            <View style={styles.fieldContainerSmall}>
                <Text style={styles.label}>City/Region</Text>
                <View style={styles.inputContainerSmall}>
                    <TextInput
                        style={styles.inputSmall}
                        placeholder="Enter here..."
                        placeholderTextColor="#666666"
                    />
                </View>
            </View>

            {/* Logo (optional) */}
            <View style={styles.fieldContainerSmall}>
                <Text style={styles.label}>Logo (optional)</Text>
                <View style={styles.inputContainerSmall}>
                    <Ionicons name="attach" size={16} color="#666666" />
                    <TextInput
                        style={styles.inputSmall}
                        placeholder="Enter here..."
                        placeholderTextColor="#666666"
                    />
                </View>
            </View>

            {/* WhatsApp (for customers) */}
            <View style={styles.fieldContainerSmall}>
                <Text style={styles.label}>WhatsApp (for customers)</Text>
                <View style={styles.inputContainerSmall}>
                    <TextInput
                        style={styles.inputSmall}
                        placeholder="Enter here..."
                        placeholderTextColor="#666666"
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
    fieldContainerLarge: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        padding: 0,
        gap: 8,
        width: 329,
        height: 187,
    },
    fieldContainerSmall: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        padding: 0,
        gap: 8,
        width: 329,
        height: 67,
    },
    label: {
        width: 329,
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
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 52,
        gap: 10,
        width: 329,
        height: 112,
        backgroundColor: '#EEEEEF',
        borderRadius: 8,
    },
    inputContainerSmall: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 10,
        width: 329,
        height: 40,
        backgroundColor: '#EEEEEF',
        borderRadius: 8,
    },
    inputLarge: {
        flex: 1,
        height: 48,
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '400',
        fontSize: 16,
        lineHeight: 16,
        color: '#666666',
        padding: 0,
    },
    inputSmall: {
        flex: 1,
        height: 16,
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '400',
        fontSize: 16,
        lineHeight: 16,
        color: '#666666',
        padding: 0,
    },
    tipText: {
        width: 329,
        height: 40,
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '400',
        fontSize: 14,
        lineHeight: 20,
        color: '#666666',
    }
});
