import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/features/supplier-panel/styles';
import { Dropdown } from '@/features/supplier-panel/components';
import { AttachIcon, AiIcon } from '@/assets/icons';
import { ProductAttribute, productAttributesApi } from '../api/product-attributes.api';
import * as ImagePicker from 'expo-image-picker';
import { categoriesApi, Category } from '@/services/api/categories.api';
import { useEffect, forwardRef, useImperativeHandle } from 'react';
import { useFormValidation } from '@/shared/hooks/useFormValidation';
import { RichTextEditor, InputModal } from '@/shared/components';
import { useToast } from '@/shared/components/Toast';
import { useTranslation } from 'react-i18next';
import ImageSelectionModal from './ImageSelectionModal';
import PhotoRoomEditModal from './PhotoRoomEditModal';
import { useAppSelector } from '@/store/hooks';


// Fallback material types if attributes are not yet loaded
const DEFAULT_MATERIAL_TYPES = [
    'Wood', 'The work', 'Cotton', 'Leather', 'Silver', 'Food',
    'Obsidian', 'Amber', 'Clay', 'Ceramic', 'Glass'
];

// Categories will be loaded from API

interface MediaFile {
    id?: number;
    uri: string;
    type: 'image' | 'video';
    fileName: string;
    fileSize: number;
    duration?: number; // in seconds, for videos
}

const MAX_IMAGES = 5;
const MAX_VIDEOS = 1;
const MAX_IMAGE_SIZE = 20 * 1024 * 1024; // 20MB
const MAX_VIDEO_SIZE = 20 * 1024 * 1024; // 20MB
const MAX_VIDEO_DURATION = 25; // 25 seconds
const REQUIRED_IMAGE_WIDTH = 560;
const REQUIRED_IMAGE_HEIGHT = 609;

interface EssentialCardProps {
    attributes: ProductAttribute[];
    onNameChange?: (name: string) => void;
    onAttributesRefresh?: () => Promise<void>;
    onAIGenerateClick?: () => void;
    activeTab?: 'simple' | 'configurable';
}

export interface EssentialCardRef {
    getData: () => any;
    validate: () => boolean;
    updateFields: (data: {
        name?: string;
        description?: string;
        short_description?: string;
        weight?: string;
        length?: string;
        width?: string;
        height?: string;
        material_type?: any;
        manufacturing_origin?: any;
        images?: any[];
        video?: any | null;
        categories?: number[];
    }) => void;
}

