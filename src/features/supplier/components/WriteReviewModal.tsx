import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    TextInput,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { theme } from '@/theme';
import { suppliersApi } from '@/services/api/suppliers.api';
import { useToast } from '@/shared/components/Toast';

interface WriteReviewModalProps {
    visible: boolean;
    supplierUrl: string;
    supplierCompanyName: string;
    onClose: () => void;
    onSuccess?: () => void;
}

export const WriteReviewModal: React.FC<WriteReviewModalProps> = ({
    visible,
    supplierUrl,
    supplierCompanyName,
    onClose,
    onSuccess,
}) => {
    const { t } = useTranslation();
    const { showToast } = useToast();
    
    const [rating, setRating] = useState(5);
    const [title, setTitle] = useState('');
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleClose = () => {
        if (!isSubmitting) {
            setRating(5);
            setTitle('');
            setComment('');
            onClose();
        }
    };

    const handleSubmit = async () => {
        // Validation
        if (!title.trim()) {
            showToast({
                message: t('supplier.review.titleRequired', 'Please enter a review title'),
                type: 'warning',
            });
            return;
        }

        if (title.trim().length < 10) {
            showToast({
                message: t('supplier.review.titleMinLength', 'Title must be at least 10 characters'),
                type: 'warning',
            });
            return;
        }

        if (title.trim().length > 100) {
            showToast({
                message: t('supplier.review.titleMaxLength', 'Title must not exceed 100 characters'),
                type: 'warning',
            });
            return;
        }

        if (!comment.trim()) {
            showToast({
                message: t('supplier.review.commentRequired', 'Please enter your review comment'),
                type: 'warning',
            });
            return;
        }

        if (comment.trim().length < 20) {
            showToast({
                message: t('supplier.review.commentMinLength', 'Comment must be at least 20 characters'),
                type: 'warning',
            });
            return;
        }

        if (comment.trim().length > 250) {
            showToast({
                message: t('supplier.review.commentMaxLength', 'Comment must not exceed 250 characters'),
                type: 'warning',
            });
            return;
        }

        setIsSubmitting(true);

        try {
            await suppliersApi.submitSupplierReview(supplierUrl, {
                rating,
                title: title.trim(),
                comment: comment.trim(),
            });

            showToast({
                message: t(
                    'supplier.review.submitSuccess',
                    'Review submitted successfully! It will be visible after approval.'
                ),
                type: 'success',
            });

            // Reset form
            setRating(5);
            setTitle('');
            setComment('');

            // Close modal
            handleClose();

            // Call success callback to refresh reviews
            if (onSuccess) {
                onSuccess();
            }
        } catch (error: any) {
            showToast({
                message: error.message || t('supplier.review.submitError', 'Failed to submit review'),
                type: 'error',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={handleClose}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.container}
            >
                <TouchableOpacity
                    style={styles.overlay}
                    activeOpacity={1}
                    onPress={handleClose}
                >
                    <TouchableOpacity
                        activeOpacity={1}
                        onPress={(e) => e.stopPropagation()}
                    >
                        <View style={styles.modalContent}>
                            {/* Header */}
                            <View style={styles.header}>
                                <View style={styles.headerTitleContainer}>
                                    <Text style={styles.headerTitle}>
                                        {t('supplier.review.writeReview', 'Write a Review')}
                                    </Text>
                                    <Text style={styles.headerSubtitle} numberOfLines={1}>
                                        {supplierCompanyName}
                                    </Text>
                                </View>
                                <TouchableOpacity
                                    onPress={handleClose}
                                    disabled={isSubmitting}
                                    style={styles.closeButton}
                                >
                                    <Ionicons
                                        name="close"
                                        size={24}
                                        color={theme.colors.text.primary}
                                    />
                                </TouchableOpacity>
                            </View>

                            {/* Content */}
                            <ScrollView
                                style={styles.content}
                                showsVerticalScrollIndicator={false}
                                keyboardShouldPersistTaps="handled"
                            >
                                {/* Rating Section */}
                                <View style={styles.section}>
                                    <Text style={styles.label}>
                                        {t('supplier.review.rating', 'Rating')} <Text style={styles.required}>*</Text>
                                    </Text>
                                    <View style={styles.ratingContainer}>
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <TouchableOpacity
                                                key={star}
                                                onPress={() => setRating(star)}
                                                disabled={isSubmitting}
                                                style={styles.starButton}
                                            >
                                                <Ionicons
                                                    name={star <= rating ? 'star' : 'star-outline'}
                                                    size={32}
                                                    color={star <= rating ? theme.colors.warning.main : theme.colors.gray[400]}
                                                />
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>

                                {/* Title Section */}
                                <View style={styles.section}>
                                    <Text style={styles.label}>
                                        {t('supplier.review.title', 'Title')} <Text style={styles.required}>*</Text>
                                    </Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder={t('supplier.review.titlePlaceholder', 'Enter review title (10-100 characters)')}
                                        placeholderTextColor={theme.colors.text.secondary}
                                        value={title}
                                        onChangeText={setTitle}
                                        maxLength={100}
                                        editable={!isSubmitting}
                                        multiline={false}
                                    />
                                    <Text style={styles.characterCount}>
                                        {title.length}/100
                                    </Text>
                                </View>

                                {/* Comment Section */}
                                <View style={styles.section}>
                                    <Text style={styles.label}>
                                        {t('supplier.review.comment', 'Comment')} <Text style={styles.required}>*</Text>
                                    </Text>
                                    <TextInput
                                        style={[styles.input, styles.textArea]}
                                        placeholder={t('supplier.review.commentPlaceholder', 'Write your review (20-250 characters)')}
                                        placeholderTextColor={theme.colors.text.secondary}
                                        value={comment}
                                        onChangeText={setComment}
                                        maxLength={250}
                                        editable={!isSubmitting}
                                        multiline
                                        numberOfLines={6}
                                        textAlignVertical="top"
                                    />
                                    <Text style={styles.characterCount}>
                                        {comment.length}/250
                                    </Text>
                                </View>
                            </ScrollView>

                            {/* Footer */}
                            <View style={styles.footer}>
                                <TouchableOpacity
                                    style={[styles.cancelButton, isSubmitting && styles.buttonDisabled]}
                                    onPress={handleClose}
                                    disabled={isSubmitting}
                                >
                                    <Text style={styles.cancelButtonText}>
                                        {t('common.cancel', 'Cancel')}
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.submitButton, isSubmitting && styles.buttonDisabled]}
                                    onPress={handleSubmit}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <ActivityIndicator size="small" color={theme.colors.white} />
                                    ) : (
                                        <Text style={styles.submitButtonText}>
                                            {t('supplier.review.submit', 'Submit')}
                                        </Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </TouchableOpacity>
                </TouchableOpacity>
            </KeyboardAvoidingView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: theme.colors.white,
        borderTopLeftRadius: theme.borderRadius.xl,
        borderTopRightRadius: theme.borderRadius.xl,
        maxHeight: '90%',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: theme.spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.gray[200],
    },
    headerTitleContainer: {
        flex: 1,
        marginRight: theme.spacing.md,
    },
    headerTitle: {
        fontSize: theme.typography.fontSize.xl,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.xs,
    },
    headerSubtitle: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.text.secondary,
    },
    closeButton: {
        padding: theme.spacing.xs,
    },
    content: {
        maxHeight: 500,
        padding: theme.spacing.lg,
    },
    section: {
        marginBottom: theme.spacing.lg,
    },
    label: {
        fontSize: theme.typography.fontSize.base,
        fontWeight: theme.typography.fontWeight.medium,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.sm,
    },
    required: {
        color: theme.colors.error.main,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
    },
    starButton: {
        padding: theme.spacing.xs,
    },
    input: {
        borderWidth: 1,
        borderColor: theme.colors.gray[300],
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.md,
        fontSize: theme.typography.fontSize.base,
        color: theme.colors.text.primary,
        backgroundColor: theme.colors.white,
    },
    textArea: {
        minHeight: 120,
        paddingTop: theme.spacing.md,
    },
    characterCount: {
        fontSize: theme.typography.fontSize.xs,
        color: theme.colors.text.secondary,
        textAlign: 'right',
        marginTop: theme.spacing.xs,
    },
    footer: {
        flexDirection: 'row',
        padding: theme.spacing.lg,
        borderTopWidth: 1,
        borderTopColor: theme.colors.gray[200],
        gap: theme.spacing.md,
    },
    cancelButton: {
        flex: 1,
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.lg,
        borderRadius: theme.borderRadius.md,
        borderWidth: 1,
        borderColor: theme.colors.gray[300],
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelButtonText: {
        fontSize: theme.typography.fontSize.base,
        fontWeight: theme.typography.fontWeight.medium,
        color: theme.colors.text.primary,
    },
    submitButton: {
        flex: 1,
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.lg,
        borderRadius: theme.borderRadius.md,
        backgroundColor: theme.colors.primary[500],
        alignItems: 'center',
        justifyContent: 'center',
    },
    submitButtonText: {
        fontSize: theme.typography.fontSize.base,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.white,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
});

