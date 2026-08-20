import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    Image,
    Dimensions,
    ActivityIndicator,
    PanResponder,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import * as ImageManipulator from 'expo-image-manipulator';

interface ImageCropModalProps {
    visible: boolean;
    imageUri: string;
    aspectRatio: number; // e.g., 560 / 609
    targetWidth?: number; // e.g., 560
    targetHeight?: number; // e.g., 609
    onCancel: () => void;
    onSave: (croppedUri: string, width: number, height: number) => void;
}

const { width: windowWidth, height: windowHeight } = Dimensions.get('window');
const WORKSPACE_WIDTH = windowWidth - 40;
const WORKSPACE_HEIGHT = windowHeight * 0.45;

export const ImageCropModal: React.FC<ImageCropModalProps> = ({
    visible,
    imageUri,
    aspectRatio,
    targetWidth = 560,
    targetHeight = 609,
    onCancel,
    onSave,
}) => {
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [normalizedUri, setNormalizedUri] = useState('');
    const [origW, setOrigW] = useState(0);
    const [origH, setOrigH] = useState(0);

    // Zoom and Position state
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });

    // Layout size of the image inside the crop box
    const [layoutW, setLayoutW] = useState(0);
    const [layoutH, setLayoutH] = useState(0);

    // Crop area dimensions
    const [cropW, setCropW] = useState(0);
    const [cropH, setCropH] = useState(0);
    const [cropTop, setCropTop] = useState(0);
    const [cropLeft, setCropLeft] = useState(0);

    const startPosition = useRef({ x: 0, y: 0 });

    // Refs to store the latest values of state variables and prevent PanResponder closure bugs
    const positionRef = useRef({ x: 0, y: 0 });
    const scaleRef = useRef(1);
    const cropWRef = useRef(0);
    const cropHRef = useRef(0);
    const layoutWRef = useRef(0);
    const layoutHRef = useRef(0);

    // Sync refs with state values
    useEffect(() => {
        positionRef.current = position;
    }, [position]);

    useEffect(() => {
        scaleRef.current = scale;
    }, [scale]);

    useEffect(() => {
        cropWRef.current = cropW;
        cropHRef.current = cropH;
    }, [cropW, cropH]);

    useEffect(() => {
        layoutWRef.current = layoutW;
        layoutHRef.current = layoutH;
    }, [layoutW, layoutH]);

    // 1. Calculate Crop Box and Initial Layout size
    useEffect(() => {
        if (!visible) return;

        // Fit crop box within workspace
        const workspaceRatio = WORKSPACE_WIDTH / WORKSPACE_HEIGHT;
        let cW = WORKSPACE_WIDTH;
        let cH = cW / aspectRatio;

        if (cH > WORKSPACE_HEIGHT) {
            cH = WORKSPACE_HEIGHT;
            cW = cH * aspectRatio;
        }

        setCropW(cW);
        setCropH(cH);
        setCropTop((WORKSPACE_HEIGHT - cH) / 2);
        setCropLeft((WORKSPACE_WIDTH - cW) / 2);
    }, [visible, aspectRatio]);

    // 2. Normalize EXIF and load original image size
    useEffect(() => {
        if (visible && imageUri) {
            setIsLoading(true);
            setScale(1);
            setPosition({ x: 0, y: 0 });

            // Force normalization to bake orientation into pixels
            ImageManipulator.manipulateAsync(
                imageUri,
                [{ rotate: 0 }],
                { compress: 1, format: ImageManipulator.SaveFormat.JPEG }
            ).then((normalized) => {
                setNormalizedUri(normalized.uri);
                setOrigW(normalized.width);
                setOrigH(normalized.height);
                setIsLoading(false);
            }).catch((err) => {
                console.error('[ImageCropModal] Normalization failed, fallback to direct loading:', err);
                Image.getSize(imageUri, (w, h) => {
                    setNormalizedUri(imageUri);
                    setOrigW(w);
                    setOrigH(h);
                    setIsLoading(false);
                }, () => {
                    setIsLoading(false);
                });
            });
        }
    }, [visible, imageUri]);

    // 3. Compute layout width/height of the image to fill the crop container
    useEffect(() => {
        if (origW === 0 || origH === 0 || cropW === 0 || cropH === 0) return;

        const imgRatio = origW / origH;
        const cropRatio = cropW / cropH;

        let lW = 0;
        let lH = 0;

        if (imgRatio > cropRatio) {
            // Image is wider than crop box: fit height to crop box
            lH = cropH;
            lW = cropH * imgRatio;
        } else {
            // Image is taller than crop box: fit width to crop box
            lW = cropW;
            lH = cropW / imgRatio;
        }

        setLayoutW(lW);
        setLayoutH(lH);
        setPosition({ x: 0, y: 0 });
        setScale(1);
    }, [origW, origH, cropW, cropH]);

    // Helper: limit translations so that the image always covers the crop box
    const getClampedPosition = (x: number, y: number, currentScale: number) => {
        const cW = cropWRef.current;
        const cH = cropHRef.current;
        const lW = layoutWRef.current;
        const lH = layoutHRef.current;

        if (cW === 0 || cH === 0 || lW === 0 || lH === 0) return { x, y };

        const limitX = (lW * currentScale - cW) / 2;
        const limitY = (lH * currentScale - cH) / 2;

        return {
            x: limitX > 0 ? Math.min(Math.max(x, -limitX), limitX) : 0,
            y: limitY > 0 ? Math.min(Math.max(y, -limitY), limitY) : 0,
        };
    };

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderGrant: () => {
                startPosition.current = { x: positionRef.current.x, y: positionRef.current.y };
            },
            onPanResponderMove: (evt, gestureState) => {
                const newX = startPosition.current.x + gestureState.dx;
                const newY = startPosition.current.y + gestureState.dy;
                setPosition(getClampedPosition(newX, newY, scaleRef.current));
            },
        })
    ).current;

    const handleZoomChange = (val: number) => {
        setScale(val);
        // Re-clamp position at the new scale
        setPosition((prev) => getClampedPosition(prev.x, prev.y, val));
    };

    const handleRotate = async () => {
        if (!normalizedUri || isLoading || isSaving) return;
        setIsLoading(true);
        try {
            const result = await ImageManipulator.manipulateAsync(
                normalizedUri,
                [{ rotate: 90 }],
                { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
            );
            setNormalizedUri(result.uri);
            setOrigW(result.width);
            setOrigH(result.height);
            setPosition({ x: 0, y: 0 });
            setScale(1);
        } catch (error) {
            console.error('[ImageCropModal] Rotation failed:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        if (isSaving || !normalizedUri) return;
        setIsSaving(true);

        try {
            const dx = (layoutW * scale - cropW) / 2 - position.x;
            const dy = (layoutH * scale - cropH) / 2 - position.y;

            // Map layout space back to original image space
            const scaleFactor = origW / (layoutW * scale);

            const cropX = Math.max(0, dx * scaleFactor);
            const cropY = Math.max(0, dy * scaleFactor);
            const cropWidth = cropW * scaleFactor;
            const cropHeight = cropH * scaleFactor;

            const actions: ImageManipulator.Action[] = [];

            actions.push({
                crop: {
                    originX: Math.floor(cropX),
                    originY: Math.floor(cropY),
                    width: Math.floor(cropWidth),
                    height: Math.floor(cropHeight),
                },
            });

            actions.push({
                resize: {
                    width: targetWidth,
                    height: targetHeight,
                },
            });

            const result = await ImageManipulator.manipulateAsync(
                normalizedUri,
                actions,
                { compress: 0.85, format: ImageManipulator.SaveFormat.JPEG }
            );

            onSave(result.uri, result.width, result.height);
        } catch (error) {
            console.error('[ImageCropModal] Save failed:', error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Modal visible={visible} transparent animationType="slide">
            <View style={styles.overlay}>
                <View style={styles.container}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>Crop Image</Text>
                        <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
                            <Ionicons name="close" size={24} color="#000000" />
                        </TouchableOpacity>
                    </View>

                    {/* Workspace */}
                    <View style={styles.workspace}>
                        {isLoading ? (
                            <ActivityIndicator size="large" color="#00615E" />
                        ) : (
                            <View style={styles.cropWindow}>
                                {/* Visual Cropper Viewport */}
                                <View
                                    {...panResponder.panHandlers}
                                    style={[
                                        styles.cropBox,
                                        {
                                            width: cropW,
                                            height: cropH,
                                            top: cropTop,
                                            left: cropLeft,
                                        },
                                    ]}
                                >
                                    {/* The Image inside the crop box */}
                                    <Image
                                        source={{ uri: normalizedUri }}
                                        style={[
                                            styles.image,
                                            {
                                                width: layoutW,
                                                height: layoutH,
                                                left: (cropW - layoutW) / 2,
                                                top: (cropH - layoutH) / 2,
                                                transform: [
                                                    { translateX: position.x },
                                                    { translateY: position.y },
                                                    { scale: scale },
                                                ],
                                            },
                                        ]}
                                    />
                                    {/* Dotted border showing the exact viewport */}
                                    <View style={styles.cropGuideBorder} pointerEvents="none" />
                                    {/* Crop Dimensions label */}
                                    <View style={styles.dimensionsLabel} pointerEvents="none">
                                        <Text style={styles.dimensionsText}>
                                            {targetWidth} × {targetHeight} px
                                        </Text>
                                    </View>
                                </View>

                                {/* Dimmed overlays surrounding the crop area inside the workspace */}
                                <View style={[styles.dimOverlay, { top: 0, left: 0, right: 0, height: cropTop }]} pointerEvents="none" />
                                <View style={[styles.dimOverlay, { top: cropTop + cropH, left: 0, right: 0, bottom: 0 }]} pointerEvents="none" />
                                <View style={[styles.dimOverlay, { top: cropTop, left: 0, width: cropLeft, height: cropH }]} pointerEvents="none" />
                                <View style={[styles.dimOverlay, { top: cropTop, left: cropLeft + cropW, right: 0, height: cropH }]} pointerEvents="none" />
                            </View>
                        )}
                    </View>

                    {/* Toolbar / Controls */}
                    <View style={styles.controls}>
                        {/* Zoom Row */}
                        <View style={styles.controlRow}>
                            <Ionicons name="image-outline" size={20} color="#666666" />
                            <Slider
                                style={styles.slider}
                                minimumValue={1}
                                maximumValue={3}
                                value={scale}
                                onValueChange={handleZoomChange}
                                minimumTrackTintColor="#00615E"
                                maximumTrackTintColor="#DDDDDD"
                                thumbTintColor="#00615E"
                            />
                            <Ionicons name="image" size={24} color="#00615E" />
                        </View>

                        {/* Rotate Action Button */}
                        <TouchableOpacity style={styles.rotateButton} onPress={handleRotate}>
                            <Ionicons name="refresh-outline" size={20} color="#00615E" />
                            <Text style={styles.rotateText}>Rotate 90°</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Action Footer */}
                    <View style={styles.footer}>
                        <TouchableOpacity style={[styles.button, styles.btnCancel]} onPress={onCancel}>
                            <Text style={styles.btnTextCancel}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.button, styles.btnSave]} onPress={handleSave} disabled={isSaving}>
                            {isSaving ? (
                                <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                                <Text style={styles.btnTextSave}>Crop & Save</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        width: '92%',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 10,
    },
    header: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#000000',
    },
    closeButton: {
        padding: 4,
    },
    workspace: {
        width: WORKSPACE_WIDTH,
        height: WORKSPACE_HEIGHT,
        backgroundColor: '#EAEAEA',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    cropWindow: {
        width: '100%',
        height: '100%',
        position: 'relative',
    },
    cropBox: {
        position: 'absolute',
        overflow: 'hidden',
        zIndex: 5,
    },
    image: {
        position: 'absolute',
    },
    cropGuideBorder: {
        ...StyleSheet.absoluteFillObject,
        borderWidth: 2,
        borderColor: '#FFFFFF',
        borderStyle: 'dashed',
    },
    dimensionsLabel: {
        position: 'absolute',
        bottom: 8,
        left: 8,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        borderRadius: 4,
        paddingVertical: 2,
        paddingHorizontal: 6,
    },
    dimensionsText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: '500',
    },
    dimOverlay: {
        position: 'absolute',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 2,
    },
    controls: {
        width: '100%',
        marginTop: 16,
        alignItems: 'center',
    },
    controlRow: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        paddingHorizontal: 8,
        marginBottom: 12,
    },
    slider: {
        flex: 1,
        height: 40,
        marginHorizontal: 8,
    },
    rotateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#00615E',
        backgroundColor: '#F4FBFB',
    },
    rotateText: {
        color: '#00615E',
        fontSize: 14,
        fontWeight: '500',
        marginLeft: 6,
    },
    footer: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
    },
    button: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    btnCancel: {
        backgroundColor: '#F5F5F5',
        marginRight: 8,
    },
    btnTextCancel: {
        color: '#666666',
        fontWeight: '600',
    },
    btnSave: {
        backgroundColor: '#00615E',
        marginLeft: 8,
    },
    btnTextSave: {
        color: '#FFFFFF',
        fontWeight: '600',
    },
});
