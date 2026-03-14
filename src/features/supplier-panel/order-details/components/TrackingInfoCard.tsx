import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import * as Sharing from 'expo-sharing';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    Image,
    Linking,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { PickerModal } from '../../../../shared/components/PickerModal';
import { useToast } from '../../../../shared/components/Toast/ToastContext';
import { Dropdown } from '../../components';
import { OrderShipment } from '../../orders/api/orders.api';
import { consignmentOptions, packageOptions } from '../../shared/constants/shipmentOptions';

interface TrackingInfoCardProps {
    shipments?: OrderShipment[];
    isSubmitting?: boolean;
    isSubmittingStatus?: boolean;
    isSkydropx?: boolean;
    onSubmit?: (trackingNumber: string, photoUri: string | null) => void;
    onSkydropxSubmit?: (consignmentNote: string, packageType: string) => void;
    onStatusUpdate?: (shipmentId: number, status: string) => void;
}

export default function TrackingInfoCard({ shipments = [], isSubmitting = false, isSubmittingStatus = false, isSkydropx = false, onSubmit, onSkydropxSubmit, onStatusUpdate }: TrackingInfoCardProps) {
    const { showToast } = useToast();
    const [trackingNumber, setTrackingNumber] = useState('');
    const [photoUri, setPhotoUri] = useState<string | null>(null);
    const [viewModalVisible, setViewModalVisible] = useState(false);
    const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
    const [isDownloading, setIsDownloading] = useState(false);

    const [selectedMethod, setSelectedMethod] = useState<'skydropx' | 'manual'>(isSkydropx ? 'skydropx' : 'manual');
    const [consignmentNote, setConsignmentNote] = useState('');
    const [packageType, setPackageType] = useState('');
    const [isConsignmentModalVisible, setIsConsignmentModalVisible] = useState(false);
    const [isPackageModalVisible, setIsPackageModalVisible] = useState(false);



    const getAvailableStatuses = (currentStatus: string) => {
        let statuses: string[] = [];
        if (currentStatus === 'ready_to_ship') {
            statuses = ['ready_to_ship', 'picked_up', 'in_transit', 'delivered'];
        } else if (currentStatus === 'picked_up') {
            statuses = ['picked_up', 'in_transit', 'delivered'];
        } else if (currentStatus === 'in_transit') {
            statuses = ['in_transit', 'delivered'];
        }

        return statuses.map(status => ({
            label: status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            value: status
        }));
    };

    const handleViewPhoto = (uri: string) => {
        setSelectedPhoto(uri);
        setViewModalVisible(true);
    };

    const handleDownloadPhoto = async (uri: string) => {
        try {
            setIsDownloading(true);
            const filename = uri.split('/').pop() || 'tracking_photo.jpg';
            const cacheDir = (FileSystem as any).cacheDirectory || (FileSystem as any).documentDirectory || '';
            const fileUri = `${cacheDir}${filename}`;

            const downloadResult = await FileSystem.downloadAsync(uri, fileUri);

            if (downloadResult.status === 200) {
                await Sharing.shareAsync(fileUri);
            } else {
                showToast({ title: 'Error', message: 'Failed to download image', type: 'error' });
            }
        } catch (error) {
            console.error('Download error:', error);
            showToast({ title: 'Error', message: 'An error occurred while trying to share the image', type: 'error' });
        } finally {
            setIsDownloading(false);
        }
    };

    const handleSubmit = () => {
        if (selectedMethod === 'skydropx') {
            if (onSkydropxSubmit && consignmentNote && packageType) {
                onSkydropxSubmit(consignmentNote, packageType);
            }
        } else {
            if (onSubmit && trackingNumber) {
                onSubmit(trackingNumber, photoUri);
            }
        }
    };

    const handlePhotoUpload = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        });

        if (!result.canceled) {
            setPhotoUri(result.assets[0].uri);
        }
    };

    const removePhoto = () => {
        setPhotoUri('');
    };

    return (
        <View style={styles.container}>
            {/* Existing Shipments Section */}
            {shipments.length > 0 && (
                <View style={styles.existingShipments}>
                    <Text style={styles.sectionTitle}>Existing Shipments</Text>
                    {shipments.map((shipment) => {
                        let parsedInfo: any = {};
                        try {
                            if (shipment.shipment_information) {
                                parsedInfo = typeof shipment.shipment_information === 'string'
                                    ? JSON.parse(shipment.shipment_information)
                                    : shipment.shipment_information;
                            }
                        } catch (e) {
                            // ignore
                        }

                        return (
                            <View key={shipment.id} style={styles.shipmentItem}>
                                <View style={styles.shipmentInfo}>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <Text style={styles.shipmentLabel}>ID: #{shipment.id}</Text>
                                        {shipment.status ? (
                                            <View>
                                                {(!parsedInfo.type || parsedInfo.type === 'manual') && ['ready_to_ship', 'picked_up', 'in_transit'].includes(shipment.status) ? (
                                                    <Dropdown
                                                        options={getAvailableStatuses(shipment.status)}
                                                        value={shipment.status}
                                                        onSelect={(newStatus: string) => {
                                                            if (newStatus !== shipment.status && onStatusUpdate) {
                                                                onStatusUpdate(shipment.shipment_id || shipment.id, newStatus);
                                                            }
                                                        }}
                                                        style={styles.statusDropdownContainer}
                                                    />
                                                ) : (
                                                    <View style={styles.statusBadge}>
                                                        <Text style={styles.statusBadgeText}>
                                                            {shipment.status.replace(/_/g, ' ')}
                                                        </Text>
                                                    </View>
                                                )}
                                            </View>
                                        ) : null}
                                    </View>
                                    <Text style={styles.shipmentText}>Carrier: {shipment.carrier_title}</Text>
                                    {shipment.track_number ? <Text style={styles.shipmentText}>Tracking: {shipment.track_number}</Text> : null}

                                    {(parsedInfo.tracking_url || parsedInfo.label_url) && (
                                        <View style={styles.actionButtonsRow}>
                                            {parsedInfo.tracking_url && (
                                                <TouchableOpacity
                                                    style={styles.actionButton}
                                                    onPress={() => Linking.openURL(parsedInfo.tracking_url)}
                                                >
                                                    <Ionicons name="location-outline" size={16} color="#00615E" />
                                                    <Text style={styles.actionButtonText}>Track</Text>
                                                </TouchableOpacity>
                                            )}

                                            {parsedInfo.label_url && (
                                                <TouchableOpacity
                                                    style={styles.actionButton}
                                                    onPress={() => Linking.openURL(parsedInfo.label_url)}
                                                >
                                                    <Ionicons name="document-text-outline" size={16} color="#00615E" />
                                                    <Text style={styles.actionButtonText}>Label</Text>
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                    )}

                                    <Text style={styles.shipmentDate}>
                                        {new Date(shipment.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                                    </Text>
                                </View>

                                {shipment.tracking_photo_url && (
                                    <View style={styles.shipmentRight}>
                                        <TouchableOpacity
                                            style={styles.shipmentPhotoContainer}
                                            onPress={() => handleViewPhoto(shipment.tracking_photo_url!)}
                                            activeOpacity={0.9}
                                        >
                                            <Image
                                                source={{ uri: shipment.tracking_photo_url }}
                                                style={styles.shipmentPhoto}
                                                resizeMode="cover"
                                            />
                                            <View style={styles.viewBadge}>
                                                <Ionicons name="eye" size={12} color="white" />
                                            </View>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            style={styles.downloadIconBtn}
                                            onPress={() => handleDownloadPhoto(shipment.tracking_photo_url!)}
                                            disabled={isDownloading}
                                        >
                                            {isDownloading ? (
                                                <ActivityIndicator size="small" color="#00615E" />
                                            ) : (
                                                <Ionicons name="download-outline" size={20} color="#00615E" />
                                            )}
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>
                        );
                    })}
                </View>
            )}

            {/* Photo Viewer Modal */}
            <Modal
                visible={viewModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setViewModalVisible(false)}
            >
                <Pressable
                    style={styles.modalOverlay}
                    onPress={() => setViewModalVisible(false)}
                >
                    <View style={styles.modalContent}>
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={() => setViewModalVisible(false)}
                        >
                            <Ionicons name="close" size={30} color="white" />
                        </TouchableOpacity>
                        {selectedPhoto && (
                            <Image
                                source={{ uri: selectedPhoto }}
                                style={styles.fullImage}
                                resizeMode="contain"
                            />
                        )}
                    </View>
                </Pressable>
            </Modal>

            {/* Form Section - Hidden if shipments already exist */}
            {shipments.length === 0 && (
                <View style={styles.formContainer}>
                    <Text style={styles.sectionTitle}>Add Tracking Information</Text>

                    {isSkydropx && (
                        <View style={styles.methodContainer}>
                            <Text style={styles.label}>Shipment Method</Text>
                            <View style={styles.radioGroup}>
                                <TouchableOpacity
                                    style={[styles.radioButton, selectedMethod === 'skydropx' && styles.radioButtonSelected]}
                                    onPress={() => setSelectedMethod('skydropx')}
                                >
                                    <View style={[styles.radioCircle, selectedMethod === 'skydropx' && styles.radioCircleSelected]}>
                                        {selectedMethod === 'skydropx' && <View style={styles.radioInnerCircle} />}
                                    </View>
                                    <View style={styles.radioTextContainer}>
                                        <Text style={styles.radioLabel}>Skydropx</Text>
                                        <Text style={styles.radioSubLabel}>Automated provider</Text>
                                    </View>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.radioButton, selectedMethod === 'manual' && styles.radioButtonSelected]}
                                    onPress={() => setSelectedMethod('manual')}
                                >
                                    <View style={[styles.radioCircle, selectedMethod === 'manual' && styles.radioCircleSelected]}>
                                        {selectedMethod === 'manual' && <View style={styles.radioInnerCircle} />}
                                    </View>
                                    <View style={styles.radioTextContainer}>
                                        <Text style={styles.radioLabel}>Manual</Text>
                                        <Text style={styles.radioSubLabel}>Own logistics</Text>
                                    </View>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}

                    {selectedMethod === 'skydropx' ? (
                        <>
                            {/* Skydropx Fields */}
                            <View style={styles.fieldContainer}>
                                <Text style={styles.label}>Consignment Note</Text>
                                <TouchableOpacity
                                    style={styles.inputContainer}
                                    onPress={() => setIsConsignmentModalVisible(true)}
                                >
                                    <Text style={[styles.input, !consignmentNote && { color: '#6B7280' }]}>
                                        {consignmentNote ? consignmentOptions.find(o => o.value === consignmentNote)?.label : 'Select Consignment Note'}
                                    </Text>
                                    <Ionicons name="chevron-down" size={20} color="#0A292D" />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.fieldContainer}>
                                <Text style={styles.label}>Package Type</Text>
                                <TouchableOpacity
                                    style={styles.inputContainer}
                                    onPress={() => setIsPackageModalVisible(true)}
                                >
                                    <Text style={[styles.input, !packageType && { color: '#6B7280' }]}>
                                        {packageType ? packageOptions.find(o => o.value === packageType)?.label : 'Select Package Type'}
                                    </Text>
                                    <Ionicons name="chevron-down" size={20} color="#0A292D" />
                                </TouchableOpacity>
                            </View>
                        </>
                    ) : (
                        <>
                            {/* Tracking Number Section */}
                            <View style={styles.fieldContainer}>
                                <Text style={styles.label}>Tracking number</Text>
                                <View style={styles.inputContainer}>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Enter here..."
                                        placeholderTextColor="#0A292D"
                                        value={trackingNumber}
                                        onChangeText={setTrackingNumber}
                                        editable={!isSubmitting}
                                    />
                                </View>
                            </View>

                            {/* Upload Photo Section */}
                            <View style={styles.fieldContainer}>
                                <Text style={styles.label}>Upload photo</Text>
                                {photoUri ? (
                                    <View style={styles.photoPreviewContainer}>
                                        <Image source={{ uri: photoUri }} style={styles.photoPreview} />
                                        <TouchableOpacity style={styles.removePhotoButton} onPress={removePhoto}>
                                            <Ionicons name="close-circle" size={24} color="#EF4444" />
                                        </TouchableOpacity>
                                    </View>
                                ) : (
                                    <TouchableOpacity
                                        style={styles.inputContainer}
                                        onPress={handlePhotoUpload}
                                        activeOpacity={0.7}
                                        disabled={isSubmitting}
                                    >
                                        <Ionicons name="attach-outline" size={16} color="#0A292D" />
                                        <Text style={styles.input}>Select a photo...</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </>
                    )}

                    {/* Submit Button */}
                    <View style={styles.buttonContainer}>
                        <TouchableOpacity
                            style={[
                                styles.submitButton,
                                (!(selectedMethod === 'skydropx' ? consignmentNote && packageType : trackingNumber) || isSubmitting) && styles.disabledButton
                            ]}
                            onPress={handleSubmit}
                            activeOpacity={0.8}
                            disabled={!(selectedMethod === 'skydropx' ? consignmentNote && packageType : trackingNumber) || isSubmitting}
                        >
                            {isSubmitting ? (
                                <ActivityIndicator size="small" color="#F5F5F5" />
                            ) : (
                                <Text style={styles.buttonText}>Submit</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {/* Skydropx Pickers */}
            <PickerModal
                visible={isConsignmentModalVisible}
                title="Consignment Note"
                items={consignmentOptions}
                selectedValue={consignmentNote}
                onSelect={setConsignmentNote}
                onClose={() => setIsConsignmentModalVisible(false)}
            />
            <PickerModal
                visible={isPackageModalVisible}
                title="Package Type"
                items={packageOptions}
                selectedValue={packageType}
                onSelect={setPackageType}
                onClose={() => setIsPackageModalVisible(false)}
                searchable={false}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        gap: 16,
    },
    existingShipments: {
        padding: 16,
        backgroundColor: '#F8FBFB',
        borderWidth: 1,
        borderColor: '#E9E3D3',
        borderRadius: 8,
        gap: 12,
    },
    shipmentItem: {
        flexDirection: 'row',
        padding: 12,
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E9E3D3',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    shipmentInfo: {
        flex: 1,
        gap: 4,
    },
    shipmentLabel: {
        fontFamily: 'Inter',
        fontWeight: '600',
        fontSize: 14,
        color: '#0A292D',
    },
    statusBadge: {
        backgroundColor: '#E0F2F1',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
        alignSelf: 'flex-start',
    },
    statusBadgeText: {
        fontFamily: 'Inter',
        fontWeight: '500',
        fontSize: 12,
        color: '#00615E',
        textTransform: 'capitalize',
    },
    statusDropdownContainer: {
        width: 140,
    },
    shipmentText: {
        fontFamily: 'Inter',
        fontWeight: '400',
        fontSize: 13,
        color: '#333333',
    },
    shipmentDate: {
        fontFamily: 'Inter',
        fontWeight: '400',
        fontSize: 12,
        color: '#666666',
        marginTop: 2,
    },
    shipmentRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    shipmentPhotoContainer: {
        width: 60,
        height: 60,
        borderRadius: 6,
        overflow: 'hidden',
        backgroundColor: '#F3F0E7',
        position: 'relative',
    },
    shipmentPhoto: {
        width: '100%',
        height: '100%',
    },
    viewBadge: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        backgroundColor: 'rgba(0,0,1,0.5)',
        borderRadius: 4,
        padding: 2,
    },
    downloadIconBtn: {
        padding: 8,
        backgroundColor: '#F3F0E7',
        borderRadius: 20,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.9)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeButton: {
        position: 'absolute',
        top: 50,
        right: 20,
        zIndex: 1,
        padding: 10,
    },
    fullImage: {
        width: Dimensions.get('window').width,
        height: Dimensions.get('window').height * 0.8,
    },
    formContainer: {
        flexDirection: 'column',
        alignItems: 'center',
        padding: 16,
        gap: 16,
        width: '100%',
        borderWidth: 1,
        borderColor: '#E9E3D3',
        borderRadius: 8,
        backgroundColor: '#FFFFFF',
    },
    sectionTitle: {
        fontFamily: 'Inter',
        fontWeight: '600',
        fontSize: 18,
        color: '#000000',
        alignSelf: 'stretch',
        marginBottom: 4,
    },
    fieldContainer: {
        flexDirection: 'column',
        alignItems: 'flex-start',
        padding: 0,
        gap: 8,
        alignSelf: 'stretch',
    },
    label: {
        fontFamily: 'Inter',
        fontWeight: '500',
        fontSize: 16,
        lineHeight: 19.2,
        color: '#000000',
        alignSelf: 'stretch',
    },
    inputContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 16,
        gap: 10,
        height: 44,
        backgroundColor: '#F3F0E7',
        borderRadius: 8,
        alignSelf: 'stretch',
    },
    input: {
        flex: 1,
        fontFamily: 'Inter',
        fontWeight: '500',
        fontSize: 16,
        color: '#0A292D',
        paddingVertical: 0,
    },
    photoPreviewContainer: {
        position: 'relative',
        width: '100%',
        height: 200,
        borderRadius: 8,
        overflow: 'hidden',
    },
    photoPreview: {
        width: '100%',
        height: '100%',
    },
    removePhotoButton: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        borderRadius: 12,
    },
    buttonContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: 0,
        gap: 8,
        height: 48,
        alignSelf: 'stretch',
    },
    submitButton: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 12,
        gap: 8,
        height: 48,
        backgroundColor: '#00615E',
        borderRadius: 8,
    },
    disabledButton: {
        opacity: 0.6,
    },
    buttonText: {
        fontFamily: 'Inter',
        fontWeight: '600',
        fontSize: 16,
        color: '#F5F5F5',
    },
    methodContainer: {
        width: '100%',
        gap: 8,
    },
    radioGroup: {
        flexDirection: 'column',
        gap: 12,
    },
    radioButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderWidth: 1,
        borderColor: '#E9E3D3',
        borderRadius: 8,
        gap: 12,
        backgroundColor: '#FFFFFF',
    },
    radioButtonSelected: {
        borderColor: '#00615E',
        backgroundColor: '#F3F8F8',
    },
    radioCircle: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#E9E3D3',
        alignItems: 'center',
        justifyContent: 'center',
    },
    radioCircleSelected: {
        borderColor: '#00615E',
    },
    radioInnerCircle: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#00615E',
    },
    radioTextContainer: {
        flex: 1,
    },
    radioLabel: {
        fontFamily: 'Inter',
        fontWeight: '600',
        fontSize: 14,
        color: '#0A292D',
    },
    radioSubLabel: {
        fontFamily: 'Inter',
        fontWeight: '400',
        fontSize: 12,
        color: '#666666',
        marginTop: 2,
    },
    actionButtonsRow: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 8,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 6,
        paddingHorizontal: 12,
        backgroundColor: '#F3F8F8',
        borderWidth: 1,
        borderColor: '#00615E',
        borderRadius: 6,
        flex: 1,
    },
    actionButtonText: {
        fontFamily: 'Inter',
        fontWeight: '500',
        fontSize: 13,
        color: '#00615E',
    },
});
