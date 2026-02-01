import React from 'react';
import { View, Text, StyleSheet, TextInput } from 'react-native';
import { COLORS } from '@/features/supplier-panel/styles';

interface IdentityCardProps {
    data: {
        company_name?: string;
        company_tag_line?: string;
        registerd_in?: string;
        designation?: string;
        team_size?: string;
        certification?: string;
        response_time?: string;
    };
    onChange: (field: string, value: string) => void;
    errors?: Record<string, string>;
}

export const IdentityCard: React.FC<IdentityCardProps> = ({ data, onChange, errors = {} }) => {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>1) Identity</Text>

            <View style={[styles.fieldContainer, errors.company_name ? styles.fieldContainerWithError : null]}>
                <Text style={styles.label}>Seller/Company Name <Text style={styles.required}>*</Text></Text>
                <View style={[styles.inputContainer, errors.company_name ? styles.inputError : null]}>
                    <TextInput
                        style={styles.input}
                        placeholder="Company Name"
                        placeholderTextColor="#666666"
                        value={data.company_name}
                        onChangeText={(val) => onChange('company_name', val)}
                    />
                </View>
                {errors.company_name && <Text style={styles.errorText}>{errors.company_name}</Text>}
            </View>

            {/* Tagline */}
            <View style={[styles.fieldContainer, errors.company_tag_line ? styles.fieldContainerWithError : null]}>
                <Text style={styles.label}>Tagline <Text style={styles.required}>*</Text></Text>
                <View style={[styles.inputContainer, errors.company_tag_line ? styles.inputError : null]}>
                    <TextInput
                        style={styles.input}
                        placeholder="Company Tagline"
                        placeholderTextColor="#666666"
                        value={data.company_tag_line}
                        onChangeText={(val) => onChange('company_tag_line', val)}
                    />
                </View>
                {errors.company_tag_line && <Text style={styles.errorText}>{errors.company_tag_line}</Text>}
            </View>

            {/* Registered In */}
            <View style={[styles.fieldContainer, errors.registerd_in ? styles.fieldContainerWithError : null]}>
                <Text style={styles.label}>Registered In <Text style={styles.required}>*</Text></Text>
                <View style={[styles.inputContainer, errors.registerd_in ? styles.inputError : null]}>
                    <TextInput
                        style={styles.input}
                        placeholder="Country of Registration"
                        placeholderTextColor="#666666"
                        value={data.registerd_in}
                        onChangeText={(val) => onChange('registerd_in', val)}
                    />
                </View>
                {errors.registerd_in && <Text style={styles.errorText}>{errors.registerd_in}</Text>}
            </View>

            {/* Designation */}
            <View style={[styles.fieldContainer, errors.designation ? styles.fieldContainerWithError : null]}>
                <Text style={styles.label}>Designation <Text style={styles.required}>*</Text></Text>
                <View style={[styles.inputContainer, errors.designation ? styles.inputError : null]}>
                    <TextInput
                        style={styles.input}
                        placeholder="Your Designation"
                        placeholderTextColor="#666666"
                        value={data.designation}
                        onChangeText={(val) => onChange('designation', val)}
                    />
                </View>
                {errors.designation && <Text style={styles.errorText}>{errors.designation}</Text>}
            </View>

            {/* Team Size */}
            <View style={[styles.fieldContainer, errors.team_size ? styles.fieldContainerWithError : null]}>
                <Text style={styles.label}>Team Size <Text style={styles.required}>*</Text></Text>
                <View style={[styles.inputContainer, errors.team_size ? styles.inputError : null]}>
                    <TextInput
                        style={styles.input}
                        placeholder="Number of Team Members"
                        placeholderTextColor="#666666"
                        keyboardType="numeric"
                        value={data.team_size}
                        onChangeText={(val) => onChange('team_size', val)}
                    />
                </View>
                {errors.team_size && <Text style={styles.errorText}>{errors.team_size}</Text>}
            </View>

            {/* Certification */}
            <View style={[styles.fieldContainer, errors.certification ? styles.fieldContainerWithError : null]}>
                <Text style={styles.label}>Certification <Text style={styles.required}>*</Text></Text>
                <View style={[styles.inputContainer, errors.certification ? styles.inputError : null]}>
                    <TextInput
                        style={styles.input}
                        placeholder="Certification Number"
                        placeholderTextColor="#666666"
                        value={data.certification}
                        onChangeText={(val) => onChange('certification', val)}
                    />
                </View>
                {errors.certification && <Text style={styles.errorText}>{errors.certification}</Text>}
            </View>

            {/* Response Time */}
            <View style={[styles.fieldContainer, errors.response_time ? styles.fieldContainerWithError : null]}>
                <Text style={styles.label}>Response Time (hours) <Text style={styles.required}>*</Text></Text>
                <View style={[styles.inputContainer, errors.response_time ? styles.inputError : null]}>
                    <TextInput
                        style={styles.input}
                        placeholder="Average Response Time"
                        placeholderTextColor="#666666"
                        keyboardType="decimal-pad"
                        value={data.response_time}
                        onChangeText={(val) => onChange('response_time', val)}
                    />
                </View>
                {errors.response_time && <Text style={styles.errorText}>{errors.response_time}</Text>}
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
    required: {
        color: '#FF0000',
    },
    fieldContainer: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        padding: 0,
        gap: 8,
        width: 329,
        minHeight: 83,
        marginBottom: 8,
    },
    fieldContainerWithError: {
        minHeight: 105,
    },
    label: {
        width: 329,
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '500',
        fontSize: 16,
        lineHeight: 19,
        color: '#000000',
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
        height: 56,
        backgroundColor: '#EEEEEF',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    inputError: {
        borderColor: '#FF0000',
        backgroundColor: '#FFF5F5',
    },
    errorText: {
        color: '#FF0000',
        fontSize: 12,
        fontFamily: 'Inter',
        marginTop: 4,
    },
    input: {
        width: 297,
        height: 32,
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '400',
        fontSize: 16,
        lineHeight: 16,
        color: '#666666',
        padding: 0,
    }
});
