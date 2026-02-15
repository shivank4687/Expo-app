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
    TextInput,
    Switch,
    LayoutChangeEvent,
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

type TabType = 'background' | 'adjust' | 'advanced';

interface EditSettings {
    // Background
    background?: string;
    aiBackgroundPrompt?: string;

    // Adjustments
    padding?: number;
    shadow?: string;
    photoFix?: boolean;
    horizontalAlignment?: string;
    verticalAlignment?: string;

    // Advanced
    outputSize?: string;
    crop?: boolean;
    scaling?: string;
    format?: string;
}

const PhotoRoomEditModal: React.FC<PhotoRoomEditModalProps> = ({
    visible,
    image,
    onClose,
    onSave,
}) => {
    const [activeTab, setActiveTab] = useState<TabType>('background');
    const [previewUri, setPreviewUri] = useState<string>('');
    const [currentEditedUri, setCurrentEditedUri] = useState<string>('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    const [hasAppliedFilters, setHasAppliedFilters] = useState(false);
    const [previewDimensions, setPreviewDimensions] = useState({ width: 0, height: 0 });
    const [showCropOverlay, setShowCropOverlay] = useState(true);

    // Settings state
    const [settings, setSettings] = useState<EditSettings>({
        background: undefined,
        aiBackgroundPrompt: '',
        padding: 0,
        shadow: 'none',
        photoFix: false,
        horizontalAlignment: 'center',
        verticalAlignment: 'center',
        outputSize: '609x560', // Product image size
        crop: false,
        scaling: 'fit',
        format: 'png',
    });

    // Reset state when modal opens
    useEffect(() => {
        if (visible && image) {
            console.log('PhotoRoomEditModal opened');
            console.log('Image URI:', image.uri);
            setPreviewUri(image.uri);
            setCurrentEditedUri(image.uri);
            setHasChanges(false);
            setHasAppliedFilters(false);
            setShowCropOverlay(true);
            setSettings({
                background: undefined,
                aiBackgroundPrompt: '',
                padding: 0,
                shadow: 'none',
                photoFix: false,
                horizontalAlignment: 'center',
                verticalAlignment: 'center',
                outputSize: '609x560', // Product image size
                crop: false,
                scaling: 'fit',
                format: 'png',
            });
        }
    }, [visible, image]);

    const updateSetting = <K extends keyof EditSettings>(key: K, value: EditSettings[K]) => {
        setSettings(prev => ({ ...prev, [key]: value }));
        setHasChanges(true);
    };

    const handleApplyChanges = async () => {
        if (!hasChanges || !currentEditedUri || isProcessing) return;

        setIsProcessing(true);

        try {
            // Build options from settings
            const options: PhotoRoomOptions = {};

            // Background
            if (settings.background) {
                if (settings.background === 'transparent') {
                    options.background = 'transparent';
                    options.channels = 'rgba';
                } else {
                    options.background = settings.background;
                }
            }

            if (settings.aiBackgroundPrompt && settings.aiBackgroundPrompt.trim()) {
                options['background.prompt'] = settings.aiBackgroundPrompt.trim();
            }

            // Adjustments
            if (settings.padding && settings.padding > 0) {
                options.padding = settings.padding;
            }

            if (settings.shadow && settings.shadow !== 'none') {
                options.shadow = settings.shadow as any;
            }

            if (settings.photoFix) {
                options.photoFix = true;
            }

            if (settings.horizontalAlignment && settings.horizontalAlignment !== 'center') {
                options.horizontalAlignment = settings.horizontalAlignment as any;
            }

            if (settings.verticalAlignment && settings.verticalAlignment !== 'center') {
                options.verticalAlignment = settings.verticalAlignment as any;
            }

            // Advanced
            if (settings.outputSize) {
                options.outputSize = settings.outputSize as any;
            }

            if (settings.crop) {
                options.crop = true;
            }

            if (settings.scaling && settings.scaling !== 'fit') {
                options.scaling = settings.scaling as any;
            }

            if (settings.format) {
                options.format = settings.format as any;
            }

            console.log('[PhotoRoom] Applying settings:', options);

            // Process image with PhotoRoom API
            const result = await photoRoomApi.processImage(currentEditedUri, options);

            console.log('[PhotoRoom] API Response:', {
                success: result.success,
                hasImage: !!result.processed_image,
                imageLength: result.processed_image?.length || 0,
                error: result.error
            });

            if (!result.success || !result.processed_image) {
                Alert.alert('Error', result.error || 'Failed to process image');
                setIsProcessing(false);
                return;
            }

            // Convert base64 to file URI
            const timestamp = Date.now();
            const filename = `edited_${timestamp}.${settings.format || 'png'}`;
            const newUri = await base64ToFileUri(result.processed_image, filename);

            console.log(`[PhotoRoom] Saved processed image to: ${newUri}`);

            // Update preview and current edited URI
            setPreviewUri(newUri);
            setCurrentEditedUri(newUri);
            setHasChanges(false);
            setHasAppliedFilters(true);
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
        onClose();
    };

    const handlePreviewLayout = (event: LayoutChangeEvent) => {
        const { width, height } = event.nativeEvent.layout;
        setPreviewDimensions({ width, height });
    };

    const renderCropOverlay = () => {
        if (!showCropOverlay || !previewDimensions.width || !previewDimensions.height) {
            return null;
        }

        // Target dimensions for product images
        const targetWidth = 609;
        const targetHeight = 560;
        const targetRatio = targetWidth / targetHeight;

        // Calculate the crop area to fit within the preview
        let cropWidth = previewDimensions.width * 0.8; // 80% of preview width
        let cropHeight = cropWidth / targetRatio;

        // If height exceeds preview, scale based on height instead
        if (cropHeight > previewDimensions.height * 0.8) {
            cropHeight = previewDimensions.height * 0.8;
            cropWidth = cropHeight * targetRatio;
        }

        // Center the crop area
        const cropLeft = (previewDimensions.width - cropWidth) / 2;
        const cropTop = (previewDimensions.height - cropHeight) / 2;

        return (
            <View style={styles.cropOverlayContainer}>
                {/* Semi-transparent overlay around the crop area */}
                <View style={[styles.cropDimOverlay, { top: 0, left: 0, right: 0, height: cropTop }]} />
                <View style={[styles.cropDimOverlay, { top: cropTop + cropHeight, left: 0, right: 0, bottom: 0 }]} />
                <View style={[styles.cropDimOverlay, { top: cropTop, left: 0, width: cropLeft, height: cropHeight }]} />
                <View style={[styles.cropDimOverlay, { top: cropTop, left: cropLeft + cropWidth, right: 0, height: cropHeight }]} />

                {/* Dotted border showing the crop area */}
                <View
                    style={[
                        styles.cropBorder,
                        {
                            top: cropTop,
                            left: cropLeft,
                            width: cropWidth,
                            height: cropHeight,
                        },
                    ]}
                >
                    <Text style={styles.cropLabel}>609 × 560 px</Text>
                </View>
            </View>
        );
    };

    const renderTabButton = (tab: TabType, label: string) => (
        <TouchableOpacity
            key={tab}
            style={[styles.tabButton, activeTab === tab && styles.tabButtonActive]}
            onPress={() => setActiveTab(tab)}
        >
            <Text style={[styles.tabButtonText, activeTab === tab && styles.tabButtonTextActive]}>
                {label}
            </Text>
        </TouchableOpacity>
    );

    const renderBackgroundTab = () => (
        <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>AI Background</Text>
            <TextInput
                style={styles.textInput}
                placeholder="e.g., tropical beach scene, modern studio..."
                value={settings.aiBackgroundPrompt}
                onChangeText={(text) => updateSetting('aiBackgroundPrompt', text)}
                multiline
                numberOfLines={2}
            />
            <Text style={styles.helperText}>Generate custom backgrounds with AI</Text>

            <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Background Type</Text>
            <View style={styles.chipRow}>
                <TouchableOpacity
                    style={[styles.chip, settings.background === 'transparent' && styles.chipSelected]}
                    onPress={() => updateSetting('background', 'transparent')}
                >
                    <Text style={[styles.chipText, settings.background === 'transparent' && styles.chipTextSelected]}>
                        Remove BG
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.chip, settings.background === 'ffffff' && styles.chipSelected]}
                    onPress={() => updateSetting('background', 'ffffff')}
                >
                    <Text style={[styles.chipText, settings.background === 'ffffff' && styles.chipTextSelected]}>
                        White BG
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.chip, settings.background === '000000' && styles.chipSelected]}
                    onPress={() => updateSetting('background', '000000')}
                >
                    <Text style={[styles.chipText, settings.background === '000000' && styles.chipTextSelected]}>
                        Black BG
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderAdjustTab = () => (
        <View style={styles.tabContent}>
            <View style={styles.settingRow}>
                <Text style={styles.settingLabel}>PhotoFix (Auto Enhance)</Text>
                <Switch
                    value={settings.photoFix}
                    onValueChange={(value) => updateSetting('photoFix', value)}
                    trackColor={{ false: '#CCCCCC', true: COLORS.primary }}
                />
            </View>

            <Text style={styles.sectionTitle}>Padding</Text>
            <View style={styles.chipRow}>
                <TouchableOpacity
                    style={[styles.chip, settings.padding === 0.1 && styles.chipSelected]}
                    onPress={() => updateSetting('padding', 0.1)}
                >
                    <Text style={[styles.chipText, settings.padding === 0.1 && styles.chipTextSelected]}>10%</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.chip, settings.padding === 0.2 && styles.chipSelected]}
                    onPress={() => updateSetting('padding', 0.2)}
                >
                    <Text style={[styles.chipText, settings.padding === 0.2 && styles.chipTextSelected]}>20%</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.chip, settings.padding === 0 && styles.chipSelected]}
                    onPress={() => updateSetting('padding', 0)}
                >
                    <Text style={[styles.chipText, settings.padding === 0 && styles.chipTextSelected]}>None</Text>
                </TouchableOpacity>
            </View>

            <Text style={styles.sectionTitle}>Shadow</Text>
            <View style={styles.chipRow}>
                <TouchableOpacity
                    style={[styles.chip, settings.shadow === 'soft' && styles.chipSelected]}
                    onPress={() => updateSetting('shadow', 'soft')}
                >
                    <Text style={[styles.chipText, settings.shadow === 'soft' && styles.chipTextSelected]}>Soft</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.chip, settings.shadow === 'hard' && styles.chipSelected]}
                    onPress={() => updateSetting('shadow', 'hard')}
                >
                    <Text style={[styles.chipText, settings.shadow === 'hard' && styles.chipTextSelected]}>Hard</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.chip, settings.shadow === 'ai.soft' && styles.chipSelected]}
                    onPress={() => updateSetting('shadow', 'ai.soft')}
                >
                    <Text style={[styles.chipText, settings.shadow === 'ai.soft' && styles.chipTextSelected]}>AI Soft</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.chip, settings.shadow === 'none' && styles.chipSelected]}
                    onPress={() => updateSetting('shadow', 'none')}
                >
                    <Text style={[styles.chipText, settings.shadow === 'none' && styles.chipTextSelected]}>None</Text>
                </TouchableOpacity>
            </View>

            <Text style={styles.sectionTitle}>Alignment</Text>
            <View style={styles.alignmentContainer}>
                <View style={styles.alignmentRow}>
                    <Text style={styles.alignmentLabel}>Horizontal:</Text>
                    <View style={styles.chipRow}>
                        {['left', 'center', 'right'].map(align => (
                            <TouchableOpacity
                                key={align}
                                style={[styles.chipSmall, settings.horizontalAlignment === align && styles.chipSelected]}
                                onPress={() => updateSetting('horizontalAlignment', align)}
                            >
                                <Text style={[styles.chipText, settings.horizontalAlignment === align && styles.chipTextSelected]}>
                                    {align.charAt(0).toUpperCase() + align.slice(1)}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
                <View style={styles.alignmentRow}>
                    <Text style={styles.alignmentLabel}>Vertical:</Text>
                    <View style={styles.chipRow}>
                        {['top', 'center', 'bottom'].map(align => (
                            <TouchableOpacity
                                key={align}
                                style={[styles.chipSmall, settings.verticalAlignment === align && styles.chipSelected]}
                                onPress={() => updateSetting('verticalAlignment', align)}
                            >
                                <Text style={[styles.chipText, settings.verticalAlignment === align && styles.chipTextSelected]}>
                                    {align.charAt(0).toUpperCase() + align.slice(1)}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </View>
        </View>
    );

    const renderAdvancedTab = () => (
        <View style={styles.tabContent}>
            <View style={styles.settingRow}>
                <Text style={styles.settingLabel}>Show Crop Guide (609×560)</Text>
                <Switch
                    value={showCropOverlay}
                    onValueChange={setShowCropOverlay}
                    trackColor={{ false: '#CCCCCC', true: COLORS.primary }}
                />
            </View>

            <Text style={styles.sectionTitle}>Output Size</Text>
            <View style={styles.chipRow}>
                <TouchableOpacity
                    style={[styles.chip, settings.outputSize === '609x560' && styles.chipSelected]}
                    onPress={() => updateSetting('outputSize', '609x560')}
                >
                    <Text style={[styles.chipText, settings.outputSize === '609x560' && styles.chipTextSelected]}>
                        Product (609×560)
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.chip, settings.outputSize === 'auto' && styles.chipSelected]}
                    onPress={() => updateSetting('outputSize', 'auto')}
                >
                    <Text style={[styles.chipText, settings.outputSize === 'auto' && styles.chipTextSelected]}>
                        Auto
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.chip, settings.outputSize === '800x800' && styles.chipSelected]}
                    onPress={() => updateSetting('outputSize', '800x800')}
                >
                    <Text style={[styles.chipText, settings.outputSize === '800x800' && styles.chipTextSelected]}>
                        Medium (800px)
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.chip, settings.outputSize === '1500x1500' && styles.chipSelected]}
                    onPress={() => updateSetting('outputSize', '1500x1500')}
                >
                    <Text style={[styles.chipText, settings.outputSize === '1500x1500' && styles.chipTextSelected]}>
                        HD (1500px)
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.chip, settings.outputSize === '3000x3000' && styles.chipSelected]}
                    onPress={() => updateSetting('outputSize', '3000x3000')}
                >
                    <Text style={[styles.chipText, settings.outputSize === '3000x3000' && styles.chipTextSelected]}>
                        Full (3000px)
                    </Text>
                </TouchableOpacity>
            </View>

            <View style={styles.settingRow}>
                <Text style={styles.settingLabel}>Crop to Subject</Text>
                <Switch
                    value={settings.crop}
                    onValueChange={(value) => updateSetting('crop', value)}
                    trackColor={{ false: '#CCCCCC', true: COLORS.primary }}
                />
            </View>

            <Text style={styles.sectionTitle}>Scaling</Text>
            <View style={styles.chipRow}>
                <TouchableOpacity
                    style={[styles.chip, settings.scaling === 'fit' && styles.chipSelected]}
                    onPress={() => updateSetting('scaling', 'fit')}
                >
                    <Text style={[styles.chipText, settings.scaling === 'fit' && styles.chipTextSelected]}>Fit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.chip, settings.scaling === 'fill' && styles.chipSelected]}
                    onPress={() => updateSetting('scaling', 'fill')}
                >
                    <Text style={[styles.chipText, settings.scaling === 'fill' && styles.chipTextSelected]}>Fill</Text>
                </TouchableOpacity>
            </View>

            <Text style={styles.sectionTitle}>Format</Text>
            <View style={styles.chipRow}>
                {['png', 'jpg', 'webp'].map(fmt => (
                    <TouchableOpacity
                        key={fmt}
                        style={[styles.chip, settings.format === fmt && styles.chipSelected]}
                        onPress={() => updateSetting('format', fmt)}
                    >
                        <Text style={[styles.chipText, settings.format === fmt && styles.chipTextSelected]}>
                            {fmt.toUpperCase()}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );

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

                    {/* Preview */}
                    <View style={styles.previewContainer} onLayout={handlePreviewLayout}>
                        <Image source={{ uri: previewUri }} style={styles.previewImage} resizeMode="contain" />
                        {renderCropOverlay()}
                        {isProcessing && (
                            <View style={styles.loadingOverlay}>
                                <ActivityIndicator size="large" color={COLORS.primary} />
                                <Text style={styles.loadingText}>Processing...</Text>
                            </View>
                        )}
                    </View>

                    {/* Tabs */}
                    <View style={styles.tabBar}>
                        {renderTabButton('background', 'Background')}
                        {renderTabButton('adjust', 'Adjust')}
                        {renderTabButton('advanced', 'Advanced')}
                    </View>

                    {/* Tab Content */}
                    <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                        {activeTab === 'background' && renderBackgroundTab()}
                        {activeTab === 'adjust' && renderAdjustTab()}
                        {activeTab === 'advanced' && renderAdvancedTab()}

                        {/* Apply Button */}
                        <TouchableOpacity
                            style={[
                                styles.applyButton,
                                (!hasChanges || isProcessing) && styles.applyButtonDisabled
                            ]}
                            onPress={handleApplyChanges}
                            disabled={!hasChanges || isProcessing}
                        >
                            {isProcessing ? (
                                <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                                <Text style={styles.applyButtonText}>Apply Changes</Text>
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
                                (isProcessing || !hasAppliedFilters) && styles.buttonDisabled
                            ]}
                            onPress={handleSave}
                            disabled={isProcessing || !hasAppliedFilters}
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
    previewContainer: {
        width: '100%',
        height: 250,
        backgroundColor: '#F5F5F5',
        borderRadius: 8,
        marginBottom: 16,
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
    tabBar: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#EEEEEE',
        marginBottom: 16,
    },
    tabButton: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    tabButtonActive: {
        borderBottomColor: COLORS.primary,
    },
    tabButtonText: {
        fontFamily: 'Inter',
        fontSize: 14,
        color: '#666666',
    },
    tabButtonTextActive: {
        color: COLORS.primary,
        fontWeight: '600',
    },
    scrollView: {
        maxHeight: 300,
    },
    scrollContent: {
        paddingBottom: 16,
    },
    tabContent: {
        paddingVertical: 8,
    },
    sectionTitle: {
        fontFamily: 'Inter',
        fontSize: 14,
        fontWeight: '500',
        color: '#000000',
        marginBottom: 8,
        marginTop: 8,
    },
    chipRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginRight: -8,
        marginBottom: -8,
    },
    chip: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        backgroundColor: '#EEEEEF',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'transparent',
        marginRight: 8,
        marginBottom: 8,
    },
    chipSmall: {
        paddingVertical: 6,
        paddingHorizontal: 10,
        backgroundColor: '#EEEEEF',
        borderRadius: 6,
        borderWidth: 1,
        borderColor: 'transparent',
        marginRight: 6,
        marginBottom: 6,
    },
    chipSelected: {
        backgroundColor: '#E3F2FD',
        borderColor: COLORS.primary,
    },
    chipText: {
        fontFamily: 'Inter',
        fontSize: 13,
        color: '#666666',
    },
    chipTextSelected: {
        color: COLORS.primary,
        fontWeight: '500',
    },
    textInput: {
        borderWidth: 1,
        borderColor: '#DDDDDD',
        borderRadius: 8,
        padding: 12,
        fontFamily: 'Inter',
        fontSize: 14,
        color: '#000000',
        backgroundColor: '#FFFFFF',
        textAlignVertical: 'top',
    },
    helperText: {
        fontFamily: 'Inter',
        fontSize: 12,
        color: '#999999',
        marginTop: 4,
        fontStyle: 'italic',
    },
    settingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    settingLabel: {
        fontFamily: 'Inter',
        fontSize: 14,
        color: '#000000',
    },
    alignmentContainer: {
        marginTop: 8,
    },
    alignmentRow: {
        marginBottom: 12,
    },
    alignmentLabel: {
        fontFamily: 'Inter',
        fontSize: 13,
        color: '#666666',
        marginBottom: 6,
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
    cropOverlayContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
    },
    cropDimOverlay: {
        position: 'absolute',
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
    },
    cropBorder: {
        position: 'absolute',
        borderWidth: 2,
        borderColor: COLORS.primary,
        borderStyle: 'dashed',
        borderRadius: 4,
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingBottom: 8,
    },
    cropLabel: {
        fontFamily: 'Inter',
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.primary,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
});
