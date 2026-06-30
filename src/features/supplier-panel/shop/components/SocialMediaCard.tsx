import React from 'react';
import { View, Text, StyleSheet, TextInput } from 'react-native';

interface SocialMediaCardProps {
    data: {
        twitter?: string;
        facebook?: string;
        youtube?: string;
        instagram?: string;
        skype?: string;
        linked_in?: string;
        pinterest?: string;
        shareable_link?: string;
    };
    onChange: (field: string, value: string) => void;
}

export const SocialMediaCard: React.FC<SocialMediaCardProps> = ({ data, onChange }) => {
    const fields = [
        { label: 'Twitter Id', key: 'twitter' },
        { label: 'Facebook Id', key: 'facebook' },
        { label: 'Youtube Id', key: 'youtube' },
        { label: 'Instagram Id', key: 'instagram' },
        // { label: 'Skype Id', key: 'skype' },
        { label: 'Linked In', key: 'linked_in' },
        { label: 'Pinterest Id', key: 'pinterest' },
        // { label: 'Shareable Link', key: 'shareable_link' },
    ];

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Social Media</Text>

            {fields.map((field) => (
                <View key={field.key} style={styles.fieldContainer}>
                    <Text style={styles.label}>{field.label}</Text>
                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter here..."
                            placeholderTextColor="#666666"
                            value={data[field.key as keyof typeof data] || ''}
                            onChangeText={(val) => onChange(field.key, val)}
                            textContentType="none"
                            autoComplete="off"
                        />
                    </View>
                </View>
            ))}
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
        marginBottom: 8,
    },
    fieldContainer: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        padding: 0,
        gap: 8,
        width: "100%",
        height: 67,
    },
    label: {
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
        gap: 10,
        width: "100%",
        height: 40,
        backgroundColor: '#EEEEEF',
        borderRadius: 8,
    },
    input: {
        flex: 1,
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '400',
        fontSize: 16,
        color: '#000000',
        padding: 0,
    },
});
