import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView } from 'react-native';
import { Stack } from 'expo-router';
import { Button } from '@/shared/components/Button';
import { theme } from '@/theme';

export const GDPRRequestsScreen: React.FC = () => {
    const [requestType, setRequestType] = useState('');
    const [details, setDetails] = useState('');

    const handleSubmit = () => {
        // TODO: Implement GDPR request submission
        console.log('GDPR Request:', { requestType, details });
    };

    return (
        <>
            <Stack.Screen options={{ title: 'GDPR Requests', headerBackTitle: 'Back' }} />
            <ScrollView style={styles.container}>
                <View style={styles.content}>
                    <Text style={styles.title}>Submit a GDPR Request</Text>
                    <Text style={styles.description}>
                        You have the right to request access to, correction of, or deletion of your personal data.
                    </Text>

                    <Text style={styles.label}>Request Type</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g., Data Access, Data Deletion"
                        value={requestType}
                        onChangeText={setRequestType}
                    />

                    <Text style={styles.label}>Details</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder="Please provide details about your request..."
                        value={details}
                        onChangeText={setDetails}
                        multiline
                        numberOfLines={6}
                        textAlignVertical="top"
                    />

                    <Button title="Submit Request" onPress={handleSubmit} fullWidth />
                </View>
            </ScrollView>
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background.default,
    },
    content: {
        padding: theme.spacing.xl,
    },
    title: {
        fontSize: theme.typography.fontSize.xl,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.sm,
    },
    description: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.text.secondary,
        marginBottom: theme.spacing.xl,
        lineHeight: 20,
    },
    label: {
        fontSize: theme.typography.fontSize.sm,
        fontWeight: theme.typography.fontWeight.medium,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.sm,
        marginTop: theme.spacing.md,
    },
    input: {
        backgroundColor: theme.colors.white,
        borderWidth: 1,
        borderColor: theme.colors.gray[300],
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.md,
        fontSize: theme.typography.fontSize.base,
        color: theme.colors.text.primary,
    },
    textArea: {
        minHeight: 120,
        marginBottom: theme.spacing.xl,
    },
});

export default GDPRRequestsScreen;
