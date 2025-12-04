import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, KeyboardAvoidingView, Platform, ViewStyle, TextStyle, ImageStyle, Alert } from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from 'react-i18next';
import { theme } from '@/theme';
import { useRequireAuth } from '@/shared/hooks/useRequireAuth';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { updateProfileThunk } from '@/store/slices/authSlice';
import { DatePickerInput } from '@/shared/components/DatePickerInput';
import { useToast } from '@/shared/components/Toast';
import { AvatarImage } from '@/shared/components/LazyImage';

// Component for editable fields - defined outside to prevent re-creation on each render
const EditableField: React.FC<{
    label: string;
    value: string;
    onChangeText: (text: string) => void;
    placeholder?: string;
    keyboardType?: 'default' | 'email-address' | 'phone-pad';
    error?: string;
    required?: boolean;
    secureTextEntry?: boolean;
    textContentType?: 'none' | 'password' | 'newPassword' | 'emailAddress' | 'name';
    autoComplete?: 'off' | 'password' | 'password-new' | 'email' | 'name';
}> = ({ 
    label, 
    value, 
    onChangeText, 
    placeholder, 
    keyboardType = 'default', 
    error, 
    required = false, 
    secureTextEntry = false,
    textContentType,
    autoComplete
}) => (
    <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>
            {label} {required && <Text style={styles.required}>*</Text>}
        </Text>
        <TextInput
            style={[styles.fieldInput, error && styles.fieldInputError]}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder || label}
            placeholderTextColor={theme.colors.text.secondary}
            keyboardType={keyboardType}
            secureTextEntry={secureTextEntry}
            autoCapitalize="none"
            textContentType={textContentType}
            autoComplete={autoComplete}
        />
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
);

// Component for read-only info items
const InfoItem: React.FC<{ label: string; value: string | undefined }> = ({ label, value }) => (
    <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value || 'Not provided'}</Text>
    </View>
);

