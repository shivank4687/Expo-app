import React from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { Stack } from 'expo-router';
import { theme } from '@/theme';
import { useRequireAuth } from '@/shared/hooks/useRequireAuth';

export const ReviewsScreen: React.FC = () => {
    const { isLoading } = useRequireAuth();
    
    // Placeholder - will be implemented with actual API
    const reviews: any[] = [];

    if (isLoading) {
        return (
            <>
                <Stack.Screen options={{ title: 'My Reviews', headerBackTitle: 'Back' }} />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.colors.primary[500]} />
                </View>
            </>
        );
    }

    return (
        <>
            <Stack.Screen options={{ title: 'My Reviews', headerBackTitle: 'Back' }} />
            <View style={styles.container}>
                {reviews.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>No reviews yet</Text>
                        <Text style={styles.emptySubtext}>Purchase products to leave reviews</Text>
                    </View>
                ) : (
                    <FlatList
                        data={reviews}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={({ item }) => (
                            <View style={styles.reviewCard}>
                                <Text>{item.id}</Text>
                            </View>
                        )}
                    />
                )}
            </View>
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background.default,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.background.default,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: theme.spacing.xl,
    },
    emptyText: {
        fontSize: theme.typography.fontSize.xl,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.sm,
    },
    emptySubtext: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.text.secondary,
    },
    reviewCard: {
        backgroundColor: theme.colors.white,
        padding: theme.spacing.lg,
        marginHorizontal: theme.spacing.md,
        marginVertical: theme.spacing.sm,
        borderRadius: theme.borderRadius.md,
        ...theme.shadows.sm,
    },
});

export default ReviewsScreen;
