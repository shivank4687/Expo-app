import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    Image,
    ScrollView,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/features/supplier-panel/styles';
import { photoRoomApi, PhotoRoomOptions, base64ToFileUri } from '@/services/api/photoroom.api';

interface MediaFile {
    uri: string;
    type: 'image' | 'video';
    fileName: string;
    fileSize: number;
    duration?: number;
}

interface PhotoRoomEditModalProps {
    visible: boolean;
    image: MediaFile | null;
    onClose: () => void;
    onSave: (editedImageUri: string) => void;
}

interface EditOption {
    id: string;
    label: string;
    category: 'background' | 'adjustment' | 'format';
    options: PhotoRoomOptions;
}

const EDIT_OPTIONS: EditOption[] = [
    // Background options
    { id: 'remove-bg', label: 'Remove BG', category: 'background', options: { background: 'transparent', channels: 'rgba' } },
    { id: 'white-bg', label: 'White BG', category: 'background', options: { background: 'ffffff' } },
    { id: 'black-bg', label: 'Black BG', category: 'background', options: { background: '000000' } },

    // Adjustment options
    { id: 'padding-10', label: 'Padding 10%', category: 'adjustment', options: { padding: 0.1 } },
    { id: 'padding-20', label: 'Padding 20%', category: 'adjustment', options: { padding: 0.2 } },
    { id: 'center', label: 'Center', category: 'adjustment', options: { align: 'center' } },
    { id: 'soft-shadow', label: 'Soft Shadow', category: 'adjustment', options: { shadow: 'soft' } },
    { id: 'hard-shadow', label: 'Hard Shadow', category: 'adjustment', options: { shadow: 'hard' } },

    // Format options
    { id: 'to-png', label: 'To PNG', category: 'format', options: { format: 'png' } },
    { id: 'to-jpg', label: 'To JPG', category: 'format', options: { format: 'jpg' } },
    { id: 'to-webp', label: 'To WebP', category: 'format', options: { format: 'webp' } },
];