const EssentialCard = forwardRef<EssentialCardRef, EssentialCardProps>(({ attributes, onNameChange, onAttributesRefresh, onAIGenerateClick, activeTab = 'simple' }, ref) => {
    const { t } = useTranslation();
    const isConnected = useAppSelector((state) => state.network.isConnected);
    const [name, setName] = useState('');
    const [images, setImages] = useState<MediaFile[]>([]);
    const [video, setVideo] = useState<MediaFile | null>(null);
    const [coverImageIndex, setCoverImageIndex] = useState(0); // Track which image is the cover
    const [length, setLength] = useState('');
    const [width, setWidth] = useState('');
    const [height, setHeight] = useState('');
    const [weight, setWeight] = useState('');
    const [area, setArea] = useState('');
    const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
    const [shortDescription, setShortDescription] = useState('');
    const [description, setDescription] = useState('');
    const [isAddingMaterial, setIsAddingMaterial] = useState(false);
    const [showMaterialModal, setShowMaterialModal] = useState(false);

    // PhotoRoom editing states
    const [editedImageIndices, setEditedImageIndices] = useState<number[]>([]);
    const [showImageSelectionModal, setShowImageSelectionModal] = useState(false);
    const [showPhotoRoomEditModal, setShowPhotoRoomEditModal] = useState(false);
    const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
    const MAX_EDITS = 2;

    // Toast notifications
    const { showToast } = useToast();

    // Form validation
    const { errors, validate, clearError } = useFormValidation({
        name: [{ type: 'required', message: 'Name is required' }],
        weight: [{ type: 'required', message: 'Weight is required' }],
        short_description: [{ type: 'required', message: 'Short description is required' }],
        description: [{ type: 'required', message: 'Description is required' }],
    });

    const handleNameChange = (text: string) => {
        setName(text);
        if (errors.name) clearError('name');
        if (onNameChange) {
            onNameChange(text);
        }
    };

    const handleWeightChange = (text: string) => {
        setWeight(text);
        if (errors.weight) clearError('weight');
    };

    const handleShortDescriptionChange = (text: string) => {
        setShortDescription(text);
        if (errors.short_description) clearError('short_description');
    };

    const handleDescriptionChange = (text: string) => {
        setDescription(text);
        if (errors.description) clearError('description');
    };

    // Category states
    const [categories, setCategories] = useState<Category[]>([]);
    const [subcategories, setSubcategories] = useState<Category[]>([]);
    const [subSubcategories, setSubSubcategories] = useState<Category[]>([]);

    // Selection states
    const [categoryId, setCategoryId] = useState('');
    const [subcategoryId, setSubcategoryId] = useState('');
    const [subSubcategoryId, setSubSubcategoryId] = useState('');

    // Pending category IDs to apply once categories are loaded
    const [pendingCategoryIds, setPendingCategoryIds] = useState<string[]>([]);

    // Fetch root categories on mount
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await categoriesApi.getSupplierCategories();
                setCategories(response.data);
            } catch (error) {
                console.error('Error fetching categories:', error);
            }
        };
        fetchCategories();
    }, []);

    // Apply pending category selections once categories are loaded
    useEffect(() => {
        if (categories.length > 0 && pendingCategoryIds.length > 0) {
            const [parentId, subId, subSubId] = pendingCategoryIds;

            if (parentId) {
                setCategoryId(parentId);
                const selectedCat = categories.find(c => c.id.toString() === parentId);
                if (selectedCat && selectedCat.children) {
                    setSubcategories(selectedCat.children);

                    if (subId) {
                        setSubcategoryId(subId);
                        const selectedSub = selectedCat.children.find(c => c.id.toString() === subId);
                        if (selectedSub && selectedSub.children) {
                            setSubSubcategories(selectedSub.children);

                            if (subSubId) {
                                setSubSubcategoryId(subSubId);
                            }
                        }
                    }
                }
            }

            // Clear pending IDs after applying
            setPendingCategoryIds([]);
        }
    }, [categories, pendingCategoryIds]);

    const handleCategorySelect = (id: string) => {
        setCategoryId(id);
        setSubcategoryId('');
        setSubSubcategoryId('');
        setSubSubcategories([]);

        const selectedCat = categories.find(c => c.id.toString() === id);
        if (selectedCat && selectedCat.children) {
            setSubcategories(selectedCat.children);
        } else {
            setSubcategories([]);
        }
    };

    const handleSubcategorySelect = (id: string) => {
        setSubcategoryId(id);
        setSubSubcategoryId('');

        const selectedSub = subcategories.find(c => c.id.toString() === id);
        if (selectedSub && selectedSub.children) {
            setSubSubcategories(selectedSub.children);
        } else {
            setSubSubcategories([]);
        }
    };

    useImperativeHandle(ref, () => ({
        getData: () => {
            // Rearrange images so cover image is at index 0
            const rearrangedImages = [...images];
            if (coverImageIndex > 0 && coverImageIndex < rearrangedImages.length) {
                const coverImage = rearrangedImages[coverImageIndex];
                rearrangedImages.splice(coverImageIndex, 1);
                rearrangedImages.unshift(coverImage);
            }

            return {
                name,
                images: rearrangedImages.map(img => ({
                    id: img.id,
                    uri: img.uri,
                })),
                video: video ? {
                    id: video.id,
                    uri: video.uri,
                } : null,
                height,
                weight,
                length,
                width,
                area,
                material_type: selectedMaterials,
                description,
                short_description: shortDescription,
                categories: {
                    parent_id: categoryId,
                    subcategory_id: subcategoryId,
                    sub_subcategory_id: subSubcategoryId,
                }
            };
        },
        validate: () => {
            return validate({
                name,
                weight: activeTab === 'simple' ? weight : '0', // Bypass validation if hidden
                short_description: shortDescription,
                description,
            });
        },
        updateFields: (data) => {
            if (data.name !== undefined) {
                setName(data.name);
                clearError('name');
                if (onNameChange) onNameChange(data.name);
            }
            if (data.description !== undefined) {
                setDescription(data.description);
                clearError('description');
            }
            if (data.short_description !== undefined) {
                setShortDescription(data.short_description);
                clearError('short_description');
            }
            if (data.weight !== undefined) {
                setWeight(data.weight);
                clearError('weight');
            }
            if (data.length !== undefined) {
                setLength(data.length);
            }
            if (data.width !== undefined) {
                setWidth(data.width);
            }
            if (data.height !== undefined) {
                setHeight(data.height);
            }
            if (data.material_type !== undefined && data.material_type !== null && data.material_type !== '') {
                // Handle multiple formats: array, comma-separated string, or single value
                let materialIds: string[] = [];

                if (Array.isArray(data.material_type)) {
                    // Already an array
                    materialIds = data.material_type.map((m: any) => m.toString());
                } else if (typeof data.material_type === 'string' && data.material_type.includes(',')) {
                    // Comma-separated string
                    materialIds = data.material_type.split(',').map((m: string) => m.trim()).filter((m: string) => m);
                } else if (data.material_type) {
                    // Single value
                    materialIds = [data.material_type.toString()];
                }

                setSelectedMaterials(materialIds);
            }
            if (data.categories !== undefined) {
                if (Array.isArray(data.categories)) {
                    if (data.categories.length > 0) {
                        const categoryIds = data.categories.map((c: any) => {
                            return (typeof c === 'object' ? c.id || c : c).toString();
                        });
                        setPendingCategoryIds(categoryIds);
                    }
                } else if (typeof data.categories === 'object' && data.categories !== null) {
                    // Offline format: { parent_id, subcategory_id, sub_subcategory_id }
                    const catObj = data.categories as any;
                    const categoryIds: string[] = [];
                    if (catObj.parent_id) categoryIds.push(catObj.parent_id.toString());
                    if (catObj.subcategory_id) categoryIds.push(catObj.subcategory_id.toString());
                    if (catObj.sub_subcategory_id) categoryIds.push(catObj.sub_subcategory_id.toString());
                    if (categoryIds.length > 0) {
                        setPendingCategoryIds(categoryIds);
                    }
                }
            }
            if (data.images !== undefined && Array.isArray(data.images)) {
                // Convert image data to MediaFile format
                const imageFiles: MediaFile[] = data.images.map((img, index) => {
                    const uri = typeof img === 'object' ? img.url || img.uri : img;
                    const id = typeof img === 'object' ? img.id : undefined;
                    return {
                        id,
                        uri,
                        type: 'image' as const,
                        fileName: `image_${index}.png`,
                        fileSize: 0,
                    };
                });
                setImages(imageFiles);
            }
            if (data.video !== undefined && data.video) {
                const videoUri = typeof data.video === 'object' ? data.video.url || data.video.uri : data.video;
                const videoId = typeof data.video === 'object' ? data.video.id : undefined;
                setVideo({
                    id: videoId,
                    uri: videoUri,
                    type: 'video',
                    fileName: 'video.mp4',
                    fileSize: 0,
                });
            }
        },
    }));

    const toggleMaterial = (id: string) => {
        setSelectedMaterials(prev =>
            prev.includes(id)
                ? prev.filter(m => m !== id)
                : [...prev, id]
        );
    };

    const handleAddMaterial = () => {
        setShowMaterialModal(true);
    };

    const handleSubmitMaterial = async (materialName: string) => {
        setIsAddingMaterial(true);
        try {
            const newOption = await productAttributesApi.createAttributeOption(
                'material_type',
                materialName
            );

            // Auto-select the newly created material
            setSelectedMaterials(prev => [...prev, newOption.id.toString()]);

            // Refresh attributes to show the new option in chips
            if (onAttributesRefresh) {
                await onAttributesRefresh();
            }

            // Show success toast
            showToast({
                message: `Material "${materialName}" has been added!`,
                type: 'success',
            });
        } catch (error) {
            console.error('Error adding material:', error);
            // Show error toast
            showToast({
                message: 'Failed to add material. Please try again.',
                type: 'error',
            });
            throw error; // Re-throw to let modal handle error state
        } finally {
            setIsAddingMaterial(false);
        }
    };

    const pickFiles = async () => {
        try {
            // Request permission
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

            if (status !== 'granted') {
                showToast({
                    message: 'Please grant permission to access your media library.',
                    type: 'error',
                });
                return;
            }

            // Launch image picker
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.All,
                allowsMultipleSelection: true,
                quality: 1,
            });

            if (!result.canceled && result.assets) {
                processSelectedFiles(result.assets);
            }
        } catch (error) {
            console.error('Error picking files:', error);
            showToast({
                message: 'Failed to select files. Please try again.',
                type: 'error',
            });
        }
    };

    const takePhoto = async () => {
        try {
            // Request camera permission
            const { status } = await ImagePicker.requestCameraPermissionsAsync();

            if (status !== 'granted') {
                showToast({
                    message: 'Please grant permission to access your camera.',
                    type: 'error',
                });
                return;
            }

            // Launch camera
            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                quality: 1,
                allowsEditing: true,
            });

            if (!result.canceled && result.assets) {
                processSelectedFiles(result.assets);
            }
        } catch (error) {
            console.error('Error taking photo:', error);
            showToast({
                message: 'Failed to take photo. Please try again.',
                type: 'error',
            });
        }
    };

    const pickVideo = async () => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                showToast({
                    message: 'Please grant permission to access your media library.',
                    type: 'error',
                });
                return;
            }
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Videos,
                allowsMultipleSelection: false,
                quality: 1,
            });
            if (!result.canceled && result.assets) {
                processSelectedFiles(result.assets);
            }
        } catch (error) {
            console.error('Error picking video:', error);
            showToast({
                message: 'Failed to select video. Please try again.',
                type: 'error',
            });
        }
    };

    const takeVideo = async () => {
        try {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
                showToast({
                    message: 'Please grant permission to access your camera.',
                    type: 'error',
                });
                return;
            }
            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Videos,
                videoMaxDuration: MAX_VIDEO_DURATION,
                quality: 1,
            });
            if (!result.canceled && result.assets) {
                processSelectedFiles(result.assets);
            }
        } catch (error) {
            console.error('Error recording video:', error);
            showToast({
                message: 'Failed to record video. Please try again.',
                type: 'error',
            });
        }
    };

    const processSelectedFiles = (assets: ImagePicker.ImagePickerAsset[]) => {
        const newImages: MediaFile[] = [];
        let newVideo: MediaFile | null = null;
        let errors: string[] = [];

        for (const asset of assets) {
            const isVideo = asset.type === 'video';
            const fileSize = asset.fileSize || 0;

            // Validate file type
            if (!isVideo && !asset.uri.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
                errors.push(`Invalid image format. Only JPG, PNG, GIF, and WebP are allowed.`);
                continue;
            }

            // Validate file size
            if (isVideo) {
                if (fileSize > MAX_VIDEO_SIZE) {
                    errors.push(`Video size exceeds 20MB limit.`);
                    continue;
                }
                const durationInSeconds = (asset.duration || 0) / 1000;
                if (durationInSeconds > MAX_VIDEO_DURATION) {
                    errors.push(`Video duration exceeds ${MAX_VIDEO_DURATION} seconds.`);
                    continue;
                }
                if (video || newVideo) {
                    errors.push(`Only 1 video is allowed.`);
                    continue;
                }
                newVideo = {
                    uri: asset.uri,
                    type: 'video',
                    fileName: asset.fileName || 'video.mp4',
                    fileSize,
                    duration: durationInSeconds,
                };
            } else {
                if (fileSize > MAX_IMAGE_SIZE) {
                    errors.push(`Image "${asset.fileName}" exceeds 20MB limit.`);
                    continue;
                }
                if (images.length + newImages.length >= MAX_IMAGES) {
                    errors.push(`Maximum ${MAX_IMAGES} images allowed.`);
                    continue;
                }
                newImages.push({
                    uri: asset.uri,
                    type: 'image',
                    fileName: asset.fileName || 'image.jpg',
                    fileSize,
                });
            }
        }

        // Update state
        if (newImages.length > 0) {
            setImages(prev => [...prev, ...newImages]);
        }
        if (newVideo) {
            setVideo(newVideo);
        }

        // Show errors if any
        if (errors.length > 0) {
            showToast({
                message: errors.join('\n'),
                type: 'error',
            });
        }
    };

    const removeImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));
        // Reset cover index if we removed the cover or an image before it
        if (index === coverImageIndex) {
            setCoverImageIndex(0);
        } else if (index < coverImageIndex) {
            setCoverImageIndex(prev => prev - 1);
        }
    };

    const removeVideo = () => {
        setVideo(null);
    };

    const setCoverImage = (index: number) => {
        setCoverImageIndex(index);
    };

    // PhotoRoom editing handlers
    const handleImageSelect = (index: number) => {
        setSelectedImageIndex(index);
        setShowImageSelectionModal(false);
        setShowPhotoRoomEditModal(true);
    };

    const handleEditSave = (editedImageUri: string) => {
        if (selectedImageIndex === null) return;

        // Update image in array
        const updatedImages = [...images];
        updatedImages[selectedImageIndex] = {
            ...updatedImages[selectedImageIndex],
            uri: editedImageUri,
        };
        setImages(updatedImages);

        // Track edited image
        if (!editedImageIndices.includes(selectedImageIndex)) {
            setEditedImageIndices([...editedImageIndices, selectedImageIndex]);
        }

        // Close modal and reset
        setShowPhotoRoomEditModal(false);
        setSelectedImageIndex(null);

        // Show success toast
        showToast({
            message: 'Image edited successfully!',
            type: 'success',
        });
    };

    const handleEditCancel = () => {
        setShowPhotoRoomEditModal(false);
        setSelectedImageIndex(null);
    };

    return (
        <View style={styles.card}>
            {/* Card Title */}
            <Text style={styles.cardTitle}>1) {t('supplierPanel.essential')}</Text>

            {/* Name Section */}
            <View style={styles.section}>
                <TextInput
                    style={[styles.input, errors.name && styles.inputError]}
                    placeholder={t('supplierPanel.name')}
                    placeholderTextColor="#666666"
                    value={name}
                    onChangeText={handleNameChange}
                />
                {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
                <Text style={styles.tipText}>
                    Tip: Use simple words that the buyer will type (alebrije, black clay, mezcal, obsidian...).
                </Text>
            </View>

            {/* Images / Video Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Images / Video</Text>

                {/* Upload Buttons Row */}
                <View style={styles.uploadButtonsRow}>
                    <TouchableOpacity
                        style={[styles.uploadButton, (images.length >= MAX_IMAGES && video !== null) && styles.uploadButtonDisabled]}
                        onPress={pickFiles}
                        disabled={images.length >= MAX_IMAGES && video !== null}
                    >
                        <AttachIcon width={16} height={16} />
                        <Text style={styles.uploadButtonText}>Select Files</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.uploadButton, images.length >= MAX_IMAGES && styles.uploadButtonDisabled]}
                        onPress={takePhoto}
                        disabled={images.length >= MAX_IMAGES}
                    >
                        <Ionicons name="camera" size={16} color="#000000" />
                        <Text style={styles.uploadButtonText}>Take Photo</Text>
                    </TouchableOpacity>
                </View>

                {/* Resolution Note */}
                <Text style={styles.resolutionNote}>
                    Recommended image resolution: 560px × 609px
                </Text>

                {/* Image Previews Grid - Dynamic Display */}
                <View style={styles.previewGrid}>
                    {/* Display selected images or placeholders */}
                    {[0, 1, 2, 3, 4].map((index) => {
                        const image = images[index];
                        const isCover = index === coverImageIndex;
                        return (
                            <View
                                key={`image-${index}`}
                                style={[
                                    styles.previewBox,
                                    image && isCover && styles.previewBoxCover
                                ]}
                            >
                                {image ? (
                                    <>
                                        <Image source={{ uri: image.uri }} style={styles.previewImage} />

                                        {isCover ? (
                                            <View style={styles.coverLabel}>
                                                <Text style={styles.coverLabelText}>COVER</Text>
                                            </View>
                                        ) : (
                                            <TouchableOpacity
                                                style={styles.useCoverButton}
                                                onPress={() => setCoverImage(index)}
                                            >
                                                <Text style={styles.useCoverButtonText}>Use Cover</Text>
                                            </TouchableOpacity>
                                        )}

                                        <TouchableOpacity
                                            style={styles.removeButton}
                                            onPress={() => removeImage(index)}
                                        >
                                            <Ionicons name="close-circle" size={24} color="#DC2626" />
                                        </TouchableOpacity>

                                        {/* {editedImageIndices.includes(index) && (
                                            <View style={styles.editedBadge}>
                                                <Text style={styles.editedBadgeText}>EDITED</Text>
                                            </View>
                                        )} */}
                                    </>
                                ) : (
                                    <>
                                        <Ionicons name="image-outline" size={40} color="#CCCCCC" />
                                        <Text style={styles.previewPlaceholderText}>
                                            {index === 0 ? 'Front' : index === 1 ? 'Angle' : index === 2 ? 'Next' : index === 3 ? 'Zoom' : 'Use Cases'}
                                        </Text>
                                    </>
                                )}
                            </View>
                        );
                    })}

                    {/* Video placeholder or preview */}
                    <View style={[styles.previewBox, !video && styles.previewBoxRow]}>
                        {video ? (
                            <>
                                <View style={styles.videoPreview}>
                                    <Ionicons name="videocam" size={28} color={COLORS.primary} />
                                    <Text style={styles.videoFileName} numberOfLines={2}>{video.fileName}</Text>
                                    {video.duration !== undefined && (
                                        <Text style={styles.videoDuration}>{Math.round(video.duration)}s</Text>
                                    )}
                                </View>
                                <TouchableOpacity
                                    style={styles.removeButton}
                                    onPress={removeVideo}
                                >
                                    <Ionicons name="close-circle" size={24} color="#DC2626" />
                                </TouchableOpacity>
                            </>
                        ) : (
                            <>
                                <TouchableOpacity style={styles.videoActionBtn} onPress={pickVideo}>
                                    <Ionicons name="folder-open-outline" size={18} color={COLORS.primary} />
                                    <Text style={styles.videoActionText}>{'Add\nVideo'}</Text>
                                </TouchableOpacity>
                                <View style={styles.videoActionDivider} />
                                <TouchableOpacity style={styles.videoActionBtn} onPress={takeVideo}>
                                    <Ionicons name="videocam-outline" size={18} color={COLORS.primary} />
                                    <Text style={styles.videoActionText}>{'Take\nVideo'}</Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                </View>

                <Text style={styles.tipText}>
                    Max. 5 images. Max. 1 video (25 s). Only 2 images can be retouched (center, size, background, light).
                </Text>
                <View style={styles.buttonRow}>
                    <TouchableOpacity
                        style={[
                            styles.secondaryButton,
                            images.length === 0 && styles.buttonDisabled
                        ]}
                        onPress={() => setShowImageSelectionModal(true)}
                        disabled={images.length === 0}
                    >
                        <Text style={styles.buttonText}>
                            Edit ({editedImageIndices.length}/{MAX_EDITS})
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Size and Weight Section - Only show for Simple Product */}
            {activeTab === 'simple' && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Size and Weight</Text>

                    <View style={styles.gridInputs}>
                        <TextInput
                            style={styles.gridInput}
                            placeholder="Length (cm)"
                            placeholderTextColor="#666666"
                            value={length}
                            onChangeText={setLength}
                            keyboardType="numeric"
                        />
                        <TextInput
                            style={styles.gridInput}
                            placeholder="Width (cm)"
                            placeholderTextColor="#666666"
                            value={width}
                            onChangeText={setWidth}
                            keyboardType="numeric"
                        />
                        <TextInput
                            style={styles.gridInput}
                            placeholder="Height (cm)"
                            placeholderTextColor="#666666"
                            value={height}
                            onChangeText={setHeight}
                            keyboardType="numeric"
                        />
                        <View style={styles.gridInputWrapper}>
                            <TextInput
                                style={[styles.gridInput, styles.gridInputFull, errors.weight && styles.inputError]}
                                placeholder="Weight (kg)"
                                placeholderTextColor="#666666"
                                value={weight}
                                onChangeText={handleWeightChange}
                                keyboardType="numeric"
                            />
                            {errors.weight && <Text style={styles.errorText}>{errors.weight}</Text>}
                        </View>
                    </View>

                    <Text style={styles.tipText}>
                        This improves the automatic shipping quote
                    </Text>
                </View>
            )}

            {/* Material Type Section */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Material Type</Text>
                    <Text style={styles.tipText}>You can select multiple values.</Text>
                </View>

                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.materialChips}
                >
                    {(attributes.find(a => a.code === 'material_type')?.options || []).map((option, index) => (
                        <TouchableOpacity
                            key={index}
                            style={[
                                styles.materialChip,
                                selectedMaterials.includes(option.id.toString()) && styles.materialChipActive
                            ]}
                            onPress={() => toggleMaterial(option.id.toString())}
                        >
                            <Text style={styles.materialChipText}>{option.admin_name}</Text>
                        </TouchableOpacity>
                    ))}
                    {(!attributes.find(a => a.code === 'material_type') && DEFAULT_MATERIAL_TYPES.map((material, index) => (
                        <TouchableOpacity
                            key={`default-${index}`}
                            style={[
                                styles.materialChip,
                                selectedMaterials.includes(material) && styles.materialChipActive
                            ]}
                            onPress={() => toggleMaterial(material)}
                        >
                            <Text style={styles.materialChipText}>{material}</Text>
                        </TouchableOpacity>
                    )))}
                    {isConnected && (
                        <TouchableOpacity style={styles.addMaterialButton} onPress={handleAddMaterial}>
                            <Ionicons name="add" size={24} color="#FFFFFF" />
                        </TouchableOpacity>
                    )}
                </ScrollView>

                {/* AI Suggestion Button — disabled offline (requires internet to generate) */}
                <TouchableOpacity
                    style={[styles.aiButton, !isConnected && styles.aiButtonDisabled]}
                    onPress={onAIGenerateClick}
                    disabled={!isConnected}
                >
                    <AiIcon width={16} height={16} color={isConnected ? '#000000' : '#999999'} />
                    <Text style={[styles.buttonText, !isConnected && styles.buttonTextDisabled]}>Auto-generate information</Text>
                </TouchableOpacity>

                <Text style={styles.tipText}>
                    Fill in SKU, suggest category, generate a short description, and activate the shipping calculation (preview).
                </Text>
            </View>

            {/* short Description*/}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Short Description</Text>
                <RichTextEditor
                    value={shortDescription}
                    onChange={handleShortDescriptionChange}
                    placeholder="Short Description..."
                    hasError={!!errors.short_description}
                    minHeight={120}
                />
                {errors.short_description && <Text style={styles.errorText}>{errors.short_description}</Text>}
                <Text style={styles.tipText}>
                    Keep the Short description short: key values.
                </Text>
            </View>

            {/* Description Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Description</Text>
                <RichTextEditor
                    value={description}
                    onChange={handleDescriptionChange}
                    placeholder="Description..."
                    hasError={!!errors.description}
                    minHeight={150}
                />
                {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}
                <Text style={styles.tipText}>
                    Keep the description brief: technical + origin + use.
                </Text>
            </View>

            {/* Category Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Category</Text>
                <Dropdown
                    placeholder="Select category..."
                    options={categories.map(c => ({ label: c.name, value: c.id.toString() }))}
                    value={categoryId}
                    onSelect={handleCategorySelect}
                    disabled={categories.length === 0}
                />
            </View>

            {/* Subcategory Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Subcategory</Text>
                <Dropdown
                    placeholder="Select subcategory..."
                    options={subcategories.map(c => ({ label: c.name, value: c.id.toString() }))}
                    value={subcategoryId}
                    onSelect={handleSubcategorySelect}
                    disabled={subcategories.length === 0}
                />
            </View>

            {/* Sub-subcategory Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Sub-subcategory</Text>
                <Dropdown
                    placeholder="Select sub-subcategory..."
                    options={subSubcategories.map(c => ({ label: c.name, value: c.id.toString() }))}
                    value={subSubcategoryId}
                    onSelect={setSubSubcategoryId}
                    disabled={subSubcategories.length === 0}
                />
            </View>

            {/* Add Custom Category Button */}
            {/* <TouchableOpacity style={styles.aiButton}>
                <Ionicons name="add" size={16} color="#000000" />
                <Text style={styles.buttonText}>Add custom category</Text>
            </TouchableOpacity> */}

            {/* Material Input Modal */}
            <InputModal
                visible={showMaterialModal}
                onClose={() => setShowMaterialModal(false)}
                onSubmit={handleSubmitMaterial}
                title="Add New Material"
                placeholder="Enter material type name..."
                submitButtonText="Add Material"
                isLoading={isAddingMaterial}
            />

            {/* PhotoRoom Editing Modals */}
            <ImageSelectionModal
                visible={showImageSelectionModal}
                images={images}
                editedImageIndices={editedImageIndices}
                maxEdits={MAX_EDITS}
                onClose={() => setShowImageSelectionModal(false)}
                onSelectImage={handleImageSelect}
            />

            <PhotoRoomEditModal
                visible={showPhotoRoomEditModal}
                image={selectedImageIndex !== null ? images[selectedImageIndex] : null}
                onClose={handleEditCancel}
                onSave={handleEditSave}
            />
        </View>
    );
});

