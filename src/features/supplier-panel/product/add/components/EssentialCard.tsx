import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, Image } from 'react-native';
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

// Fallback material types if attributes are not yet loaded
const DEFAULT_MATERIAL_TYPES = [
    'Wood', 'The work', 'Cotton', 'Leather', 'Silver', 'Food',
    'Obsidian', 'Amber', 'Clay', 'Ceramic', 'Glass'
];

// Categories will be loaded from API

interface MediaFile {
    uri: string;
    type: 'image' | 'video';
    fileName: string;
    fileSize: number;
    duration?: number; // in seconds, for videos
}

const MAX_IMAGES = 5;
const MAX_VIDEOS = 1;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_VIDEO_SIZE = 20 * 1024 * 1024; // 20MB
const MAX_VIDEO_DURATION = 25; // 25 seconds
const REQUIRED_IMAGE_WIDTH = 560;
const REQUIRED_IMAGE_HEIGHT = 609;

interface EssentialCardProps {
    attributes: ProductAttribute[];
    onNameChange?: (name: string) => void;
    onAttributesRefresh?: () => Promise<void>;
    onAIGenerateClick?: () => void;
}

export interface EssentialCardRef {
    getData: () => any;
    validate: () => boolean;
    updateFields: (data: { description?: string; short_description?: string }) => void;
}

const EssentialCard = forwardRef<EssentialCardRef, EssentialCardProps>(({ attributes, onNameChange, onAttributesRefresh, onAIGenerateClick }, ref) => {
    const [name, setName] = useState('');
    const [images, setImages] = useState<MediaFile[]>([]);
    const [video, setVideo] = useState<MediaFile | null>(null);
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
        getData: () => ({
            name,
            images: images.map(img => img.uri),
            video: video?.uri,
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
        }),
        validate: () => {
            return validate({
                name,
                weight,
                short_description: shortDescription,
                description,
            });
        },
        updateFields: (data) => {
            console.log('🔵 EssentialCard updateFields called with:', data);
            console.log('🔵 Current description:', description);
            console.log('🔵 Current shortDescription:', shortDescription);

            if (data.description !== undefined) {
                console.log('🔵 Setting description to:', data.description);
                setDescription(data.description);
            }
            if (data.short_description !== undefined) {
                console.log('🔵 Setting short_description to:', data.short_description);
                setShortDescription(data.short_description);
            }

            console.log('🔵 updateFields completed');
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
                Alert.alert('Permission Required', 'Please grant permission to access your media library.');
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
            Alert.alert('Error', 'Failed to select files. Please try again.');
        }
    };

    const takePhoto = async () => {
        try {
            // Request camera permission
            const { status } = await ImagePicker.requestCameraPermissionsAsync();

            if (status !== 'granted') {
                Alert.alert('Permission Required', 'Please grant permission to access your camera.');
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
            Alert.alert('Error', 'Failed to take photo. Please try again.');
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
                    errors.push(`Image "${asset.fileName}" exceeds 5MB limit.`);
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
            Alert.alert('Validation Errors', errors.join('\n'));
        }
    };

    const removeImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));
    };

    const removeVideo = () => {
        setVideo(null);
    };

    return (
        <View style={styles.card}>
            {/* Card Title */}
            <Text style={styles.cardTitle}>1) Essential</Text>

            {/* Name Section */}
            <View style={styles.section}>
                <TextInput
                    style={[styles.input, errors.name && styles.inputError]}
                    placeholder="Name"
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
                        return (
                            <View key={`image-${index}`} style={styles.previewBox}>
                                {image ? (
                                    <>
                                        <Image source={{ uri: image.uri }} style={styles.previewImage} />
                                        <TouchableOpacity
                                            style={styles.removeButton}
                                            onPress={() => removeImage(index)}
                                        >
                                            <Ionicons name="close-circle" size={24} color="#DC2626" />
                                        </TouchableOpacity>
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
                    <View style={styles.previewBox}>
                        {video ? (
                            <>
                                <View style={styles.videoPreview}>
                                    <Ionicons name="videocam" size={40} color="#FFFFFF" />
                                    <Text style={styles.videoFileName}>{video.fileName}</Text>
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
                                <Ionicons name="videocam-outline" size={40} color="#CCCCCC" />
                                <Text style={styles.previewPlaceholderText}>Video</Text>
                                <Text style={styles.previewVideoLimit}>(25s max)</Text>
                            </>
                        )}
                    </View>
                </View>

                <Text style={styles.tipText}>
                    Max. 5 images. Max. 1 video (25 s). Only 2 images can be retouched (center, size, background, light).
                </Text>
                <View style={styles.buttonRow}>
                    <TouchableOpacity style={styles.secondaryButton}>
                        <Text style={styles.buttonText}>Edit (2/2)</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.secondaryButton}>
                        <Text style={styles.buttonText}>Define Cover</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Size and Weight Section */}
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

            {/* Material Type Section */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Material Type</Text>
                    <Text style={styles.tipText}>You can select multiple values.</Text>
                </View>

                <View style={styles.materialChips}>
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
                    <TouchableOpacity style={styles.addMaterialButton} onPress={handleAddMaterial}>
                        <Ionicons name="add" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                </View>

                {/* AI Suggestion Button */}
                <TouchableOpacity style={styles.aiButton} onPress={onAIGenerateClick}>
                    <AiIcon width={16} height={16} color="#000000" />
                    <Text style={styles.buttonText}>Suggest material with AI</Text>
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
                />
            </View>

            {/* Add Custom Category Button */}
            <TouchableOpacity style={styles.aiButton}>
                <Ionicons name="add" size={16} color="#000000" />
                <Text style={styles.buttonText}>Add custom category</Text>
            </TouchableOpacity>

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
        padding: 12,
        gap: 8,
        height: 40,
        borderWidth: 1,
        borderColor: COLORS.primary,
        borderRadius: 8,
    },
    buttonText: {
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '400',
        fontSize: 16,
        lineHeight: 16,
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
        flexWrap: 'wrap',
        alignItems: 'flex-start',
        gap: 8,
        width: '100%',
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
        padding: 12,
        gap: 8,
        width: '100%',
        height: 40,
        backgroundColor: COLORS.primaryLight,
        borderWidth: 1,
        borderColor: COLORS.primary,
        borderRadius: 8,
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
        padding: 12,
        gap: 8,
        height: 40,
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
        lineHeight: 16,
        color: '#000000',
    },
    uploadButtonDisabled: {
        opacity: 0.5,
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
    },
    videoPreview: {
        width: '100%',
        height: '100%',
        backgroundColor: '#333333',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 4,
    },
    videoFileName: {
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '400',
        fontSize: 10,
        lineHeight: 12,
        color: '#FFFFFF',
        textAlign: 'center',
        paddingHorizontal: 4,
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