const PhotoRoomEditModal: React.FC<PhotoRoomEditModalProps> = ({
    visible,
    image,
    onClose,
    onSave,
}) => {
    const [previewUri, setPreviewUri] = useState<string>('');
    const [appliedOptions, setAppliedOptions] = useState<string[]>([]);
    const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [currentEditedUri, setCurrentEditedUri] = useState<string>('');

    // Reset state when modal opens
    useEffect(() => {
        if (visible && image) {
            console.log('PhotoRoomEditModal opened');
            console.log('Image URI:', image.uri);
            setPreviewUri(image.uri);
            setCurrentEditedUri(image.uri);
            setAppliedOptions([]);
            setSelectedOptions([]);
        }
    }, [visible, image]);

    const handleToggleOption = (optionId: string) => {
        if (selectedOptions.includes(optionId)) {
            // Deselect
            setSelectedOptions(selectedOptions.filter(id => id !== optionId));
        } else {
            // Select
            setSelectedOptions([...selectedOptions, optionId]);
        }
    };

    const handleApplyOptions = async () => {
        if (selectedOptions.length === 0 || !currentEditedUri || isProcessing) return;

        setIsProcessing(true);

        try {
            let workingUri = currentEditedUri;

            // Apply each selected option sequentially
            for (const optionId of selectedOptions) {
                const option = EDIT_OPTIONS.find(opt => opt.id === optionId);
                if (!option) continue;

                // Process image with PhotoRoom API
                const result = await photoRoomApi.processImage(workingUri, option.options);

                if (!result.success || !result.processed_image) {
                    Alert.alert('Error', result.error || `Failed to apply ${option.label}`);
                    setIsProcessing(false);
                    return;
                }

                // Convert base64 to file URI
                const timestamp = Date.now();
                const filename = `edited_${timestamp}.png`;
                const newUri = await base64ToFileUri(result.processed_image, filename);

                // Update working URI for next iteration
                workingUri = newUri;
            }

            // Update preview and current edited URI with final result
            setPreviewUri(workingUri);
            setCurrentEditedUri(workingUri);

            // Mark options as applied
            setAppliedOptions([...appliedOptions, ...selectedOptions]);
            setSelectedOptions([]);
        } catch (error: any) {
            console.error('Error applying edits:', error);
            Alert.alert('Error', 'Failed to apply edits. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleSave = () => {
        if (currentEditedUri) {
            onSave(currentEditedUri);
        }
    };

    const handleCancel = () => {
        // Reset to original
        if (image) {
            setPreviewUri(image.uri);
            setCurrentEditedUri(image.uri);
            setAppliedOptions([]);
            setSelectedOptions([]);
        }
        onClose();
    };

    const renderChip = (option: EditOption) => {
        const isApplied = appliedOptions.includes(option.id);
        const isSelected = selectedOptions.includes(option.id);
        const isDisabled = isApplied || isProcessing;

        return (
            <TouchableOpacity
                key={option.id}
                style={[
                    styles.chip,
                    isSelected && styles.chipSelected,
                    isApplied && styles.chipApplied,
                    isDisabled && styles.chipDisabled,
                ]}
                onPress={() => !isDisabled && handleToggleOption(option.id)}
                disabled={isDisabled}
            >
                <Text style={[
                    styles.chipText,
                    isSelected && styles.chipTextSelected,
                    isApplied && styles.chipTextApplied
                ]}>
                    {option.label}
                </Text>
                {isApplied && (
                    <Ionicons name="checkmark-circle" size={16} color="#10B981" style={{ marginLeft: 4 }} />
                )}
                {isSelected && !isApplied && (
                    <Ionicons name="checkmark" size={16} color={COLORS.primary} style={{ marginLeft: 4 }} />
                )}
            </TouchableOpacity>
        );
    };

    if (!image) return null;

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={handleCancel}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>Edit Image</Text>
                        <TouchableOpacity onPress={handleCancel} style={styles.closeButton}>
                            <Ionicons name="close" size={24} color="#000000" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                        {/* Preview */}
                        <View style={styles.previewContainer}>
                            <Image source={{ uri: previewUri }} style={styles.previewImage} resizeMode="contain" />
                            {isProcessing && (
                                <View style={styles.loadingOverlay}>
                                    <ActivityIndicator size="large" color={COLORS.primary} />
                                    <Text style={styles.loadingText}>Processing...</Text>
                                </View>
                            )}
                        </View>

                        {/* Background Options */}
                        <View style={styles.optionSection}>
                            <Text style={styles.sectionTitle}>Background:</Text>
                            <View style={styles.chipRow}>
                                {EDIT_OPTIONS.filter(opt => opt.category === 'background').map(renderChip)}
                            </View>
                        </View>

                        {/* Adjustment Options */}
                        <View style={styles.optionSection}>
                            <Text style={styles.sectionTitle}>Adjustments:</Text>
                            <View style={styles.chipRow}>
                                {EDIT_OPTIONS.filter(opt => opt.category === 'adjustment').map(renderChip)}
                            </View>
                        </View>

                        {/* Format Options */}
                        {/* <View style={styles.optionSection}>
                            <Text style={styles.sectionTitle}>Format:</Text>
                            <View style={styles.chipRow}>
                                {EDIT_OPTIONS.filter(opt => opt.category === 'format').map(renderChip)}
                            </View>
                        </View> */}

                        {/* Applied Options Summary */}
                        {appliedOptions.length > 0 && (
                            <Text style={styles.appliedText}>
                                Applied: {appliedOptions.map(id => EDIT_OPTIONS.find(opt => opt.id === id)?.label).join(', ')}
                            </Text>
                        )}

                        {/* Apply Button */}
                        <TouchableOpacity
                            style={[
                                styles.applyButton,
                                (selectedOptions.length === 0 || isProcessing) && styles.applyButtonDisabled
                            ]}
                            onPress={handleApplyOptions}
                            disabled={selectedOptions.length === 0 || isProcessing}
                        >
                            {isProcessing ? (
                                <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                                <Text style={styles.applyButtonText}>
                                    Apply {selectedOptions.length > 0 ? `(${selectedOptions.length})` : ''}
                                </Text>
                            )}
                        </TouchableOpacity>
                    </ScrollView>

                    {/* Action Buttons */}
                    <View style={styles.buttonRow}>
                        <TouchableOpacity
                            style={[styles.button, styles.cancelButton]}
                            onPress={handleCancel}
                            disabled={isProcessing}
                        >
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.button,
                                styles.saveButton,
                                (isProcessing || appliedOptions.length === 0) && styles.buttonDisabled
                            ]}
                            onPress={handleSave}
                            disabled={isProcessing || appliedOptions.length === 0}
                        >
                            <Text style={styles.saveButtonText}>Save</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

export default PhotoRoomEditModal;

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '95%',
        maxHeight: '95%',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    headerTitle: {
        fontFamily: 'Inter',
        fontSize: 18,
        fontWeight: '600',
        color: '#000000',
    },
    closeButton: {
        padding: 4,
    },
    scrollView: {
        maxHeight: 600,
    },
    scrollContent: {
        paddingBottom: 16,
    },
    previewContainer: {
        width: '100%',
        height: 300,
        backgroundColor: '#F5F5F5',
        borderRadius: 8,
        marginBottom: 20,
        overflow: 'hidden',
        position: 'relative',
    },
    previewImage: {
        width: '100%',
        height: '100%',
    },
    loadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        fontFamily: 'Inter',
        fontSize: 14,
        color: '#666666',
        marginTop: 8,
    },
    optionSection: {
        marginBottom: 16,
    },
    sectionTitle: {
        fontFamily: 'Inter',
        fontSize: 14,
        fontWeight: '500',
        color: '#000000',
        marginBottom: 8,
    },
    chipRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginRight: -8,
        marginBottom: -8,
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        backgroundColor: '#EEEEEF',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'transparent',
        marginRight: 8,
        marginBottom: 8,
    },
    chipSelected: {
        backgroundColor: '#E3F2FD',
        borderColor: COLORS.primary,
    },
    chipApplied: {
        backgroundColor: '#E8F5E9',
        borderColor: '#10B981',
    },
    chipDisabled: {
        opacity: 0.5,
    },
    chipText: {
        fontFamily: 'Inter',
        fontSize: 14,
        color: '#666666',
    },
    chipTextSelected: {
        color: COLORS.primary,
        fontWeight: '500',
    },
    chipTextApplied: {
        color: '#10B981',
        fontWeight: '500',
    },
    appliedText: {
        fontFamily: 'Inter',
        fontSize: 12,
        color: '#666666',
        marginTop: 8,
        fontStyle: 'italic',
    },
    applyButton: {
        width: '100%',
        padding: 14,
        backgroundColor: COLORS.primary,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 16,
    },
    applyButtonDisabled: {
        backgroundColor: '#CCCCCC',
        opacity: 0.6,
    },
    applyButtonText: {
        fontFamily: 'Inter',
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    buttonRow: {
        flexDirection: 'row',
        marginTop: 16,
    },
    button: {
        flex: 1,
        padding: 14,
        borderRadius: 8,
        alignItems: 'center',
        marginHorizontal: 6,
    },
    cancelButton: {
        borderWidth: 1,
        borderColor: COLORS.primary,
        backgroundColor: '#FFFFFF',
    },
    cancelButtonText: {
        fontFamily: 'Inter',
        fontSize: 16,
        fontWeight: '500',
        color: '#000000',
    },
    saveButton: {
        backgroundColor: COLORS.primary,
    },
    saveButtonText: {
        fontFamily: 'Inter',
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    buttonDisabled: {
        opacity: 0.5,
    },
});
