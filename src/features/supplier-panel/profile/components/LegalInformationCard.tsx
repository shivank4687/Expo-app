import supplierVerificationApi, {
    SupplierVerificationStatus,
} from '@/features/supplier-panel/profile/api/verification.api';
import { useToast } from '@/shared/components/Toast';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { getInfoAsync } from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TextStyle,
    TouchableOpacity,
    View,
    ViewStyle,
} from 'react-native';

interface LegalInformationCardStyles {
    legalCard: ViewStyle;
    businessHeader: ViewStyle;
    businessIconBg: ViewStyle;
    businessTextContainer: ViewStyle;
    businessTitle: TextStyle;
    businessDescription: TextStyle;
    chevronContainer: ViewStyle;
    missingBadge: ViewStyle;
    missingText: TextStyle;
    divider: ViewStyle;
    noticeText: TextStyle;
    formSection: ViewStyle;
    inputRow: ViewStyle;
    inputLabel: TextStyle;
    inputChip: ViewStyle;
    inputTextSmall: TextStyle;
    inputRowHigher: ViewStyle;
    inputLabelHigh: TextStyle;
    inputChipHigh: ViewStyle;
    attachmentButtonRow: ViewStyle;
    attachmentButton: ViewStyle;
    attachmentButtonIcon: TextStyle;
    attachmentButtonText: TextStyle;
    attachmentPreview: ViewStyle;
    attachmentPreviewText: TextStyle;
    attachmentPreviewAction: ViewStyle;
    videoButton: ViewStyle;
    iconButtonText: TextStyle;
    recordingText: TextStyle;
    videoPreview: ViewStyle;
    videoPreviewText: TextStyle;
    videoPreviewSubtext: TextStyle;
    videoPreviewAction: ViewStyle;
}

interface LegalInformationCardProps {
    expanded: boolean;
    onToggle: () => void;
    onStatusChange?: (completed: boolean) => void;
    onReady?: () => void;
    styles: LegalInformationCardStyles;
}

interface SelectedDocument {
    source: 'upload' | 'camera';
    name: string;
    uri: string;
}

interface CapturedVideo {
    name: string;
    duration?: string;
    uri: string;
    size?: number;
}

const IDENTITY_VIDEO_MAX_BYTES = 10 * 1024 * 1024; // 10 MB limit enforced by the API

