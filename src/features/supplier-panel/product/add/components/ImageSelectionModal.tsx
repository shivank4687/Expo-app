import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    Image,
    ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/features/supplier-panel/styles';

interface MediaFile {
    uri: string;
    type: 'image' | 'video';
    fileName: string;
    fileSize: number;
    duration?: number;
}

interface ImageSelectionModalProps {
    visible: boolean;
    images: MediaFile[];
    editedImageIndices: number[];
    maxEdits: number;
    onClose: () => void;
    onSelectImage: (index: number) => void;
}

const ImageSelectionModal: React.FC<ImageSelectionModalProps> = ({
    visible,
    images,
    editedImageIndices,
    maxEdits,
    onClose,
    onSelectImage,
}) => {
    const canEditMore = editedImageIndices.length < maxEdits;

    // Debug logging
    React.useEffect(() => {
        if (visible) {
            console.log('ImageSelectionModal opened');
            console.log('Images count:', images.length);
            console.log('Images:', images);
        }
    }, [visible, images]);

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>Select Image to Edit</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Ionicons name="close" size={24} color="#000000" />
                        </TouchableOpacity>
                    </View>

                    {/* Images Grid */}
                    <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                        {images.length === 0 ? (
                            <View style={styles.emptyState}>
                                <Ionicons name="images-outline" size={48} color="#CCCCCC" />
                                <Text style={styles.emptyStateText}>No images uploaded yet</Text>
                                <Text style={styles.emptyStateSubtext}>Upload images first to edit them</Text>
                            </View>
                        ) : (
                            <>
                                <View style={styles.imageGrid}>
                                    {images.map((image, index) => {
                                        const isEdited = editedImageIndices.includes(index);
                                        const isDisabled = isEdited || (!canEditMore && !isEdited);

                                        return (
                                            <TouchableOpacity
                                                key={index}
                                                style={[
                                                    styles.imageBox,
                                                    isEdited && styles.imageBoxEdited,
                                                    isDisabled && styles.imageBoxDisabled,
                                                ]}
                                                onPress={() => !isDisabled && onSelectImage(index)}
                                                disabled={isDisabled}
                                            >
                                                <Image source={{ uri: image.uri }} style={styles.imagePreview} />

                                                {isEdited && (
                                                    <View style={styles.editedBadge}>
                                                        <Text style={styles.editedBadgeText}>EDITED</Text>
                                                    </View>
                                                )}

                                                {isDisabled && <View style={styles.disabledOverlay} />}
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>

                                {/* Edit Counter */}
                                <Text style={styles.editCounter}>
                                    Edited: {editedImageIndices.length}/{maxEdits}
                                </Text>

                                {!canEditMore && (
                                    <Text style={styles.warningText}>
                                        Maximum number of edits reached
                                    </Text>
                                )}
                            </>
                        )}
                    </ScrollView>

                    {/* Cancel Button */}
                    <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

export default ImageSelectionModal;

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '90%',
        maxHeight: '80%',
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
        marginBottom: 20,
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
        maxHeight: 400,
    },
    scrollContent: {
        paddingBottom: 16,
    },
    imageGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'flex-start',
        marginBottom: 16,
    },
    imageBox: {
        width: 100,
        height: 100,
        borderRadius: 8,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: '#E5E5E5',
        marginRight: 8,
        marginBottom: 8,
    },
    imageBoxEdited: {
        borderColor: '#10B981',
    },
    imageBoxDisabled: {
        opacity: 0.5,
    },
    imagePreview: {
        width: '100%',
        height: '100%',
    },
    editedBadge: {
        position: 'absolute',
        top: 0,
        right: 0,
        backgroundColor: '#10B981',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderTopRightRadius: 6,
        borderBottomLeftRadius: 8,
    },
    editedBadgeText: {
        fontFamily: 'Inter',
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: '700',
    },
    disabledOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
    },
    editCounter: {
        fontFamily: 'Inter',
        fontSize: 14,
        fontWeight: '500',
        color: '#666666',
        textAlign: 'center',
        marginBottom: 8,
    },
    warningText: {
        fontFamily: 'Inter',
        fontSize: 12,
        color: '#DC2626',
        textAlign: 'center',
        marginBottom: 16,
    },
    cancelButton: {
        width: '100%',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.primary,
        alignItems: 'center',
        marginTop: 12,
    },
    cancelButtonText: {
        fontFamily: 'Inter',
        fontSize: 16,
        fontWeight: '500',
        color: '#000000',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
    },
    emptyStateText: {
        fontFamily: 'Inter',
        fontSize: 16,
        fontWeight: '500',
        color: '#666666',
        marginTop: 12,
    },
    emptyStateSubtext: {
        fontFamily: 'Inter',
        fontSize: 14,
        color: '#999999',
        marginTop: 4,
    },
});