export const AccountInformationScreen: React.FC = () => {
    const { t } = useTranslation();
    const { user, isLoading } = useRequireAuth();
    const dispatch = useAppDispatch();
    const { isLoading: isUpdating } = useAppSelector(state => state.auth);
    const { showToast } = useToast();

    // Form state
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
    const [dateOfBirth, setDateOfBirth] = useState<Date | undefined>(undefined);
    const [subscribeNewsletter, setSubscribeNewsletter] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    
    // Password change state
    const [isPasswordSectionExpanded, setIsPasswordSectionExpanded] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    
    // Error state
    const [errors, setErrors] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        gender: '',
        image: '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    // Initialize form with user data
    useEffect(() => {
        if (user) {
            // Split name into first and last if needed
            const nameParts = user.name?.split(' ') || [];
            setFirstName(user.first_name || nameParts[0] || '');
            setLastName(user.last_name || nameParts.slice(1).join(' ') || '');
            setEmail(user.email || '');
            setPhone(user.phone || '');
            setGender((user.gender as 'Male' | 'Female' | 'Other') || 'Male');
            if (user.date_of_birth) {
                setDateOfBirth(new Date(user.date_of_birth));
            }
            setSubscribeNewsletter(user.subscribed_to_news_letter || false);
        }
    }, [user]);

    const pickImage = async () => {
        // Request permissions
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        
        if (permissionResult.granted === false) {
            Alert.alert(t('account.permissionRequired'), t('account.cameraPermissionMessage'));
            return;
        }

        // Launch image picker with optimized settings
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5, // Reduced quality for faster upload (0.5 = 50%)
            base64: false,
            exif: false,
        });

        if (!result.canceled && result.assets[0]) {
            const asset = result.assets[0];
            
            // Validate file type
            const fileExtension = asset.uri.split('.').pop()?.toLowerCase();
            const validExtensions = ['jpg', 'jpeg', 'png', 'bmp', 'webp'];
            
            if (!validExtensions.includes(fileExtension || '')) {
                setErrors(prev => ({
                    ...prev,
                    image: t('account.invalidImageFormat'),
                }));
                return;
            }

            // Check file size (optional - warn if too large)
            if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) { // 5MB
                Alert.alert(
                    t('account.largeImage'),
                    t('account.largeImageMessage'),
                    [
                        { text: t('common.cancel'), style: 'cancel' },
                        { text: t('account.continue'), onPress: () => {
                            setSelectedImage(asset.uri);
                            setErrors(prev => ({ ...prev, image: '' }));
                        }}
                    ]
                );
                return;
            }
            
            setSelectedImage(asset.uri);
            setErrors(prev => ({ ...prev, image: '' }));
        }
    };

    if (isLoading) {
        return (
            <>
                <Stack.Screen options={{ title: 'Account Information', headerBackTitle: 'Back' }} />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.colors.primary[500]} />
                </View>
            </>
        );
    }

    if (!user) {
        return null;
    }

    const validateForm = () => {
        const newErrors = {
            firstName: '',
            lastName: '',
            email: '',
            phone: '',
            gender: '',
            image: '',
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
        };

        let isValid = true;

        if (!firstName.trim()) {
            newErrors.firstName = t('account.firstNameRequired');
            isValid = false;
        }

        if (!lastName.trim()) {
            newErrors.lastName = t('account.lastNameRequired');
            isValid = false;
        }

        if (!email.trim()) {
            newErrors.email = t('account.emailRequired');
            isValid = false;
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            newErrors.email = t('account.emailInvalid');
            isValid = false;
        }

        if (!gender) {
            newErrors.gender = t('account.genderRequired');
            isValid = false;
        }

            // Validate password fields if password section is expanded and any password field has value
        if (isPasswordSectionExpanded && (currentPassword || newPassword || confirmPassword)) {
            if (!currentPassword.trim()) {
                newErrors.currentPassword = t('account.currentPasswordRequired', 'Current password is required');
                isValid = false;
            }

            if (!newPassword.trim()) {
                newErrors.newPassword = t('account.newPasswordRequired', 'New password is required');
                isValid = false;
            } else if (newPassword.length < 6) {
                newErrors.newPassword = t('account.passwordMinLength', 'Password must be at least 6 characters');
                isValid = false;
            }

            if (!confirmPassword.trim()) {
                newErrors.confirmPassword = t('account.confirmPasswordRequired', 'Please confirm your password');
                isValid = false;
            } else if (newPassword !== confirmPassword) {
                newErrors.confirmPassword = t('account.passwordMismatch', 'Passwords do not match');
                isValid = false;
            }
        }

        setErrors(newErrors);
        return isValid;
    };

    const handleSave = async () => {
        // Clear previous errors
        setErrors({
            firstName: '',
            lastName: '',
            email: '',
            phone: '',
            gender: '',
            image: '',
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
        });

        // Validate form
        if (!validateForm()) {
            return;
        }

        setIsSaving(true);
        try {
            // Format date of birth
            const dobString = dateOfBirth 
                ? dateOfBirth.toISOString().split('T')[0] 
                : undefined;

            // Prepare update data
            const updateData: any = {
                first_name: firstName.trim(),
                last_name: lastName.trim(),
                email: email.trim(),
                phone: user.phone || '',//phone.trim(),
                gender: gender,
                date_of_birth: dobString,
                subscribed_to_news_letter: subscribeNewsletter,
            };

            // Include password fields if changing password
            if (isPasswordSectionExpanded && currentPassword && newPassword) {
                updateData.current_password = currentPassword;
                updateData.new_password = newPassword;
                updateData.new_password_confirmation = confirmPassword;
            }

            // Only include image if a new one is selected
            if (selectedImage) {
                const filename = selectedImage.split('/').pop() || 'profile.jpg';
                const match = /\.(\w+)$/.exec(filename);
                const type = match ? `image/${match[1]}` : 'image/jpeg';
                
                updateData.image = {
                    uri: selectedImage,
                    name: filename,
                    type: type,
                };
            }

            // Update profile
            const result = await dispatch(updateProfileThunk(updateData)).unwrap();

            // Clear selected image only after we confirm the user data is updated
            // The Redux store should now have the updated user with new avatar
            if (result.user) {
                setSelectedImage(null);
                
                // Clear password fields and collapse section after successful password change
                if (isPasswordSectionExpanded && currentPassword && newPassword) {
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                    setIsPasswordSectionExpanded(false);
                }
            }
            
            // Show success toast
            const successMessage = (isPasswordSectionExpanded && currentPassword && newPassword)
                ? t('account.profileAndPasswordUpdated', 'Profile and password updated successfully')
                : t('account.profileUpdated', 'Profile updated successfully');
            
            showToast({
                message: successMessage,
                type: 'success',
                duration: 3000,
            });
        } catch (error: any) {
            // Set general error or specific field errors from API
            const errorMessage = typeof error === 'string' ? error : error?.message || 'Failed to update profile';
            
            // Show error toast
            showToast({
                message: errorMessage,
                type: 'error',
                duration: 4000,
            });
            
            // Also set specific field errors if applicable
            setErrors(prev => ({
                ...prev,
                email: errorMessage.includes('email') ? errorMessage : prev.email,
                phone: errorMessage.includes('phone') ? errorMessage : prev.phone,
                image: errorMessage.includes('image') ? errorMessage : prev.image,
                currentPassword: errorMessage.includes('password') && errorMessage.includes('current') ? errorMessage : prev.currentPassword,
                newPassword: errorMessage.includes('password') && errorMessage.includes('new') ? errorMessage : prev.newPassword,
            }));
        } finally {
            setIsSaving(false);
        }
    };

    // Get initials from first name and last name
    const getInitials = () => {
        const firstInitial = firstName?.charAt(0)?.toUpperCase() || '';
        const lastInitial = lastName?.charAt(0)?.toUpperCase() || '';
        return firstInitial + lastInitial;
    };

    const initials = getInitials();
    const hasAvatar = user.avatar && user.avatar !== '';
    const displayImage = selectedImage || user.avatar;

    return (
        <>
            <Stack.Screen options={{ title: t('account.accountInfo'), headerBackTitle: t('common.back') }} />
            <KeyboardAvoidingView 
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={100}
            >
                <ScrollView 
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                <View style={styles.header}>
                    <View style={styles.avatarContainer}>
                            {displayImage ? (
                                <AvatarImage
                                    imageUrl={displayImage}
                                    style={styles.avatar}
                                    size={100}
                                />
                            ) : (
                                <View style={styles.avatarPlaceholder}>
                                    <Text style={styles.avatarInitials}>{initials}</Text>
                                </View>
                            )}
                            <TouchableOpacity 
                                style={styles.editAvatarButton}
                                onPress={pickImage}
                            >
                            <Ionicons name="camera" size={20} color={theme.colors.white} />
                        </TouchableOpacity>
                    </View>
                        {errors.image ? <Text style={styles.errorText}>{errors.image}</Text> : null}
                    <Text style={styles.email}>{user.phone || user.email}</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t('account.personalDetails')}</Text>
                        
                        <EditableField 
                            label={t('account.firstName')} 
                            value={firstName}
                            onChangeText={setFirstName}
                            placeholder={t('account.enterFirstName')}
                            error={errors.firstName}
                            required
                        />
                        
                        <EditableField 
                            label={t('account.lastName')} 
                            value={lastName}
                            onChangeText={setLastName}
                            placeholder={t('account.enterLastName')}
                            error={errors.lastName}
                            required
                        />
                        
                        <EditableField 
                            label={t('account.emailAddress')} 
                            value={email}
                            onChangeText={setEmail}
                            placeholder={t('account.enterEmail')}
                            keyboardType="email-address"
                            error={errors.email}
                            required
                        />
                        
                        {/* <EditableField 
                            label="Phone Number" 
                            value={phone}
                            onChangeText={setPhone}
                            placeholder="Enter phone number"
                            keyboardType="phone-pad"
                            error={errors.phone}
                            required
                        /> */}
                        
                        {/* Gender Selector */}
                        <View style={styles.fieldContainer}>
                            <Text style={styles.fieldLabel}>
                                {t('account.gender')} <Text style={styles.required}>*</Text>
                            </Text>
                            <View style={styles.genderContainer}>
                                {(['Male', 'Female', 'Other'] as const).map((option) => (
                                    <TouchableOpacity
                                        key={option}
                                        style={[
                                            styles.genderOption,
                                            gender === option && styles.genderOptionActive
                                        ]}
                                        onPress={() => setGender(option)}
                                        activeOpacity={0.7}
                                    >
                                        <Text style={[
                                            styles.genderOptionText,
                                            gender === option && styles.genderOptionTextActive
                                        ]}>
                                            {t(`account.${option.toLowerCase()}`)}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                            {errors.gender ? <Text style={styles.errorText}>{errors.gender}</Text> : null}
                        </View>

                        {/* Date of Birth Picker */}
                        <DatePickerInput
                            label={t('account.dateOfBirth')}
                            value={dateOfBirth}
                            onChange={setDateOfBirth}
                            placeholder={t('account.selectDateOfBirth')}
                            maximumDate={new Date()}
                        />

                        
                        {/* Newsletter Checkbox */}
                        <TouchableOpacity 
                            style={styles.checkboxContainer}
                            onPress={() => setSubscribeNewsletter(!subscribeNewsletter)}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.checkbox, subscribeNewsletter && styles.checkboxChecked]}>
                                {subscribeNewsletter && (
                                    <Ionicons name="checkmark" size={18} color={theme.colors.white} />
                                )}
                            </View>
                            <Text style={styles.checkboxLabel}>{t('account.subscribeNewsletter')}</Text>
                        </TouchableOpacity>

                        <InfoItem 
                            label={t('account.memberSince')} 
                            value={user.created_at ? new Date(user.created_at).toLocaleDateString() : undefined} 
                        />
                </View>

                {/* Password Change Section */}
                <View style={styles.passwordSection}>
                    <TouchableOpacity 
                        style={styles.sectionHeaderButton}
                        onPress={() => setIsPasswordSectionExpanded(!isPasswordSectionExpanded)}
                        activeOpacity={0.7}
                    >
                        <View style={styles.sectionHeaderLeft}>
                            <Ionicons name="lock-closed-outline" size={22} color={theme.colors.text.primary} />
                            <Text style={styles.sectionTitle}>{t('account.changePassword', 'Change Password')}</Text>
                        </View>
                        <Ionicons 
                            name={isPasswordSectionExpanded ? "chevron-up" : "chevron-down"} 
                            size={22} 
                            color={theme.colors.text.secondary} 
                        />
                    </TouchableOpacity>

                    {isPasswordSectionExpanded && (
                        <View style={styles.passwordFields}>
                            <EditableField 
                                label={t('account.currentPassword', 'Current Password')} 
                                value={currentPassword}
                                onChangeText={setCurrentPassword}
                                placeholder={t('account.enterCurrentPassword', 'Enter current password')}
                                error={errors.currentPassword}
                                required
                                secureTextEntry
                                textContentType="password"
                                autoComplete="password"
                            />
                            
                            <EditableField 
                                label={t('account.newPassword', 'New Password')} 
                                value={newPassword}
                                onChangeText={setNewPassword}
                                placeholder={t('account.enterNewPassword', 'Enter new password')}
                                error={errors.newPassword}
                                required
                                secureTextEntry
                                textContentType="none"
                                autoComplete="off"
                            />
                            
                            <EditableField 
                                label={t('account.confirmPassword', 'Confirm Password')} 
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                placeholder={t('account.enterConfirmPassword', 'Re-enter new password')}
                                error={errors.confirmPassword}
                                required
                                secureTextEntry
                                textContentType="none"
                                autoComplete="off"
                            />

                            <Text style={styles.passwordHint}>
                                {t('account.passwordHint', 'Password must be at least 6 characters')}
                            </Text>
                        </View>
                    )}
                </View>

                    {/* Add spacing for fixed button */}
                    <View style={{ height: 100 }} />
            </ScrollView>

                {/* Fixed Save Button */}
                <View style={styles.fixedButtonContainer}>
                    <TouchableOpacity 
                        style={[styles.saveButton, (isSaving || isUpdating) && styles.saveButtonDisabled]}
                        onPress={handleSave}
                        disabled={isSaving || isUpdating}
                        activeOpacity={0.8}
                    >
                        {(isSaving || isUpdating) ? (
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <ActivityIndicator size="small" color={theme.colors.white} />
                                <Text style={[styles.saveButtonText, { marginLeft: 8 }]}>
                                    {selectedImage ? t('account.uploadingImage') : t('account.saving')}
                                </Text>
                            </View>
                        ) : (
                            <>
                                <Ionicons name="save-outline" size={20} color={theme.colors.white} style={{ marginRight: 8 }} />
                                <Text style={styles.saveButtonText}>{t('account.saveChanges')}</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </>
    );
};

const styles = StyleSheet.create<{
    container: ViewStyle;
    scrollView: ViewStyle;
    scrollContent: ViewStyle;
    loadingContainer: ViewStyle;
    header: ViewStyle;
    avatarContainer: ViewStyle;
    avatar: ImageStyle;
    avatarPlaceholder: ViewStyle;
    avatarInitials: TextStyle;
    editAvatarButton: ViewStyle;
    name: TextStyle;
    email: TextStyle;
    section: ViewStyle;
    passwordSection: ViewStyle;
    sectionTitle: TextStyle;
    sectionHeaderButton: ViewStyle;
    sectionHeaderLeft: ViewStyle;
    passwordFields: ViewStyle;
    passwordHint: TextStyle;
    fieldContainer: ViewStyle;
    fieldLabel: TextStyle;
    required: TextStyle;
    fieldInput: TextStyle;
    fieldInputError: TextStyle;
    errorText: TextStyle;
    infoValue: TextStyle;
    checkboxContainer: ViewStyle;
    checkbox: ViewStyle;
    checkboxChecked: ViewStyle;
    checkboxLabel: TextStyle;
    genderContainer: ViewStyle;
    genderOption: ViewStyle;
    genderOptionActive: ViewStyle;
    genderOptionText: TextStyle;
    genderOptionTextActive: TextStyle;
    menuItem: ViewStyle;
    menuItemText: TextStyle;
    fixedButtonContainer: ViewStyle;
    saveButton: ViewStyle;
    saveButtonDisabled: ViewStyle;
    saveButtonText: TextStyle;
}>({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background.default,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: theme.spacing.xl,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.background.default,
    },
    header: {
        alignItems: 'center',
        padding: theme.spacing.xl,
        backgroundColor: theme.colors.white,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.gray[200],
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: theme.spacing.md,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: theme.colors.gray[200],
    },
    avatarPlaceholder: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: theme.colors.gray[200],
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarInitials: {
        fontSize: 36,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.primary[500],
        textTransform: 'uppercase',
    },
    editAvatarButton: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: theme.colors.primary[500],
        padding: 8,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: theme.colors.white,
    },
    name: {
        fontSize: theme.typography.fontSize['2xl'],
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.text.primary,
        marginBottom: 4,
    },
    email: {
        fontSize: theme.typography.fontSize.md,
        color: theme.colors.text.secondary,
    },
    section: {
        marginTop: theme.spacing.lg,
        backgroundColor: theme.colors.white,
        paddingVertical: theme.spacing.lg,
        paddingHorizontal: theme.spacing.lg,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: theme.colors.gray[200],
    },
    passwordSection: {
        marginTop: theme.spacing.lg,
        backgroundColor: theme.colors.white,
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.lg,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: theme.colors.gray[200],
    },
    sectionTitle: {
        fontSize: theme.typography.fontSize.lg,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.text.primary,
        marginBottom: 0,
        marginLeft: theme.spacing.sm,
    },
    sectionHeaderButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: theme.spacing.xs,
        marginBottom: 0,
    },
    sectionHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
    },
    passwordFields: {
        marginTop: theme.spacing.md,
        paddingTop: theme.spacing.md,
        borderTopWidth: 1,
        borderTopColor: theme.colors.gray[200],
    },
    passwordHint: {
        fontSize: theme.typography.fontSize.xs,
        color: theme.colors.text.secondary,
        fontStyle: 'italic',
        marginTop: theme.spacing.sm,
    },
    fieldContainer: {
        marginBottom: theme.spacing.lg,
    },
    fieldLabel: {
        fontSize: theme.typography.fontSize.sm,
        fontWeight: theme.typography.fontWeight.medium,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.xs,
    },
    required: {
        color: '#EF4444',
        fontWeight: theme.typography.fontWeight.bold,
    },
    fieldInput: {
        fontSize: theme.typography.fontSize.md,
        color: theme.colors.text.primary,
        paddingVertical: theme.spacing.sm,
        paddingHorizontal: theme.spacing.md,
        borderWidth: 1,
        borderColor: theme.colors.gray[300],
        borderRadius: theme.borderRadius.md,
        backgroundColor: theme.colors.white,
    },
    fieldInputError: {
        borderColor: '#EF4444',
    },
    errorText: {
        fontSize: theme.typography.fontSize.xs,
        color: '#EF4444',
        marginTop: theme.spacing.xs,
    },
    infoValue: {
        fontSize: theme.typography.fontSize.md,
        color: theme.colors.text.secondary,
        paddingVertical: theme.spacing.sm,
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.spacing.lg,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 4,
        borderWidth: 2,
        borderColor: theme.colors.gray[400],
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: theme.spacing.md,
    },
    checkboxChecked: {
        backgroundColor: theme.colors.primary[500],
        borderColor: theme.colors.primary[500],
    },
    checkboxLabel: {
        fontSize: theme.typography.fontSize.md,
        color: theme.colors.text.primary,
        fontWeight: theme.typography.fontWeight.medium,
    },
    genderContainer: {
        flexDirection: 'row',
        gap: theme.spacing.sm,
    },
    genderOption: {
        flex: 1,
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.sm,
        borderRadius: theme.borderRadius.md,
        borderWidth: 1,
        borderColor: theme.colors.gray[300],
        backgroundColor: theme.colors.white,
        alignItems: 'center',
    },
    genderOptionActive: {
        backgroundColor: theme.colors.primary[500],
        borderColor: theme.colors.primary[500],
    },
    genderOptionText: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.text.primary,
        fontWeight: theme.typography.fontWeight.medium,
    },
    genderOptionTextActive: {
        color: theme.colors.white,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.gray[100],
    },
    menuItemText: {
        flex: 1,
        marginLeft: theme.spacing.md,
        fontSize: theme.typography.fontSize.md,
        color: theme.colors.text.primary,
    },
    fixedButtonContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: theme.colors.white,
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
        borderTopWidth: 1,
        borderTopColor: theme.colors.gray[200],
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: -2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 5,
    },
    saveButton: {
        backgroundColor: theme.colors.primary[500],
        paddingVertical: theme.spacing.md,
        borderRadius: theme.borderRadius.lg,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    saveButtonDisabled: {
        backgroundColor: theme.colors.gray[400],
        shadowOpacity: 0,
        elevation: 0,
    },
    saveButtonText: {
        color: theme.colors.white,
        fontSize: theme.typography.fontSize.md,
        fontWeight: theme.typography.fontWeight.bold,
    },
});