export default function LegalInformationCard({
    expanded,
    onToggle,
    onStatusChange,
    onReady,
    styles,
}: LegalInformationCardProps) {
    const [selectedDocument, setSelectedDocument] = useState<SelectedDocument | null>(null);
    const [recording, setRecording] = useState(false);
    const [capturedVideo, setCapturedVideo] = useState<CapturedVideo | null>(null);
    const [verificationStatus, setVerificationStatus] =
        useState<SupplierVerificationStatus | null>(null);
    const [statusLoading, setStatusLoading] = useState(true);
    const [statusError, setStatusError] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);
    const [actionError, setActionError] = useState<string | null>(null);
    const [hasSignaledReady, setHasSignaledReady] = useState(false);

    const { showToast } = useToast();
    useEffect(() => {
        const completed = verificationStatus?.is_identity_verified ?? false;

        onStatusChange?.(completed);
    }, [verificationStatus]);
    useEffect(() => {
        if (!hasSignaledReady && !statusLoading) {
            setHasSignaledReady(true);
            onReady?.();
        }
    }, [hasSignaledReady, statusLoading, onReady]);
    const selectDocument = async (source: 'upload' | 'camera') => {
        if (source === 'upload') {
            try {
                const result: any = await DocumentPicker.getDocumentAsync({
                    type: ['application/pdf', 'image/jpeg', 'image/png'],
                    copyToCacheDirectory: false,
                });

                if (result.type === 'success') {
                    setSelectedDocument({
                        source: 'upload',
                        name: result.name ?? 'Document',
                        uri: result.uri,
                    });
                }
            } catch (error) {
                console.error('Document pick error:', error);
                showToast({
                    message: 'Unable to open documents. Please try again.',
                    type: 'error',
                });
            }
        } else {
            try {
                const { status } = await ImagePicker.requestCameraPermissionsAsync();
                if (status !== 'granted') {
                    showToast({
                        message: 'Camera access is needed to take a photo.',
                        type: 'warning',
                    });
                    return;
                }

                const result = await ImagePicker.launchCameraAsync({
                    mediaTypes: ['images'],
                    quality: 0.7,
                    cameraType: ImagePicker.CameraType.front,
                });

                if (result.canceled) {
                    return;
                }

                const asset = result.assets?.[0];
                if (asset) {
                    setSelectedDocument({
                        source: 'camera',
                        name: asset.fileName || 'Document photo.jpg',
                        uri: asset.uri,
                    });
                }
            } catch (error) {
                console.error('Image capture error:', error);
                showToast({
                    message: 'Unable to open the camera. Please try again.',
                    type: 'error',
                });
            }
        }
    };

    const loadVerificationStatus = useCallback(async () => {
        setStatusLoading(true);
        setStatusError(null);

        try {
            const data = await supplierVerificationApi.getStatus();
            setVerificationStatus(data);
        } catch (error) {
            console.error('Supplier verification status error:', error);
            setStatusError('Unable to load verification status. Please try again later.');
        } finally {
            setStatusLoading(false);
        }
    }, []);

    useEffect(() => {
        loadVerificationStatus();
    }, [loadVerificationStatus]);

    const recordVideo = async () => {
        try {
            setRecording(true);
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
                showToast({
                    message: 'Camera access is needed to record the selfie.',
                    type: 'warning',
                });
                setRecording(false);
                return;
            }

            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ['videos'],
                videoMaxDuration: 6,
                videoQuality: ImagePicker.UIImagePickerControllerQualityType.Low,
                quality: 0.7,
                cameraType: ImagePicker.CameraType.front,
            });

            if (result.canceled) {
                setRecording(false);
                return;
            }

            setRecording(false);
            const asset = result.assets?.[0];
            if (asset) {
                const fileInfo: any = await getInfoAsync(asset.uri);
                setCapturedVideo({
                    name: asset.fileName ?? 'Video Selfie.mp4',
                    duration: `${asset.duration?.toFixed(1) ?? '---'}s`,
                    uri: asset.uri,
                    size: fileInfo.size ?? undefined,
                });
            }
        } catch (error) {
            setRecording(false);
            console.error('Video recording error:', error);
            showToast({
                message: 'Unable to start the camera. Please try again.',
                type: 'error',
            });
        }
    };

    const handleSubmitIdentityVerification = async () => {
        if (!selectedDocument || !capturedVideo) {
            setActionError('Attach both a document and a selfie video before submitting.');
            return;
        }

        setUploading(true);
        setActionError(null);

        if (capturedVideo.size && capturedVideo.size > IDENTITY_VIDEO_MAX_BYTES) {
            setActionError(
                'Recorded video exceeds the 10 MB upload limit. Try a shorter clip or lower quality.'
            );
            setUploading(false);
            return;
        }

        try {
            const response = await supplierVerificationApi.updateIdentityVerification({
                document: {
                    uri: selectedDocument.uri,
                    name: selectedDocument.name,
                },
                video: {
                    uri: capturedVideo.uri,
                    name: capturedVideo.name,
                },
            });
            const successMessage =
                response?.message ?? 'Identity verification materials submitted for review.';
            showToast({ message: successMessage, type: 'success' });
            setSelectedDocument(null);
            setCapturedVideo(null);
            await loadVerificationStatus();
        } catch (error) {
            console.error('Identity verification upload error:', error);
            const serverMessage = (error as any)?.response?.data?.message;
            setActionError(
                serverMessage ?? 'Unable to submit documents. Please try again shortly.'
            );
        } finally {
            setUploading(false);
        }
    };

    const handleResendVerificationEmail = async () => {
        setResendLoading(true);
        // setActionMessage(null);
        setActionError(null);

        try {
            const response = await supplierVerificationApi.resendVerificationEmail();
            // setActionMessage(response?.message ?? 'Verification email resent.');
            await loadVerificationStatus();
        } catch (error) {
            console.error('Resend verification email error:', error);
            const serverMessage = (error as any)?.response?.data?.message;
            setActionError(
                serverMessage ?? 'Unable to resend verification email. Please try again later.'
            );
        } finally {
            setResendLoading(false);
        }
    };

    const clearDocument = () => setSelectedDocument(null);
    const clearCapturedVideo = () => setCapturedVideo(null);
    const documentReady = Boolean(selectedDocument);
    const videoReady = Boolean(capturedVideo);
    const submitDisabled = !documentReady || !videoReady || uploading;
    const verificationLabel = getVerificationLabel(
        verificationStatus?.identity_verification_status
    );
    const verificationVariant = getVerificationVariant(
        verificationStatus?.identity_verification_status
    );
    const canSubmitVerfication = !['pending', 'verified', 'approved'].includes((verificationStatus?.identity_verification_status || ''))
    const verificationDescription = getVerificationDescription(verificationStatus);
    const verifiedAtText = formatVerifiedAt(verificationStatus?.identity_verified_at);

    return (
        <View style={styles.legalCard}>
            <TouchableOpacity
                style={styles.businessHeader}
                onPress={onToggle}
                activeOpacity={0.7}
            >
                <View style={styles.businessIconBg}>
                    <Ionicons name="id-card-outline" size={16} color="#FFFFFF" />
                </View>

                <View style={styles.businessTextContainer}>
                    <Text style={styles.businessTitle}>Legal information</Text>
                    <Text style={styles.businessDescription}>Identity Verification</Text>
                </View>
                <View style={styles.headerActions}>
                    <View
                        style={[
                            statusStyles.badge,
                            verificationVariant === 'success'
                                ? statusStyles.badgeSuccess
                                : verificationVariant === 'warning'
                                    ? statusStyles.badgeWarning
                                    : verificationVariant === 'error'
                                        ? statusStyles.badgeError
                                        : statusStyles.badgeInfo,
                        ]}
                    >
                        <Text style={statusStyles.badgeText}>
                            {verificationLabel || 'Missing documents'}
                        </Text>
                    </View>
                    <View style={styles.chevronContainer}>
                        <Ionicons
                            name={expanded ? 'chevron-up' : 'chevron-down'}
                            size={16}
                            color="#0A292D"
                        />
                    </View>
                </View>


            </TouchableOpacity>

            {expanded && (
                <>
                    <View style={styles.formSection}>
                        {statusLoading ? (
                            <View style={statusStyles.loadingRow}>
                                <ActivityIndicator size="small" color="#00615E" />
                                <Text style={[styles.noticeText, statusStyles.loadingText]}>
                                    Loading verification status...
                                </Text>
                            </View>
                        ) : (
                            <View>
                                {/* <View style={statusStyles.statusRow}>
                                    <Text style={styles.inputLabel}>Identity status</Text>
                                    <View
                                        style={[
                                            statusStyles.badge,
                                            verificationVariant === 'success'
                                                ? statusStyles.badgeSuccess
                                                : verificationVariant === 'warning'
                                                    ? statusStyles.badgeWarning
                                                    : verificationVariant === 'error'
                                                        ? statusStyles.badgeError
                                                        : statusStyles.badgeInfo,
                                        ]}
                                    >
                                        <Text style={statusStyles.badgeText}>
                                            {verificationLabel || 'Not submitted'}
                                        </Text>
                                    </View>
                                </View> */}
                                {/* <Text style={styles.noticeText}>{verificationDescription}</Text> */}
                                {canSubmitVerfication && verificationStatus?.identity_verification_notes && (

                                    <Text style={[styles.noticeText, statusStyles.errorText]}>
                                        {verificationStatus.identity_verification_notes}
                                    </Text>
                                )}
                                <View style={statusStyles.statusMetaRow}>
                                    <Text style={[styles.noticeText, statusStyles.statusMetaText]}>
                                        Document:{' '}
                                        {verificationStatus?.identity_document_exists
                                            ? 'Uploaded'
                                            : 'Missing'}
                                    </Text>
                                    <Text style={[styles.noticeText, statusStyles.statusMetaText]}>
                                        Video:{' '}
                                        {verificationStatus?.identity_video_exists
                                            ? 'Uploaded'
                                            : 'Missing'}
                                    </Text>
                                </View>
                                {verifiedAtText && (
                                    <Text style={styles.noticeText}>
                                        Verified on {verifiedAtText}
                                        {/* {verificationStatus?.identity_verified_by
                                            ? ` by ${verificationStatus.identity_verified_by}`
                                            : ''} */}
                                    </Text>
                                )}
                            </View>
                        )}
                        {/* <View style={statusStyles.footerRow}>
                            <TouchableOpacity
                                style={statusStyles.resendButton}
                                onPress={handleResendVerificationEmail}
                                disabled={resendLoading}
                                activeOpacity={0.7}
                            >
                                {resendLoading ? (
                                    <ActivityIndicator size="small" color="#00615E" />
                                ) : (
                                    <Text style={statusStyles.resendText}>
                                        Resend verification email
                                    </Text>
                                )}
                            </TouchableOpacity>
                        </View> */}
                        {statusError && (
                            <Text style={[styles.noticeText, statusStyles.errorText]}>
                                {statusError}
                            </Text>
                        )}
                    </View>

                    {actionError && (
                        <Text style={[styles.noticeText, statusStyles.errorText]}>
                            {actionError}
                        </Text>
                    )}

                    {canSubmitVerfication && (<View style={styles.formSection}>
                        <Text style={styles.inputLabel}>Seller Profile</Text>
                        {selectedDocument ? (
                            <View style={styles.attachmentPreview}>
                                <View>
                                    <Text style={styles.attachmentPreviewText}>
                                        {selectedDocument.name}
                                    </Text>
                                    <Text style={styles.noticeText}>
                                        {selectedDocument.source === 'upload'
                                            ? 'Document uploaded'
                                            : 'Photo captured'}
                                    </Text>
                                </View>
                                <TouchableOpacity
                                    style={styles.attachmentPreviewAction}
                                    onPress={clearDocument}
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.attachmentPreviewText}>Change</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <View style={styles.attachmentButtonRow}>
                                <TouchableOpacity
                                    style={[
                                        styles.attachmentButton,
                                        { marginRight: 8 },
                                    ]}
                                    onPress={() => selectDocument('upload')}
                                    activeOpacity={0.7}
                                >
                                    <Ionicons
                                        name="document-text-outline"
                                        size={16}
                                        color="#00615E"
                                        style={styles.attachmentButtonIcon}
                                    />
                                    <Text style={styles.attachmentButtonText}>Select document</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.attachmentButton}
                                    onPress={() => selectDocument('camera')}
                                    activeOpacity={0.7}
                                >
                                    <Ionicons
                                        name="camera-outline"
                                        size={16}
                                        color="#00615E"
                                        style={styles.attachmentButtonIcon}
                                    />
                                    <Text style={styles.attachmentButtonText}>Take photo</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                        <Text style={styles.noticeText}>
                            Upload a clear photo (front view). (1 file)
                        </Text>
                    </View>)}

                    {canSubmitVerfication && (<View style={styles.formSection}>
                        <Text style={styles.inputLabelHigh}>Video selfie (3-5s)</Text>
                        <TouchableOpacity
                            style={styles.videoButton}
                            onPress={recordVideo}
                            activeOpacity={0.7}
                            disabled={recording}
                        >
                            <Ionicons
                                name="videocam"
                                size={18}
                                color="#FFFFFF"
                                style={{ marginRight: 8 }}
                            />
                            <Text style={styles.iconButtonText}>
                                {recording ? 'Recording...' : 'Record selfie'}
                            </Text>
                        </TouchableOpacity>
                        {recording && (
                            <Text style={styles.recordingText}>Recording in progress...</Text>
                        )}
                        {capturedVideo && !recording && (
                            <View style={styles.attachmentPreview}>
                                <View>
                                    <Text style={styles.attachmentPreviewText}>{capturedVideo.name}</Text>
                                    <Text style={styles.noticeText}>
                                        Duration: {capturedVideo.duration}
                                    </Text>
                                </View>
                                <TouchableOpacity
                                    style={styles.attachmentPreviewAction}
                                    onPress={clearCapturedVideo}
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.attachmentPreviewText}>Change</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                        <Text style={styles.noticeText}>
                            To confirm identity and prevent fraud.
                        </Text>
                    </View>)}

                    {canSubmitVerfication && (<View style={statusStyles.submitWrapper}>
                        <TouchableOpacity
                            style={[
                                statusStyles.submitButton,
                                submitDisabled
                                    ? statusStyles.submitButtonDisabled
                                    : statusStyles.submitButtonEnabled,
                            ]}
                            onPress={handleSubmitIdentityVerification}
                            activeOpacity={0.7}
                            disabled={submitDisabled}
                        >
                            {uploading ? (
                                <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                                <Text style={statusStyles.submitButtonText}>
                                    Submit identity verification
                                </Text>
                            )}
                        </TouchableOpacity>
                    </View>)}

                    <View style={styles.divider} />
                    <Text style={styles.noticeText}>
                        Your documents are used only for security (KYC). They are never published
                    </Text>
                </>
            )}
        </View>
    );
}

