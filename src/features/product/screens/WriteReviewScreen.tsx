import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    Image,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
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
    const [attachments, setAttachments] = useState<string[]>([]); // Image/video URIs

    const handlePickAttachments = async () => {
        try {
            // Request permissions
            const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (!permissionResult.granted) {
                showToast({
                    message: 'Permission to access media library is required',
                    type: 'error',
                });
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.All,
                allowsMultipleSelection: true,
                quality: 0.8,
                exif: false,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB in bytes
                const validAttachments: string[] = [];
                const invalidFiles: string[] = [];

                for (const asset of result.assets) {
                    // Check file size (fileSize is in bytes)
                    if (asset.fileSize && asset.fileSize > MAX_FILE_SIZE) {
                        const fileName = asset.fileName || 'file';
                        const fileSizeMB = (asset.fileSize / (1024 * 1024)).toFixed(2);
                        invalidFiles.push(`${fileName} (${fileSizeMB}MB)`);
                    } else {
                        validAttachments.push(asset.uri);
                    }
                }

                // Show error for files that are too large
                if (invalidFiles.length > 0) {
                    showToast({
                        message: `The following files exceed the 2MB limit: ${invalidFiles.join(', ')}. Please compress or resize them.`,
                        type: 'error',
                    });
                }

                // Add only valid attachments
                if (validAttachments.length > 0) {
                    setAttachments([...attachments, ...validAttachments]);
                    if (invalidFiles.length === 0) {
                        showToast({
                            message: `${validAttachments.length} file(s) added successfully`,
                            type: 'success',
                        });
                    }
                }
            }
        } catch (error: any) {
            showToast({
                message: error.message || 'Failed to pick files',
                type: 'error',
            });
        }
    };

    const handleRemoveAttachment = (index: number) => {
        setAttachments(attachments.filter((_, i) => i !== index));
    };

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

        // Validate file sizes before submitting
        const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB in bytes
        
        try {
            // Check attachment file sizes
            for (let i = 0; i < attachments.length; i++) {
                const attachmentUri = attachments[i];
                const fileInfo = await FileSystem.getInfoAsync(attachmentUri);
                if (fileInfo.exists && fileInfo.size && fileInfo.size > MAX_FILE_SIZE) {
                    const fileSizeMB = (fileInfo.size / (1024 * 1024)).toFixed(2);
                    showToast({
                        message: `Attachment ${i + 1} (${fileSizeMB}MB) exceeds the 2MB limit. Please remove or compress it before submitting.`,
                        type: 'error',
                    });
                    return;
                }
            }
        } catch (error: any) {
            // If file size check fails, continue (server will validate anyway)
        }

        setIsSubmitting(true);
        
        try {
            // Convert attachment URIs to file objects for FormData
            const attachmentFiles = attachments.map((uri, index) => {
                // Detect file extension and mime type
                const extension = uri.split('.').pop()?.toLowerCase() || 'jpg';
                const mimeType = extension === 'png' ? 'image/png' 
                    : extension === 'gif' ? 'image/gif'
                    : extension === 'webp' ? 'image/webp'
                    : extension === 'mp4' ? 'video/mp4'
                    : extension === 'mov' ? 'video/quicktime'
                    : extension === 'avi' ? 'video/x-msvideo'
                    : 'image/jpeg';
                
                return {
                    uri,
                    type: mimeType,
                    name: `attachment_${index}.${extension}`,
                } as any;
            });

            await reviewsApi.submitReview(Number(id), {
                title: title.trim(),
                comment: comment.trim(),
                rating,
                attachments: attachmentFiles.length > 0 ? attachmentFiles : undefined,
            });
            
            showToast({ 
                message: 'Review submitted successfully! It will be visible after approval.', 
                type: 'success' 
            });
            
            // Reset form
            setRating(5);
            setTitle('');
            setComment('');
            setAttachments([]);
            
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

                    {/* Image/Video Upload Section */}
                    <View style={styles.section}>
                        <Text style={styles.label}>
                            Images / Videos (Optional)
                        </Text>
                        <TouchableOpacity
                            style={styles.uploadButton}
                            onPress={handlePickAttachments}
                            disabled={isSubmitting}
                        >
                            <Ionicons name="image-outline" size={20} color={theme.colors.primary[500]} />
                            <Text style={styles.uploadButtonText}>
                                Select Images or Videos
                            </Text>
                        </TouchableOpacity>

                        {attachments.length > 0 && (
                            <View style={styles.attachmentsGrid}>
                                {attachments.map((uri, index) => (
                                    <View key={index} style={styles.attachmentItem}>
                                        <Image source={{ uri }} style={styles.attachmentPreview} />
                                        <TouchableOpacity
                                            style={styles.removeAttachmentButton}
                                            onPress={() => handleRemoveAttachment(index)}
                                            disabled={isSubmitting}
                                        >
                                            <Ionicons name="close-circle" size={20} color={theme.colors.error.main} />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </View>
                        )}
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
    uploadButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.lg,
        borderWidth: 1,
        borderColor: theme.colors.primary[500],
        borderStyle: 'dashed',
        borderRadius: theme.borderRadius.md,
        backgroundColor: theme.colors.white,
        marginTop: theme.spacing.xs,
    },
    uploadButtonText: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.primary[500],
        fontWeight: theme.typography.fontWeight.medium,
        marginLeft: theme.spacing.xs,
    },
    attachmentsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: theme.spacing.md,
        gap: theme.spacing.sm,
    },
    attachmentItem: {
        width: 80,
        height: 80,
        borderRadius: theme.borderRadius.md,
        overflow: 'hidden',
        position: 'relative',
        borderWidth: 1,
        borderColor: theme.colors.gray[200],
    },
    attachmentPreview: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    removeAttachmentButton: {
        position: 'absolute',
        top: -5,
        right: -5,
        backgroundColor: theme.colors.white,
        borderRadius: 10,
    },
});

export default WriteReviewScreen;