export default EssentialCard;

const styles = StyleSheet.create({
    card: {
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'flex-start',
        padding: 16,
        gap: 16,
        width: '100%',
        backgroundColor: COLORS.white,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 3,
        borderRadius: 16,
    },
    cardTitle: {
        width: '100%',
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '500',
        fontSize: 20,
        lineHeight: 24,
        color: '#000000',
    },
    section: {
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 8,
        width: '100%',
    },
    sectionHeader: {
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 4,
        width: '100%',
    },
    sectionTitle: {
        width: '100%',
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '500',
        fontSize: 16,
        lineHeight: 19,
        color: '#000000',
    },
    input: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 16,
        width: '100%',
        height: 40,
        backgroundColor: '#EEEEEF',
        borderRadius: 8,
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '400',
        fontSize: 16,
        color: '#000000',
    },
    inputGroup: {
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 8,
        width: '100%',
    },
    inputWithIcon: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 16,
        gap: 10,
        width: '100%',
        height: 40,
        backgroundColor: '#EEEEEF',
        borderRadius: 8,
    },
    inputFlex: {
        flex: 1,
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '400',
        fontSize: 16,
        color: '#000000',
    },
    tipText: {
        width: '100%',
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '400',
        fontSize: 14,
        lineHeight: 20,
        color: '#666666',
    },
    buttonRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        width: '100%',
        height: 40,
    },
    secondaryButton: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 12,
        gap: 8,
        minHeight: 40,
        borderWidth: 1,
        borderColor: COLORS.primary,
        borderRadius: 8,
    },
    buttonText: {
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '400',
        fontSize: 16,
        color: '#000000',
    },
    gridInputs: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'flex-start',
        gap: 8,
        width: '100%',
    },
    gridInput: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 16,
        width: '48.5%',
        height: 40,
        backgroundColor: '#EEEEEF',
        borderRadius: 8,
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '400',
        fontSize: 16,
        color: '#000000',
    },
    materialChips: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    materialChip: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        height: 40,
        backgroundColor: '#EEEEEF',
        borderRadius: 8,
    },
    materialChipActive: {
        backgroundColor: COLORS.primaryLight,
        borderWidth: 1,
        borderColor: COLORS.primary,
    },
    materialChipText: {
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '400',
        fontSize: 16,
        lineHeight: 16,
        color: '#666666',
    },
    addMaterialButton: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        width: 40,
        height: 40,
        backgroundColor: COLORS.primary,
        borderRadius: 8,
    },
    aiButton: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 12,
        gap: 8,
        width: '100%',
        minHeight: 40,
        backgroundColor: COLORS.primaryLight,
        borderWidth: 1,
        borderColor: COLORS.primary,
        borderRadius: 8,
    },
    aiButtonDisabled: {
        backgroundColor: '#F3F3F3',
        borderColor: '#D1D1D1',
        opacity: 0.55,
    },
    buttonTextDisabled: {
        color: '#999999',
    },
    textArea: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'flex-start',
        paddingVertical: 12,
        paddingHorizontal: 16,
        width: '100%',
        height: 100,
        backgroundColor: '#EEEEEF',
        borderRadius: 8,
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '400',
        fontSize: 16,
        color: '#000000',
        textAlignVertical: 'top',
    },
    uploadButtonsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        width: '100%',
    },
    uploadButton: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 12,
        gap: 8,
        minHeight: 40,
        backgroundColor: COLORS.primaryLight,
        borderWidth: 1,
        borderColor: COLORS.primary,
        borderRadius: 8,
    },
    uploadButtonText: {
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '400',
        fontSize: 14,
        color: '#000000',
    },
    uploadButtonDisabled: {
        opacity: 0.5,
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    editedBadge: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        backgroundColor: '#10B981',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderTopRightRadius: 8,
        borderBottomLeftRadius: 6,
        zIndex: 5,
    },
    editedBadgeText: {
        fontFamily: 'Inter',
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: '700',
    },
    resolutionNote: {
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '400',
        fontSize: 12,
        lineHeight: 14,
        color: '#666666',
        marginTop: 4,
    },
    previewGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        width: '100%',
    },
    previewBox: {
        width: '31%',
        aspectRatio: 1,
        backgroundColor: '#F5F5F5',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E5E5E5',
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 4,
    },
    previewPlaceholderText: {
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '400',
        fontSize: 12,
        lineHeight: 14,
        color: '#999999',
    },
    previewVideoLimit: {
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '400',
        fontSize: 10,
        lineHeight: 12,
        color: '#CCCCCC',
    },
    previewImage: {
        width: '100%',
        height: '100%',
        borderRadius: 8,
    },
    removeButton: {
        position: 'absolute',
        top: 4,
        right: 4,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        zIndex: 10,
    },
    previewBoxCover: {
        borderColor: COLORS.primary,
        borderStyle: 'solid',
        borderWidth: 2,
    },
    coverLabel: {
        position: 'absolute',
        top: 0,
        left: 0,
        backgroundColor: COLORS.primary,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderTopLeftRadius: 6,
        borderBottomRightRadius: 8,
        zIndex: 5,
    },
    coverLabelText: {
        fontFamily: 'Inter',
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: '700',
    },
    useCoverButton: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        paddingVertical: 4,
        alignItems: 'center',
        borderBottomLeftRadius: 6,
        borderBottomRightRadius: 6,
        zIndex: 5,
    },
    useCoverButtonText: {
        fontFamily: 'Inter',
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: '600',
    },
    videoPreview: {
        width: '100%',
        height: '100%',
        backgroundColor: COLORS.primaryLight,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 4,
        borderWidth: 1,
        borderColor: COLORS.primary,
    },
    videoFileName: {
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '500',
        fontSize: 10,
        lineHeight: 12,
        color: '#000000',
        textAlign: 'center',
        paddingHorizontal: 4,
    },
    videoDuration: {
        fontFamily: 'Inter',
        fontSize: 10,
        fontWeight: '400',
        lineHeight: 12,
        color: '#666666',
    },
    previewBoxRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 2,
    },
    videoActionBtn: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 3,
        paddingVertical: 4,
    },
    videoActionText: {
        fontFamily: 'Inter',
        fontSize: 9,
        fontWeight: '600',
        color: COLORS.primary,
        textAlign: 'center',
        lineHeight: 12,
    },
    videoActionDivider: {
        width: 1,
        height: '55%',
        backgroundColor: '#E0E0E0',
    },
    inputError: {
        borderWidth: 1,
        borderColor: '#EF4444', // Lighter red
    },
    gridInputWrapper: {
        width: '48.5%',
        flexDirection: 'column',
    },
    gridInputFull: {
        width: '100%',
    },
    errorText: {
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '400',
        fontSize: 12,
        lineHeight: 16,
        color: '#DC2626',
        marginTop: 4,
    },
});