const statusStyles = StyleSheet.create({
    loadingRow: {
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        width: '100%',
    },
    loadingText: {
        textAlign: 'center',
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        flexWrap: 'wrap',
        gap: 8,
    },
    badge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
    },
    badgeText: {
        fontFamily: 'Inter',
        fontWeight: '600',
        fontSize: 12,
        color: '#004e4b',
    },
    badgeSuccess: {
        backgroundColor: '#E6F6F3',
        borderColor: '#0F796A',
    },
    badgeWarning: {
        backgroundColor: '#FFF7ED',
        borderColor: '#D97706',
    },
    badgeError: {
        backgroundColor: '#FEE2E2',
        borderColor: '#DC2626',
    },
    badgeInfo: {
        backgroundColor: '#E0F2FE',
        borderColor: '#0D6E99',
    },
    statusMetaRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginTop: 4,
        flexWrap: 'wrap',
        gap: 8,
    },
    statusMetaText: {
        flex: 1,
        flexWrap: 'wrap',
        minWidth: 120,
    },
    footerRow: {
        marginTop: 12,
        width: '100%',
    },
    resendButton: {
        alignSelf: 'flex-start',
        paddingVertical: 2,
    },
    resendText: {
        fontFamily: 'Inter',
        fontWeight: '600',
        fontSize: 14,
        color: '#00615E',
    },
    successText: {
        color: '#16a34a',
        marginTop: 4,
    },
    errorText: {
        color: '#dc2626',
        marginTop: 4,
    },
    submitWrapper: {
        marginTop: 12,
        width: '100%',
    },
    submitButton: {
        width: '100%',
        paddingVertical: 12,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    submitButtonEnabled: {
        backgroundColor: '#00615E',
    },
    submitButtonDisabled: {
        backgroundColor: '#D1D5DB',
    },
    submitButtonText: {
        fontFamily: 'Inter',
        fontWeight: '600',
        fontSize: 14,
        color: '#FFFFFF',
    },
});

