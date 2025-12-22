import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Alert,
    Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { theme } from '@/theme';
import { useToast } from '@/shared/components/Toast';
import { useRequireAuth } from '@/shared/hooks/useRequireAuth';
import { suppliersApi, RFQProduct } from '@/services/api/suppliers.api';
import { Input } from '@/shared/components/Input';
import { Button } from '@/shared/components/Button';
import { ProductCard } from '@/features/home/components/ProductCard';
import { Product } from '@/features/product/types/product.types';

export const RFQScreen: React.FC = () => {
    const { t } = useTranslation();
    const router = useRouter();
    const { showToast } = useToast();
    const { supplierId, productId, productName } = useLocalSearchParams<{
        supplierId: string;
        productId?: string;
        productName?: string;
    }>();
    const { user, isAuthenticated } = useRequireAuth();

    // Quote Info
    const [quoteTitle, setQuoteTitle] = useState('');
    const [quoteBrief, setQuoteBrief] = useState('');

    // Contact Info
    const [name, setName] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [address, setAddress] = useState('');
    const [contactNumber, setContactNumber] = useState('');

    // Products
    const [products, setProducts] = useState<RFQProduct[]>([]);

    // Global product search state (for adding products)
    const [globalProductSearch, setGlobalProductSearch] = useState('');
    const [productSearchResults, setProductSearchResults] = useState<Array<{
        id: number;
        sku: string;
        name: string;
        price: number;
        formated_price: string;
        base_image: string | null;
        parent_id: number | null;
        is_config: number;
    }>>([]);
    const [isSearchingProducts, setIsSearchingProducts] = useState(false);
    const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Attachments
    const [contactAttachment, setContactAttachment] = useState<{ uri: string; name: string } | null>(null); // Single file for contact section
    const [productImages, setProductImages] = useState<string[]>([]); // Image URIs for product information section

    // Form state
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    // Load user info if authenticated
    useEffect(() => {
        if (user) {
            setName(user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.name || '');
            setCompanyName(user.company_name || '');
            if (user.default_address) {
                setAddress(
                    [
                        user.default_address.address1,
                        user.default_address.address2,
                        user.default_address.city,
                        user.default_address.state,
                    ]
                        .filter(Boolean)
                        .join(', ')
                );
                setContactNumber(user.default_address.phone || '');
            }
        }
    }, [user]);

    // Pre-populate product if productId and productName are provided
    useEffect(() => {
        if (productId && productName && products.length === 0) {
            setProducts([{
                product_id: parseInt(productId),
                product_name: productName,
                quantity: 1,
                description: '',
                price_per_quantity: null,
                is_sample: false,
            }]);
        }
    }, [productId, productName]);

    const validateForm = (): boolean => {
        const newErrors: { [key: string]: string } = {};

        if (!quoteTitle.trim()) {
            newErrors.quoteTitle = t('rfq.errors.quoteTitleRequired', 'Quote title is required');
        }

        if (!quoteBrief.trim()) {
            newErrors.quoteBrief = t('rfq.errors.quoteBriefRequired', 'Quote description is required');
        }

        if (!name.trim()) {
            newErrors.name = t('rfq.errors.nameRequired', 'Name is required');
        }

        if (!companyName.trim()) {
            newErrors.companyName = t('rfq.errors.companyNameRequired', 'Company name is required');
        }

        if (!address.trim()) {
            newErrors.address = t('rfq.errors.addressRequired', 'Address is required');
        }

        if (!contactNumber.trim()) {
            newErrors.contactNumber = t('rfq.errors.contactNumberRequired', 'Contact number is required');
        }

        // Validate products - require at least one product with valid product_id
        if (products.length === 0) {
            newErrors.products = t('rfq.errors.productsRequired', 'Please add at least one product from the catalog');
        }

        products.forEach((product, index) => {
            if (!product.product_id) {
                newErrors[`product_${index}_id`] = t('rfq.errors.productSelectionRequired', 'Invalid product - please remove and select from catalog');
            }
            if (!product.quantity || product.quantity < 1) {
                newErrors[`product_${index}_quantity`] = t('rfq.errors.quantityRequired', 'Quantity must be at least 1');
            }
        });

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Removed handleAddProduct - products are now added only via search selection

    const handleRemoveProduct = (index: number) => {
        setProducts(products.filter((_, i) => i !== index));
        // Clear any validation errors for this product
        const newErrors = { ...errors };
        delete newErrors[`product_${index}_id`];
        delete newErrors[`product_${index}_quantity`];
        setErrors(newErrors);
    };

    const handleProductChange = (index: number, field: keyof RFQProduct, value: any) => {
        const updatedProducts = [...products];
        updatedProducts[index] = {
            ...updatedProducts[index],
            [field]: value,
        };
        setProducts(updatedProducts);

        // Clear validation error for this field
        if (field === 'quantity' && errors[`product_${index}_quantity`]) {
            const newErrors = { ...errors };
            delete newErrors[`product_${index}_quantity`];
            setErrors(newErrors);
        }
    };

    const handleGlobalProductSearch = useCallback((query: string) => {
        setGlobalProductSearch(query);

        // Clear previous timeout
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        // Debounce search
        searchTimeoutRef.current = setTimeout(async () => {
            if (!query || query.length < 2 || !supplierId) {
                setProductSearchResults([]);
                setIsSearchingProducts(false);
                return;
            }

            setIsSearchingProducts(true);
            try {
                const results = await suppliersApi.searchRFQProducts(query, Number(supplierId));
                setProductSearchResults(results);
            } catch (error: any) {
                setProductSearchResults([]);
            } finally {
                setIsSearchingProducts(false);
            }
        }, 300);
    }, [supplierId]);

    const handleSelectProduct = (product: typeof productSearchResults[0]) => {
        // Check if product is already added
        const isDuplicate = products.some(p => p.product_id === product.id);

        if (isDuplicate) {
            showToast({
                message: t('rfq.productAlreadyAdded', 'This product is already added to the quote'),
                type: 'warning',
            });
            setProductSearchResults([]);
            setGlobalProductSearch('');
            return;
        }

        // Add new product to list
        setProducts([
            ...products,
            {
                product_id: product.id,
                product_name: product.name,
                quantity: 1,
                description: '',
                price_per_quantity: product.price,
                is_sample: false,
            },
        ]);
        setProductSearchResults([]);
        setGlobalProductSearch('');

        // Clear products validation error if it exists
        if (errors.products) {
            const newErrors = { ...errors };
            delete newErrors.products;
            setErrors(newErrors);
        }
    };

    // Handle contact attachment picker (single select)
    const handlePickContactAttachment = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: '*/*',
                copyToCacheDirectory: true,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const asset = result.assets[0];
                const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB in bytes

                // Check file size
                if (asset.size && asset.size > MAX_FILE_SIZE) {
                    const fileSizeMB = (asset.size / (1024 * 1024)).toFixed(2);
                    showToast({
                        message: t(
                            'rfq.fileTooLarge',
                            `The file "${asset.name || 'attachment'}" (${fileSizeMB}MB) exceeds the 2MB limit. Please compress or use a smaller file.`
                        ),
                        type: 'error',
                    });
                    return;
                }

                setContactAttachment({
                    uri: asset.uri,
                    name: asset.name || 'attachment',
                });

                showToast({
                    message: t('rfq.attachmentAdded', 'Attachment added successfully'),
                    type: 'success',
                });
            }
        } catch (error: any) {
            showToast({
                message: error.message || t('rfq.attachmentError', 'Failed to pick attachment'),
                type: 'error',
            });
        }
    };

    const handleRemoveContactAttachment = () => {
        setContactAttachment(null);
    };

    // Handle product image/video picker (for product information section)
    const handlePickProductImages = async () => {
        try {
            // Request permissions
            const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (!permissionResult.granted) {
                showToast({
                    message: t('rfq.permissionDenied', 'Permission to access media library is required'),
                    type: 'error',
                });
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.All,
                allowsMultipleSelection: true,
                quality: 0.8,
                exif: false,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB in bytes
                const validImages: string[] = [];
                const invalidFiles: string[] = [];

                for (const asset of result.assets) {
                    // Check file size (fileSize is in bytes)
                    if (asset.fileSize && asset.fileSize > MAX_FILE_SIZE) {
                        const fileName = asset.fileName || 'file';
                        const fileSizeMB = (asset.fileSize / (1024 * 1024)).toFixed(2);
                        invalidFiles.push(`${fileName} (${fileSizeMB}MB)`);
                    } else {
                        validImages.push(asset.uri);
                    }
                }

                // Show error for files that are too large
                if (invalidFiles.length > 0) {
                    showToast({
                        message: t(
                            'rfq.fileTooLarge',
                            `The following files exceed the 2MB limit: ${invalidFiles.join(', ')}. Please compress or resize them.`
                        ),
                        type: 'error',
                    });
                }

                // Add only valid images
                if (validImages.length > 0) {
                    setProductImages([...productImages, ...validImages]);
                    if (invalidFiles.length === 0) {
                        showToast({
                            message: t('rfq.imagesAdded', `${validImages.length} image(s) added successfully`),
                            type: 'success',
                        });
                    }
                }
            }
        } catch (error: any) {
            showToast({
                message: error.message || t('rfq.imageError', 'Failed to pick image'),
                type: 'error',
            });
        }
    };

    const handleRemoveProductImage = (imageIndex: number) => {
        setProductImages(productImages.filter((_, i) => i !== imageIndex));
    };

    const handleSubmit = async () => {
        if (!isAuthenticated) {
            showToast({
                message: t('rfq.loginRequired', 'Please login to submit RFQ'),
                type: 'warning',
            });
            router.push('/login');
            return;
        }

        if (!validateForm()) {
            showToast({
                message: t('rfq.validationError', 'Please fill in all required fields'),
                type: 'error',
            });
            return;
        }

        // Validate file sizes before submitting
        const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB in bytes

        try {
            // Check product images
            for (let i = 0; i < productImages.length; i++) {
                const imageUri = productImages[i];
                const fileInfo = await FileSystem.getInfoAsync(imageUri);
                if (fileInfo.exists && fileInfo.size && fileInfo.size > MAX_FILE_SIZE) {
                    const fileSizeMB = (fileInfo.size / (1024 * 1024)).toFixed(2);
                    showToast({
                        message: t(
                            'rfq.fileTooLarge',
                            `Image ${i + 1} (${fileSizeMB}MB) exceeds the 2MB limit. Please remove or compress it before submitting.`
                        ),
                        type: 'error',
                    });
                    setIsSubmitting(false);
                    return;
                }
            }

            // Check contact attachment
            if (contactAttachment) {
                const fileInfo = await FileSystem.getInfoAsync(contactAttachment.uri);
                if (fileInfo.exists && fileInfo.size && fileInfo.size > MAX_FILE_SIZE) {
                    const fileSizeMB = (fileInfo.size / (1024 * 1024)).toFixed(2);
                    showToast({
                        message: t(
                            'rfq.fileTooLarge',
                            `The attachment "${contactAttachment.name}" (${fileSizeMB}MB) exceeds the 2MB limit. Please remove or compress it before submitting.`
                        ),
                        type: 'error',
                    });
                    setIsSubmitting(false);
                    return;
                }
            }
        } catch (error: any) {
            // If file size check fails, continue (server will validate anyway)
        }

        setIsSubmitting(true);

        try {
            // Filter out products without product_id (safety check)
            const validProducts = products.filter(p => p.product_id !== null && p.product_id !== undefined);

            if (validProducts.length === 0) {
                showToast({
                    message: t('rfq.noValidProducts', 'Please select at least one product from the catalog'),
                    type: 'error',
                });
                setIsSubmitting(false);
                return;
            }

            const payload = {
                supplier_id: Number(supplierId),
                quote_title: quoteTitle.trim(),
                quote_brief: quoteBrief.trim(),
                name: name.trim(),
                company_name: companyName.trim(),
                address: address.trim(),
                contact_number: contactNumber.trim(),
                products: validProducts, // Only send products with valid product_id
            };

            // Extract file info from contact attachment (single file)
            const attachmentFiles = contactAttachment ? [contactAttachment] : undefined;

            const response = await suppliersApi.submitRFQ(
                payload,
                productImages.length > 0 ? productImages : undefined,
                attachmentFiles
            );

            if (response.success) {
                showToast({
                    message: response.message || t('rfq.success', 'RFQ submitted successfully'),
                    type: 'success',
                });
                router.back();
            } else {
                showToast({
                    message: response.message || t('rfq.error', 'Failed to submit RFQ'),
                    type: 'error',
                });
            }
        } catch (error: any) {
            showToast({
                message: error.message || t('rfq.error', 'Failed to submit RFQ'),
                type: 'error',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea} edges={['top']}>
            <KeyboardAvoidingView
                style={styles.keyboardContainer}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>
                        {t('rfq.title', 'Request for Quote')}
                    </Text>
                    <View style={styles.headerRight} />
                </View>

                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Quote Info Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>
                            {t('rfq.quoteInfo', 'Quote Information')}
                        </Text>

                        <Input
                            label={t('rfq.quoteTitle', 'Quote Title')}
                            placeholder={t('rfq.quoteTitlePlaceholder', 'Enter quote title')}
                            value={quoteTitle}
                            onChangeText={(text) => {
                                setQuoteTitle(text);
                                if (errors.quoteTitle) {
                                    setErrors({ ...errors, quoteTitle: '' });
                                }
                            }}
                            error={errors.quoteTitle}
                        />

                        <View style={styles.textAreaContainer}>
                            <Text style={styles.label}>
                                {t('rfq.quoteBrief', 'Quote Description')} <Text style={styles.required}>*</Text>
                            </Text>
                            <TextInput
                                style={[styles.textArea, errors.quoteBrief && styles.textAreaError]}
                                placeholder={t('rfq.quoteBriefPlaceholder', 'Enter quote description')}
                                placeholderTextColor={theme.colors.text.secondary}
                                value={quoteBrief}
                                onChangeText={(text) => {
                                    setQuoteBrief(text);
                                    if (errors.quoteBrief) {
                                        setErrors({ ...errors, quoteBrief: '' });
                                    }
                                }}
                                multiline
                                numberOfLines={4}
                                textAlignVertical="top"
                            />
                            {errors.quoteBrief && (
                                <Text style={styles.error}>{errors.quoteBrief}</Text>
                            )}
                        </View>
                    </View>

                    {/* Contact Info Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>
                            {t('rfq.contactInfo', 'Contact Information')}
                        </Text>

                        <Input
                            label={t('rfq.name', 'Name')}
                            placeholder={t('rfq.namePlaceholder', 'Enter your name')}
                            value={name}
                            onChangeText={(text) => {
                                setName(text);
                                if (errors.name) {
                                    setErrors({ ...errors, name: '' });
                                }
                            }}
                            error={errors.name}
                            leftIcon="person-outline"
                        />

                        <Input
                            label={t('rfq.companyName', 'Company Name')}
                            placeholder={t('rfq.companyNamePlaceholder', 'Enter company name')}
                            value={companyName}
                            onChangeText={(text) => {
                                setCompanyName(text);
                                if (errors.companyName) {
                                    setErrors({ ...errors, companyName: '' });
                                }
                            }}
                            error={errors.companyName}
                            leftIcon="business-outline"
                        />

                        <Input
                            label={t('rfq.address', 'Address')}
                            placeholder={t('rfq.addressPlaceholder', 'Enter address')}
                            value={address}
                            onChangeText={(text) => {
                                setAddress(text);
                                if (errors.address) {
                                    setErrors({ ...errors, address: '' });
                                }
                            }}
                            error={errors.address}
                            leftIcon="location-outline"
                        />

                        <Input
                            label={t('rfq.contactNumber', 'Contact Number')}
                            placeholder={t('rfq.contactNumberPlaceholder', 'Enter contact number')}
                            value={contactNumber}
                            onChangeText={(text) => {
                                setContactNumber(text);
                                if (errors.contactNumber) {
                                    setErrors({ ...errors, contactNumber: '' });
                                }
                            }}
                            error={errors.contactNumber}
                            keyboardType="phone-pad"
                            leftIcon="call-outline"
                        />

                        {/* Attachment Upload (Single Select) */}
                        <View style={styles.attachmentSection}>
                            <Text style={styles.label}>
                                {t('rfq.addAttachment', 'Add Attachment')}
                            </Text>
                            {!contactAttachment ? (
                                <TouchableOpacity
                                    style={styles.attachmentButton}
                                    onPress={handlePickContactAttachment}
                                >
                                    <Ionicons name="attach-outline" size={20} color={theme.colors.primary[500]} />
                                    <Text style={styles.attachmentButtonText}>
                                        {t('rfq.selectFile', 'Select File')}
                                    </Text>
                                </TouchableOpacity>
                            ) : (
                                <View style={styles.attachmentItem}>
                                    <Ionicons name="document-text-outline" size={20} color={theme.colors.text.secondary} />
                                    <Text style={styles.attachmentFileName} numberOfLines={1}>
                                        {contactAttachment.name}
                                    </Text>
                                    <TouchableOpacity
                                        onPress={handleRemoveContactAttachment}
                                        style={styles.removeAttachmentButton}
                                    >
                                        <Ionicons name="close-circle" size={20} color={theme.colors.error.main} />
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>
                    </View>

                    {/* Product Information Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>
                            {t('rfq.productInfo', 'Product Information')}
                        </Text>

                        {/* Global Product Search */}
                        <View style={styles.productSearchSection}>
                            <Input
                                label={t('rfq.searchProducts', 'Search Products')}
                                placeholder={t('rfq.searchProductsPlaceholder', 'Type to search supplier\'s products...')}
                                value={globalProductSearch}
                                onChangeText={handleGlobalProductSearch}
                                leftIcon="search-outline"
                            />

                            {/* Search Results Dropdown */}
                            {productSearchResults.length > 0 && (
                                <View style={styles.searchResultsContainer}>
                                    <ScrollView
                                        style={styles.searchResultsList}
                                        keyboardShouldPersistTaps="handled"
                                        nestedScrollEnabled
                                    >
                                        {productSearchResults.map((searchProduct) => (
                                            <TouchableOpacity
                                                key={searchProduct.id}
                                                style={styles.searchResultItem}
                                                onPress={() => handleSelectProduct(searchProduct)}
                                            >
                                                {searchProduct.base_image && (
                                                    <Image
                                                        source={{ uri: searchProduct.base_image }}
                                                        style={styles.searchResultImage}
                                                    />
                                                )}
                                                <View style={styles.searchResultInfo}>
                                                    <Text style={styles.searchResultName} numberOfLines={1}>
                                                        {searchProduct.name}
                                                    </Text>
                                                    <Text style={styles.searchResultSku}>
                                                        {searchProduct.sku}
                                                    </Text>
                                                    <Text style={styles.searchResultPrice}>
                                                        {searchProduct.formated_price}
                                                    </Text>
                                                </View>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                </View>
                            )}

                            {isSearchingProducts && (
                                <View style={styles.searchLoadingContainer}>
                                    <ActivityIndicator size="small" color={theme.colors.primary[500]} />
                                    <Text style={styles.searchLoadingText}>
                                        {t('rfq.searching', 'Searching...')}
                                    </Text>
                                </View>
                            )}
                        </View>

                        {/* Validation Error for Products */}
                        {errors.products && (
                            <Text style={styles.error}>{errors.products}</Text>
                        )}

                        {/* Products List */}
                        {products.length === 0 ? (
                            <View style={styles.emptyProducts}>
                                <Ionicons name="cube-outline" size={48} color={theme.colors.gray[400]} />
                                <Text style={styles.emptyProductsText}>
                                    {t('rfq.noProducts', 'No products added yet')}
                                </Text>
                                <Text style={styles.emptyProductsSubText}>
                                    {t('rfq.searchToAddProducts', 'Search above to add products from the catalog')}
                                </Text>
                            </View>
                        ) : (
                            <View style={styles.productsList}>
                                {products.map((product, index) => (
                                    <View key={index} style={styles.productCard}>
                                        <View style={styles.productCardHeader}>
                                            <Text style={styles.productCardTitle}>
                                                {t('rfq.product', 'Product')} #{index + 1}
                                            </Text>
                                            <TouchableOpacity
                                                onPress={() => handleRemoveProduct(index)}
                                                style={styles.removeButton}
                                            >
                                                <Ionicons name="close-circle" size={24} color={theme.colors.error.main} />
                                            </TouchableOpacity>
                                        </View>

                                        {/* Product Name - Read Only */}
                                        <View style={styles.productInfoRow}>
                                            <Text style={styles.label}>
                                                {t('rfq.productName', 'Product Name')}
                                            </Text>
                                            <Text style={styles.productNameText}>
                                                {product.product_name}
                                            </Text>
                                        </View>

                                        {/* Validation Error for Product ID */}
                                        {errors[`product_${index}_id`] && (
                                            <Text style={styles.error}>{errors[`product_${index}_id`]}</Text>
                                        )}

                                        <View style={styles.row}>
                                            <View style={styles.halfWidth}>
                                                <Input
                                                    label={t('rfq.quantity', 'Quantity')}
                                                    placeholder="1"
                                                    value={product.quantity?.toString() || ''}
                                                    onChangeText={(text) => {
                                                        // Only allow numeric input
                                                        const numericText = text.replace(/[^0-9]/g, '');

                                                        // Allow empty string during typing, but parse to number when there's a value
                                                        const quantity = numericText === '' ? null : parseInt(numericText, 10);

                                                        handleProductChange(
                                                            index,
                                                            'quantity',
                                                            quantity !== null && !isNaN(quantity) ? quantity : null
                                                        );
                                                        if (errors[`product_${index}_quantity`]) {
                                                            const newErrors = { ...errors };
                                                            delete newErrors[`product_${index}_quantity`];
                                                            setErrors(newErrors);
                                                        }
                                                    }}
                                                    error={errors[`product_${index}_quantity`]}
                                                    keyboardType="number-pad"
                                                />
                                            </View>

                                            <View style={styles.halfWidth}>
                                                <Input
                                                    label={t('rfq.pricePerQuantity', 'Price per Quantity')}
                                                    placeholder={t('rfq.priceOptional', 'Optional')}
                                                    value={product.price_per_quantity?.toString() || ''}
                                                    onChangeText={(text) =>
                                                        handleProductChange(
                                                            index,
                                                            'price_per_quantity',
                                                            text ? parseFloat(text) : null
                                                        )
                                                    }
                                                    keyboardType="decimal-pad"
                                                />
                                            </View>
                                        </View>

                                        <View style={styles.textAreaContainer}>
                                            <Text style={styles.label}>
                                                {t('rfq.description', 'Description')}
                                            </Text>
                                            <TextInput
                                                style={styles.textArea}
                                                placeholder={t('rfq.descriptionPlaceholder', 'Enter product description (optional)')}
                                                placeholderTextColor={theme.colors.text.secondary}
                                                value={product.description || ''}
                                                onChangeText={(text) =>
                                                    handleProductChange(index, 'description', text)
                                                }
                                                multiline
                                                numberOfLines={3}
                                                textAlignVertical="top"
                                            />
                                        </View>

                                        <TouchableOpacity
                                            style={[
                                                styles.sampleToggle,
                                                product.is_sample && styles.sampleToggleActive,
                                            ]}
                                            onPress={() =>
                                                handleProductChange(index, 'is_sample', !product.is_sample)
                                            }
                                        >
                                            <Ionicons
                                                name={product.is_sample ? 'checkbox' : 'square-outline'}
                                                size={20}
                                                color={product.is_sample ? theme.colors.primary[500] : theme.colors.text.secondary}
                                            />
                                            <Text
                                                style={[
                                                    styles.sampleToggleText,
                                                    product.is_sample && styles.sampleToggleTextActive,
                                                ]}
                                            >
                                                {t('rfq.sampleRequired', 'Sample Required')}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </View>
                        )}

                        {/* Image/Video Upload Section (Below Product Information) */}
                        <View style={styles.imageUploadSection}>
                            <Text style={styles.label}>
                                {t('rfq.images', 'Images / Videos')}
                            </Text>
                            <TouchableOpacity
                                style={styles.imageUploadButton}
                                onPress={handlePickProductImages}
                            >
                                <Ionicons name="image-outline" size={20} color={theme.colors.primary[500]} />
                                <Text style={styles.imageUploadButtonText}>
                                    {t('rfq.selectImages', 'Select Images or Videos')}
                                </Text>
                            </TouchableOpacity>

                            {productImages.length > 0 && (
                                <View style={styles.imagesGrid}>
                                    {productImages.map((imageUri, imageIndex) => (
                                        <View key={imageIndex} style={styles.imageItem}>
                                            <Image source={{ uri: imageUri }} style={styles.imagePreview} />
                                            <TouchableOpacity
                                                style={styles.removeImageButton}
                                                onPress={() => handleRemoveProductImage(imageIndex)}
                                            >
                                                <Ionicons name="close-circle" size={20} color={theme.colors.error.main} />
                                            </TouchableOpacity>
                                        </View>
                                    ))}
                                </View>
                            )}
                        </View>
                    </View>
                </ScrollView>

                {/* Submit Button */}
                <View style={styles.footer}>
                    <Button
                        title={
                            isSubmitting
                                ? t('rfq.submitting', 'Submitting...')
                                : t('rfq.submit', 'Submit Request for Quote')
                        }
                        onPress={handleSubmit}
                        disabled={isSubmitting || products.length === 0}
                        loading={isSubmitting}
                        fullWidth
                        size="large"
                    />
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: theme.colors.white,
    },
    keyboardContainer: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.gray[200] || theme.colors.border.main,
        backgroundColor: theme.colors.background.paper || theme.colors.white,
    },
    backButton: {
        padding: theme.spacing.xs,
    },
    headerTitle: {
        flex: 1,
        fontSize: theme.typography.fontSize.xl,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.text.primary,
        textAlign: 'center',
        marginHorizontal: theme.spacing.sm,
    },
    headerRight: {
        minWidth: 40,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: theme.spacing.lg,
        paddingBottom: 100, // Space for footer button
    },
    section: {
        marginBottom: theme.spacing.xl,
        backgroundColor: theme.colors.white,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.lg,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.md,
    },
    sectionTitle: {
        fontSize: theme.typography.fontSize.lg,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.md,
    },
    label: {
        fontSize: theme.typography.fontSize.sm,
        fontWeight: theme.typography.fontWeight.medium,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.xs,
    },
    required: {
        color: theme.colors.error.main,
    },
    textAreaContainer: {
        marginBottom: theme.spacing.md,
    },
    textArea: {
        borderWidth: 1,
        borderColor: theme.colors.border.main,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.md,
        fontSize: theme.typography.fontSize.base,
        color: theme.colors.text.primary,
        minHeight: 100,
        backgroundColor: theme.colors.white,
    },
    textAreaError: {
        borderColor: theme.colors.error.main,
    },
    error: {
        fontSize: theme.typography.fontSize.xs,
        color: theme.colors.error.main,
        marginTop: theme.spacing.xs,
    },
    addProductButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: theme.spacing.sm,
        paddingHorizontal: theme.spacing.md,
        borderRadius: theme.borderRadius.md,
        borderWidth: 1,
        borderColor: theme.colors.primary[500],
        backgroundColor: theme.colors.white,
    },
    addProductText: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.primary[500],
        fontWeight: theme.typography.fontWeight.medium,
        marginLeft: theme.spacing.xs,
    },
    emptyProducts: {
        alignItems: 'center',
        paddingVertical: theme.spacing.xl,
    },
    emptyProductsText: {
        fontSize: theme.typography.fontSize.base,
        color: theme.colors.text.secondary,
        marginTop: theme.spacing.md,
    },
    emptyProductsSubText: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.text.secondary,
        marginTop: theme.spacing.xs,
    },
    productsList: {
        gap: theme.spacing.md,
    },
    productCard: {
        borderWidth: 1,
        borderColor: theme.colors.gray[200],
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.md,
        backgroundColor: theme.colors.white,
        marginBottom: theme.spacing.md,
    },
    productCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.md,
        paddingBottom: theme.spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.gray[200],
    },
    productCardTitle: {
        fontSize: theme.typography.fontSize.base,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.text.primary,
    },
    removeButton: {
        padding: theme.spacing.xs,
    },
    row: {
        flexDirection: 'row',
        gap: theme.spacing.md,
    },
    halfWidth: {
        flex: 1,
    },
    sampleToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: theme.spacing.sm,
        paddingVertical: theme.spacing.sm,
    },
    sampleToggleActive: {
        // Additional styling if needed
    },
    sampleToggleText: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.text.secondary,
        marginLeft: theme.spacing.xs,
    },
    sampleToggleTextActive: {
        color: theme.colors.primary[500],
        fontWeight: theme.typography.fontWeight.medium,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: theme.colors.white,
        padding: theme.spacing.lg,
        borderTopWidth: 1,
        borderTopColor: theme.colors.gray[200],
        ...theme.shadows.lg,
    },
    attachmentSection: {
        marginTop: theme.spacing.md,
    },
    attachmentButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.lg,
        borderWidth: 1,
        borderColor: theme.colors.primary[500],
        borderStyle: 'dashed',
        borderRadius: theme.borderRadius.md,
        backgroundColor: theme.colors.white,
        marginTop: theme.spacing.xs,
    },
    attachmentButtonText: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.primary[500],
        fontWeight: theme.typography.fontWeight.medium,
        marginLeft: theme.spacing.xs,
    },
    attachmentsList: {
        marginTop: theme.spacing.sm,
        gap: theme.spacing.xs,
    },
    attachmentItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: theme.spacing.sm,
        backgroundColor: theme.colors.gray[50] || '#f9fafb',
        borderRadius: theme.borderRadius.md,
        borderWidth: 1,
        borderColor: theme.colors.gray[200],
    },
    attachmentFileName: {
        flex: 1,
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.text.primary,
        marginLeft: theme.spacing.sm,
    },
    removeAttachmentButton: {
        padding: theme.spacing.xs,
    },
    imageUploadSection: {
        marginTop: theme.spacing.md,
    },
    imageUploadButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.lg,
        borderWidth: 1,
        borderColor: theme.colors.primary[500],
        borderStyle: 'dashed',
        borderRadius: theme.borderRadius.md,
        backgroundColor: theme.colors.white,
        marginTop: theme.spacing.xs,
    },
    imageUploadButtonText: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.primary[500],
        fontWeight: theme.typography.fontWeight.medium,
        marginLeft: theme.spacing.xs,
    },
    imagesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: theme.spacing.sm,
        gap: theme.spacing.sm,
    },
    imageItem: {
        width: 80,
        height: 80,
        borderRadius: theme.borderRadius.md,
        overflow: 'hidden',
        position: 'relative',
        borderWidth: 1,
        borderColor: theme.colors.gray[200],
    },
    imagePreview: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    removeImageButton: {
        position: 'absolute',
        top: -5,
        right: -5,
        backgroundColor: theme.colors.white,
        borderRadius: 10,
    },
    productNameContainer: {
        position: 'relative',
        zIndex: 1,
    },
    searchResultsContainer: {
        position: 'absolute',
        top: '100%',
        left: 0,
        right: 0,
        backgroundColor: theme.colors.white,
        borderRadius: theme.borderRadius.md,
        borderWidth: 1,
        borderColor: theme.colors.gray[200],
        marginTop: theme.spacing.xs,
        maxHeight: 200,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        zIndex: 1000,
    },
    searchResultsList: {
        maxHeight: 200,
    },
    searchResultItem: {
        flexDirection: 'row',
        padding: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.gray[200],
        alignItems: 'center',
    },
    searchResultImage: {
        width: 50,
        height: 50,
        borderRadius: theme.borderRadius.sm,
        marginRight: theme.spacing.md,
        backgroundColor: theme.colors.gray[100],
    },
    searchResultInfo: {
        flex: 1,
    },
    searchResultName: {
        fontSize: theme.typography.fontSize.base,
        fontWeight: '600',
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.xs / 2,
    },
    searchResultSku: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.text.secondary,
        marginBottom: theme.spacing.xs / 2,
    },
    searchResultPrice: {
        fontSize: theme.typography.fontSize.sm,
        fontWeight: '600',
        color: theme.colors.primary[500],
    },
    searchLoadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: theme.spacing.md,
        justifyContent: 'center',
    },
    searchLoadingText: {
        marginLeft: theme.spacing.sm,
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.text.secondary,
    },
    productSearchSection: {
        marginBottom: theme.spacing.md,
    },
    productInfoRow: {
        marginBottom: theme.spacing.md,
    },
    productNameText: {
        fontSize: theme.typography.fontSize.base,
        fontWeight: theme.typography.fontWeight.semiBold,
        color: theme.colors.text.primary,
        marginTop: theme.spacing.xs,
        paddingVertical: theme.spacing.sm,
        paddingHorizontal: theme.spacing.md,
        backgroundColor: theme.colors.gray[50] || '#f9fafb',
        borderRadius: theme.borderRadius.md,
        borderWidth: 1,
        borderColor: theme.colors.gray[200],
    },
});

export default RFQScreen;

