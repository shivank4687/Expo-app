import React from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/features/supplier-panel/styles';

export const SalesShippingCard = () => {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Sales Shipping</Text>

            {/* Minimum order */}
            <View style={styles.fieldContainer}>
                <Text style={styles.label}>Minimum order</Text>
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter here..."
                        placeholderTextColor="#666666"
                    />
                </View>
            </View>

            {/* Free shipping starting at */}
            <View style={styles.fieldContainer}>
                <Text style={styles.label}>Free shipping starting at</Text>
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter here..."
                        placeholderTextColor="#666666"
                    />
                </View>
            </View>

            {/* Preparation time */}
            <View style={[styles.fieldContainer, { height: 95 }]}>
                <Text style={styles.label}>Preparation time (days)</Text>
                <Text style={styles.description}>Faster is better, but guaranteed</Text>
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter here..."
                        placeholderTextColor="#666666"
                    />
                </View>
            </View>

            {/* Automatic validation */}
            <View style={[styles.fieldContainer, { height: 'auto', gap: 4 }]}>
                <Text style={styles.label}>Automatic validation (recommended)</Text>
                <Text style={styles.description}>The order is confirmed instantly. Better ranking + more sales.</Text>
            </View>

            {/* To be approved */}
            <View style={[styles.fieldContainer, { height: 'auto', gap: 4 }]}>
                <Text style={styles.label}>To be approved</Text>
                <Text style={styles.description}>
                    You receive a message with the list: you can remove out-of-stock items and adjust quantities.
                </Text>
            </View>

            {/* Special Sales Section */}
            <View style={styles.specialSalesContainer}>
                <View style={styles.checkboxRow}>
                    <View style={styles.checkbox} />
                    <View style={styles.flex1}>
                        <Text style={styles.label}>Activate special sales</Text>
                        <Text style={styles.description}>
                            The special price is calculated from the wholesale price
                        </Text>
                    </View>
                </View>

                <View style={styles.multiplierContainer}>
                    <View style={styles.rowSpaceBetween}>
                        <Text style={styles.label}>Multiplier</Text>
                        <Text style={styles.description}>Default x2</Text>
                    </View>
                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter here..."
                            placeholderTextColor="#666666"
                        />
                    </View>
                </View>
            </View>

            {/* Returns policy */}
            <View style={[styles.fieldContainer, { height: 95 }]}>
                <Text style={styles.label}>Returns policy</Text>
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter here..."
                        placeholderTextColor="#666666"
                    />
                    <Ionicons name="chevron-down" size={16} color="#666666" />
                </View>
                <Text style={styles.description}>More trust, more orders.</Text>
            </View>

            {/* Custom orders */}
            <View style={[styles.fieldContainer, { height: 95 }]}>
                <Text style={styles.label}>Custom orders</Text>
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter here..."
                        placeholderTextColor="#666666"
                    />
                    <Ionicons name="chevron-down" size={16} color="#666666" />
                </View>
                <Text style={styles.description}>If "Yes", the customer can submit the request.</Text>
            </View>

            {/* Discounts */}
            <View style={[styles.fieldContainer, { height: 'auto' }]}>
                <Text style={styles.label}>Discounts starting at 500.</Text>
                <Text style={styles.description}>% of the price 10</Text>
                <View style={styles.discountRow}>
                    <View style={[styles.inputContainer, { flex: 1 }]}>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter here..."
                            placeholderTextColor="#666666"
                        />
                    </View>
                    <TouchableOpacity style={styles.plusButton}>
                        <Ionicons name="add" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                </View>
                <Text style={styles.description}>
                    can offer a discount based on a customer's total purchases in your store here, or directly on each product for the quantities ordered. Set a dynamic and realistic price
                </Text>
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
        width: 329,
        height: 24,
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '500',
        fontSize: 20,
        lineHeight: 24,
        color: '#000000',
    },
    fieldContainer: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        padding: 0,
        gap: 8,
        width: 329,
    },
    label: {
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '500',
        fontSize: 16,
        lineHeight: 19,
        color: '#000000',
        alignSelf: 'stretch',
    },
    description: {
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '400',
        fontSize: 14,
        lineHeight: 20,
        color: '#666666',
        alignSelf: 'stretch',
    },
    inputContainer: {
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
    input: {
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
    specialSalesContainer: {
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        padding: 8,
        gap: 16,
        width: 329,
        borderWidth: 1,
        borderColor: '#EEEEEF',
        borderRadius: 8,
    },
    checkboxRow: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        width: 313,
    },
    checkbox: {
        width: 16,
        height: 16,
        backgroundColor: '#EEEEEF',
        borderWidth: 1,
        borderColor: '#666666',
        borderRadius: 4,
        marginTop: 2,
    },
    multiplierContainer: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 8,
        width: 313,
    },
    rowSpaceBetween: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
    },
    discountRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        width: 329,
    },
    plusButton: {
        width: 40,
        height: 40,
        backgroundColor: '#00615E',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    flex1: {
        flex: 1,
    }
});