type VerificationVariant = 'success' | 'warning' | 'error' | 'info';

const getVerificationVariant = (status?: string): VerificationVariant => {
    if (!status) {
        return 'info';
    }

    const normalized = status.toLowerCase();

    if (normalized.includes('reject')) {
        return 'error';
    }

    if (normalized.includes('pending')) {
        return 'warning';
    }

    if (normalized.includes('approve') || normalized.includes('verified')) {
        return 'success';
    }

    return 'info';
};

const getVerificationLabel = (status?: string): string => {
    if (!status) {
        return 'Not submitted';
    }

    const normalized = status.toLowerCase();

    if (normalized.includes('reject')) {
        return 'Rejected';
    }

    if (normalized.includes('pending')) {
        return 'Pending review';
    }

    if (normalized.includes('approve') || normalized.includes('verified')) {
        return 'Verified';
    }

    return status.charAt(0).toUpperCase() + status.slice(1);
};

const getVerificationDescription = (
    data?: SupplierVerificationStatus | null
): string => {
    if (!data || !data.identity_verification_status) {
        return 'Upload your identity documents and a selfie video so we can verify you.';
    }

    if (data.is_identity_verified) {
        return 'Your identity is verified.';
    }

    const normalized = data.identity_verification_status.toLowerCase();

    if (normalized.includes('pending')) {
        return 'We are reviewing the documents you provided. You will receive an update soon.';
    }

    if (normalized.includes('reject')) {
        return 'Your documents were rejected. Please upload new files to continue.';
    }

    return 'Documents have been submitted and are waiting for review.';
};

const formatVerifiedAt = (value?: string | null): string | null => {
    if (!value) {
        return null;
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleString();
};
