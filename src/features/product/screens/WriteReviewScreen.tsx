import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/theme';
import { reviewsApi } from '@/services/api/reviews.api';
import { Button } from '@/shared/components/Button';
import { useToast } from '@/shared/components/Toast';

export const WriteReviewScreen: React.FC = () => {
    const router = useRouter();
    const { showToast } = useToast();
    const { id } = useLocalSearchParams<{ id: string }>();
    
    const [rating, setRating] = useState(5);
    const [title, setTitle] = useState('');
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        // Validation
        if (!title.trim()) {
            showToast({ message: 'Please enter a review title', type: 'warning' });
            return;
        }
        
        if (!comment.trim()) {
            showToast({ message: 'Please enter your review', type: 'warning' });
            return;
        }

        setIsSubmitting(true);
        
        try {
            await reviewsApi.submitReview(Number(id), {
                title: title.trim(),
                comment: comment.trim(),
                rating,
            });
            
            showToast({ 
                message: 'Review submitted successfully! It will be visible after approval.', 
                type: 'success' 
            });
            
            // Navigate back to product detail
            router.back();
        } catch (error: any) {
            showToast({ 
                message: error.message || 'Failed to submit review', 
                type: 'error' 
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <View style={styles.container}>
            <Stack.Screen 
                options={{ 
                    title: 'Write a Review',
                    headerBackTitle: 'Back',
                }} 
            />
            
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                <View style={styles.content}>
                    {/* Rating Section */}
                    <View style={styles.section}>
                        <Text style={styles.label}>
                            Rating <Text style={styles.required}>*</Text>
                        </Text>
                        <View style={styles.ratingContainer}>
                            {[1, 2, 3, 4, 5].map((star) => (
                                <TouchableOpacity
                                    key={star}
                                    onPress={() => setRating(star)}
                                    activeOpacity={0.7}
                                    style={styles.starButton}
                                >
                                    <Ionicons
                                        name={star <= rating ? 'star' : 'star-outline'}
                                        size={40}
                                        color={star <= rating ? theme.colors.warning.main : theme.colors.gray[400]}
                                    />
                                </TouchableOpacity>
                            ))}
                        </View>
                        <Text style={styles.ratingText}>{rating} out of 5 stars</Text>
                    </View>

                    {/* Title Section */}
                    <View style={styles.section}>
                        <Text style={styles.label}>
                            Review Title <Text style={styles.required}>*</Text>
                        </Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Summarize your review"
                            value={title}
                            onChangeText={setTitle}
                            maxLength={100}
                        />
                    </View>

                    {/* Comment Section */}
                    <View style={styles.section}>
                        <Text style={styles.label}>
                            Your Review <Text style={styles.required}>*</Text>
                        </Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="Share your experience with this product"
                            value={comment}
                            onChangeText={setComment}
                            multiline
                            numberOfLines={8}
                            textAlignVertical="top"
                        />
                        <Text style={styles.charCount}>{comment.length} characters</Text>
                    </View>

                    {/* Submit Button */}
                    <Button
                        title={isSubmitting ? 'Submitting...' : 'Submit Review'}
                        onPress={handleSubmit}
                        disabled={isSubmitting}
                        style={styles.submitButton}
                    />

                    {/* Cancel Button */}
                    <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={() => router.back()}
                        disabled={isSubmitting}
                    >
                        <Text style={styles.cancelText}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background.default,
    },
    scrollView: {
        flex: 1,
    },
    content: {
        padding: theme.spacing.lg,
    },
    section: {
        marginBottom: theme.spacing.xl,
    },
    label: {
        fontSize: theme.typography.fontSize.base,
        fontWeight: theme.typography.fontWeight.semiBold,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.sm,
    },
    required: {
        color: theme.colors.error.main,
    },
    ratingContainer: {
        flexDirection: 'row',
        gap: theme.spacing.sm,
        marginBottom: theme.spacing.xs,
    },
    starButton: {
        padding: theme.spacing.xs,
    },
    ratingText: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.text.secondary,
        marginTop: theme.spacing.xs,
    },
    input: {
        borderWidth: 1,
        borderColor: theme.colors.border.main,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.md,
        fontSize: theme.typography.fontSize.base,
        color: theme.colors.text.primary,
        backgroundColor: theme.colors.white,
    },
    textArea: {
        height: 150,
        paddingTop: theme.spacing.md,
    },
    charCount: {
        fontSize: theme.typography.fontSize.xs,
        color: theme.colors.text.secondary,
        marginTop: theme.spacing.xs,
        textAlign: 'right',
    },
    submitButton: {
        marginBottom: theme.spacing.md,
    },
    cancelButton: {
        paddingVertical: theme.spacing.md,
        alignItems: 'center',
    },
    cancelText: {
        fontSize: theme.typography.fontSize.base,
        fontWeight: theme.typography.fontWeight.medium,
        color: theme.colors.text.secondary,
    },
});

export default WriteReviewScreen;

