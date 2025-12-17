import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    Image,
    TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { theme } from '@/theme';
import { suppliersApi, SupplierProfile } from '@/services/api/suppliers.api';
import { Product } from '@/features/product/types/product.types';
import { ProductCard } from '@/features/home/components/ProductCard';
import { LoadingSpinner } from '@/shared/components/LoadingSpinner';
import { ErrorMessage } from '@/shared/components/ErrorMessage';
import { HTMLContent } from '@/shared/components/HTMLContent';
import { ProductImage } from '@/shared/components/LazyImage';
import { formatters } from '@/shared/utils/formatters';
import { useToast } from '@/shared/components/Toast';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { Button } from '@/shared/components/Button';
import { WriteReviewModal } from '@/features/supplier/components/WriteReviewModal';
import { ContactSupplierModal } from '@/features/supplier/components/ContactSupplierModal';
import { ReportSupplierModal } from '@/features/supplier/components/ReportSupplierModal';
import { MessageSupplierModal } from '@/features/product/components/MessageSupplierModal';
import { cartApi } from '@/services/api/cart.api';
import { Cart } from '@/features/cart/types/cart.types';
import { fetchCartThunk } from '@/store/slices/cartSlice';

type TabType = 'products' | 'about' | 'quickorder' | 'reviews' | 'contact';

export const SupplierShopScreen: React.FC = () => {
    const { t } = useTranslation();
    const router = useRouter();
    const dispatch = useAppDispatch();
    const { showToast } = useToast();
    const { url } = useLocalSearchParams<{ url: string }>();
    const { isAuthenticated } = useAppSelector((state) => state.auth);
    const { cart: reduxCart } = useAppSelector((state) => state.cart);

    const [supplier, setSupplier] = useState<SupplierProfile | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [activeTab, setActiveTab] = useState<TabType>('products');
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingProducts, setIsLoadingProducts] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [aboutSection, setAboutSection] = useState<'about-us' | 'shipping' | 'return' | 'privacy'>('about-us');
    const [isReviewModalVisible, setIsReviewModalVisible] = useState(false);
    const [isContactModalVisible, setIsContactModalVisible] = useState(false);
    const [isMessageModalVisible, setIsMessageModalVisible] = useState(false);
    const [isReportModalVisible, setIsReportModalVisible] = useState(false);

    // Quick Order state
    const [quickOrderSearch, setQuickOrderSearch] = useState('');
    const [quickOrderQuantity, setQuickOrderQuantity] = useState('1');
    const [selectedProduct, setSelectedProduct] = useState<{
        id: number;
        sku: string;
        name: string;
        price: number;
        formated_price: string;
        base_image: string | null;
        parent_id: number | null;
        is_config: boolean;
    } | null>(null);
    const [quickOrderResults, setQuickOrderResults] = useState<Array<{
        id: number;
        sku: string;
        name: string;
        price: number;
        formated_price: string;
        base_image: string | null;
        parent_id: number | null;
        is_config: boolean;
    }>>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isLoadingCart, setIsLoadingCart] = useState(false);
    const [isAddingToCart, setIsAddingToCart] = useState(false);

    // Refs to manage search timeout and prevent search on product selection
    const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isSelectingProductRef = useRef(false);

    // Use Redux cart state instead of local state
    const cart = reduxCart;

    const loadSupplierProfile = useCallback(async () => {
        if (!url) return;

        setIsLoading(true);
        setError(null);
        try {
            const data = await suppliersApi.getSupplierProfile(url);
            setSupplier(data);
        } catch (err: any) {
            setError(err.message || t('supplier.loadProfileError'));
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [url]);

    const loadProducts = useCallback(async (page: number = 1, append: boolean = false) => {
        if (!url) return;

        setIsLoadingProducts(true);
        try {
            const response = await suppliersApi.getSupplierProducts(url, page, 20);

            if (append) {
                setProducts((prev) => [...prev, ...response.data]);
            } else {
                setProducts(response.data);
            }

            setCurrentPage(page);
            setHasMore(response.meta.current_page < response.meta.last_page);
        } catch (err: any) {
            setError(err.message || t('supplier.loadProductsError'));
        } finally {
            setIsLoadingProducts(false);
        }
    }, [url]);

    const loadCart = useCallback(async () => {
        if (!isAuthenticated) return;

        setIsLoadingCart(true);
        try {
            // Dispatch Redux action to update global cart state
            await dispatch(fetchCartThunk()).unwrap();
        } catch (error: any) {
            // Error handled in Redux slice
        } finally {
            setIsLoadingCart(false);
        }
    }, [isAuthenticated, dispatch]);

    // Load cart when supplier is loaded and user is on quick order tab
    useEffect(() => {
        if (activeTab === 'quickorder' && isAuthenticated && supplier) {
            loadCart();
        }
    }, [supplier, activeTab, isAuthenticated, loadCart]);

    useEffect(() => {
        loadSupplierProfile();
    }, [loadSupplierProfile]);

    useEffect(() => {
        if (activeTab === 'products' && supplier) {
            loadProducts(1, false);
        }
    }, [activeTab, supplier, loadProducts]);

    // Load cart when supplier is loaded and user is on quick order tab
    useEffect(() => {
        if (activeTab === 'quickorder' && isAuthenticated && supplier) {
            loadCart();
        }
    }, [supplier, activeTab, isAuthenticated, loadCart]);

    // Reload cart when screen comes into focus (user navigates back from other screens)
    useFocusEffect(
        useCallback(() => {
            if (activeTab === 'quickorder' && isAuthenticated) {
                loadCart();
            }
        }, [activeTab, isAuthenticated, loadCart])
    );

    // Search products for quick order
    useEffect(() => {
        // Clear any existing timeout
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
            searchTimeoutRef.current = null;
        }

        // Don't trigger search if we're setting search text from product selection
        if (isSelectingProductRef.current) {
            isSelectingProductRef.current = false;
            return;
        }

        if (quickOrderSearch.length > 2 && supplier) {
            searchTimeoutRef.current = setTimeout(() => {
                searchQuickOrderProducts();
            }, 300);
            return () => {
                if (searchTimeoutRef.current) {
                    clearTimeout(searchTimeoutRef.current);
                    searchTimeoutRef.current = null;
                }
            };
        } else {
            setQuickOrderResults([]);
            setIsDropdownOpen(false);
        }
    }, [quickOrderSearch, supplier]);

    const searchQuickOrderProducts = async () => {
        if (!supplier || quickOrderSearch.length < 3) return;

        setIsSearching(true);
        setIsDropdownOpen(true);
        try {
            const results = await suppliersApi.searchQuickOrderProducts(quickOrderSearch, supplier.id);
            setQuickOrderResults(results);
        } catch (error: any) {
            showToast({
                message: error.message || t('supplier.quickOrder.searchError', 'Failed to search products'),
                type: 'error',
            });
            setQuickOrderResults([]);
        } finally {
            setIsSearching(false);
        }
    };

    const handleSelectProduct = (product: {
        id: number;
        sku: string;
        name: string;
        price: number;
        formated_price: string;
        base_image: string | null;
        parent_id: number | null;
        is_config: boolean;
    }) => {
        // Clear any pending search timeout
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
            searchTimeoutRef.current = null;
        }

        // Set flag to prevent search from triggering when we set search text
        isSelectingProductRef.current = true;

        // Close dropdown and clear results first
        setIsDropdownOpen(false);
        setQuickOrderResults([]);
        setIsSearching(false);

        // Then set the selected product and search text
        setSelectedProduct(product);
        setQuickOrderSearch(product.name);
    };

    const handleAddToCart = async () => {
        if (!supplier || !selectedProduct) return;

        // Parse quantity and validate it's greater than 0
        const quantity = parseInt(quickOrderQuantity, 10);

        if (!quickOrderQuantity || quickOrderQuantity.trim() === '' || isNaN(quantity) || quantity <= 0) {
            showToast({
                message: t('supplier.quickOrder.invalidQuantity', 'Please enter a valid quantity greater than 0'),
                type: 'error',
            });
            return;
        }

        setIsAddingToCart(true);
        try {
            const response = await suppliersApi.addQuickOrderToCart({
                product: selectedProduct.id,
                quantity: quantity,
            });

            if (response.success) {
                showToast({
                    message: response.message || t('supplier.quickOrder.added', 'Item successfully added to cart'),
                    type: 'success',
                });

                // Reset form
                setSelectedProduct(null);
                setQuickOrderSearch('');
                setQuickOrderQuantity('1');
                setQuickOrderResults([]);
                setIsDropdownOpen(false);

                // Reload cart in Redux to update global state (header cart count)
                await dispatch(fetchCartThunk()).unwrap();
            } else {
                showToast({
                    message: response.message || t('supplier.quickOrder.addError', 'Failed to add product to cart'),
                    type: 'error',
                });
            }
        } catch (error: any) {
            // Extract error message from API response
            // API returns 400 with { success: false, message: "..." } in error.response.data
            const errorMessage =
                error.response?.data?.message ||
                error.response?.data?.error ||
                error.message ||
                t('supplier.quickOrder.addError', 'Failed to add product to cart');

            showToast({
                message: errorMessage,
                type: 'error',
            });
        } finally {
            setIsAddingToCart(false);
        }
    };

    const handleProceedToBuy = () => {
        router.push('/checkout');
    };

    const handleRemoveCartItem = async (cartItemId: number) => {
        try {
            await cartApi.removeFromCart(cartItemId);

            showToast({
                message: t('supplier.quickOrder.removed', 'Item removed from cart'),
                type: 'success',
            });

            // Reload cart in Redux to update global state (header cart count)
            await dispatch(fetchCartThunk()).unwrap();
        } catch (error: any) {
            showToast({
                message: error.message || t('supplier.quickOrder.removeError', 'Failed to remove item from cart'),
                type: 'error',
            });
        }
    };

    const onRefresh = useCallback(() => {
        setIsRefreshing(true);
        loadSupplierProfile();
        if (activeTab === 'products') {
            loadProducts(1, false);
        }
    }, [loadSupplierProfile, activeTab, loadProducts]);

    const handleLoadMore = () => {
        if (!isLoadingProducts && hasMore && activeTab === 'products') {
            loadProducts(currentPage + 1, true);
        }
    };

    const handleProductPress = (productId: number) => {
        router.push(`/product/${productId}`);
    };

    const renderBanner = () => {
        if (!supplier?.banner_url) return null;

        return (
            <View style={styles.bannerContainer}>
                <ProductImage
                    uri={supplier.banner_url}
                    style={styles.banner}
                    contentFit="cover"
                />
            </View>
        );
    };

    const renderSupplierInfo = () => {
        if (!supplier) return null;

        return (
            <View style={styles.supplierInfoContainer}>
                <View style={styles.logoContainer}>
                    <ProductImage
                        uri={supplier.logo_url || null}
                        style={styles.logo}
                        contentFit="cover"
                    />
                </View>
                <View style={styles.supplierDetails}>
                    <View style={styles.companyNameRow}>
                        <Text style={styles.companyName}>{supplier.company_name}</Text>
                        {supplier.is_verified && (
                            <View style={styles.verifiedBadge}>
                                <Ionicons name="checkmark-circle" size={20} color={theme.colors.success.main} />
                                <Text style={styles.verifiedText}>{t('supplier.verified', 'Verified')}</Text>
                            </View>
                        )}
                    </View>

                    {supplier.address1 && (
                        <Text style={styles.address}>
                            {supplier.address1}
                            {supplier.address2 ? `, ${supplier.address2}` : ''}
                            {supplier.city ? `, ${supplier.city}` : ''}
                        </Text>
                    )}

                    <View style={styles.metaRow}>
                        {supplier.created_at && (
                            <View style={styles.metaItem}>
                                <Ionicons name="calendar-outline" size={16} color={theme.colors.text.secondary} />
                                <Text style={styles.metaText}>
                                    {new Date(supplier.created_at).getFullYear()}
                                </Text>
                            </View>
                        )}
                        {supplier.response_time && (
                            <View style={styles.metaItem}>
                                <Ionicons name="time-outline" size={16} color={theme.colors.text.secondary} />
                                <Text style={styles.metaText}>{supplier.response_time}</Text>
                            </View>
                        )}
                    </View>

                    <View style={styles.ratingRow}>
                        {supplier.rating > 0 && (
                            <>
                                <View style={styles.stars}>
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <Ionicons
                                            key={star}
                                            name={star <= Math.round(supplier.rating) ? 'star' : 'star-outline'}
                                            size={16}
                                            color={theme.colors.warning.main}
                                        />
                                    ))}
                                </View>
                                <Text style={styles.ratingText}>
                                    {supplier.rating.toFixed(1)} ({supplier.total_reviews} {supplier.total_reviews === 1 ? t('supplier.review') : t('supplier.reviews')})
                                </Text>
                            </>
                        )}
                    </View>
                </View>
            </View>
        );
    };

    const renderRFQButton = () => {
        if (!supplier) return null;

        if (!isAuthenticated) {
            return (
                <View style={styles.rfqButtonContainer}>
                    <Button
                        title={t('supplier.loginForRFQ', 'Login for RFQ')}
                        onPress={() => {
                            router.push('/login');
                        }}
                        icon={<Ionicons name="log-in-outline" size={18} color={theme.colors.white} />}
                        fullWidth
                        style={styles.rfqButton}
                    />
                </View>
            );
        }

        return (
            <View style={styles.rfqButtonContainer}>
                <Button
                    title={t('supplier.requestQuote', 'Request for Quote')}
                    onPress={() => {
                        router.push(`/rfq/${supplier.id}`);
                    }}
                    icon={<Ionicons name="document-text-outline" size={18} color={theme.colors.white} />}
                    fullWidth
                    style={styles.rfqButton}
                />
            </View>
        );
    };

    const renderTabs = () => {
        if (!supplier) return null;

        const tabs: { key: TabType; label: string; count?: number }[] = [
            { key: 'products', label: t('supplier.products', 'Products'), count: supplier.total_products },
            { key: 'about', label: t('supplier.about', 'About') },
            { key: 'quickorder', label: t('supplier.quickOrder', 'Quick Order') },
            { key: 'reviews', label: t('supplier.reviews', 'Reviews'), count: supplier.total_reviews },
            { key: 'contact', label: t('supplier.contact', 'Contact') },
        ];

        return (
            <View style={styles.tabsContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
                    {tabs.map((tab) => (
                        <TouchableOpacity
                            key={tab.key}
                            style={[styles.tab, activeTab === tab.key && styles.activeTab]}
                            onPress={() => setActiveTab(tab.key)}
                        >
                            <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>
                                {tab.label}
                                {tab.count !== undefined && ` (${tab.count})`}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>
        );
    };

    const renderProducts = () => {
        return (
            <FlatList
                data={products}
                numColumns={2}
                keyExtractor={(item) => item.id.toString()}
                columnWrapperStyle={styles.productRow}
                contentContainerStyle={styles.productsContainer}
                renderItem={({ item }) => (
                    <View style={styles.productItem}>
                        <ProductCard
                            product={item}
                            onPress={() => handleProductPress(item.id)}
                        />
                    </View>
                )}
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.5}
                ListFooterComponent={
                    isLoadingProducts ? (
                        <View style={styles.loadingMore}>
                            <ActivityIndicator size="small" color={theme.colors.primary[500]} />
                        </View>
                    ) : null
                }
                ListEmptyComponent={
                    !isLoadingProducts ? (
                        <View style={styles.emptyState}>
                            <Ionicons name="cube-outline" size={64} color={theme.colors.gray[400]} />
                            <Text style={styles.emptyText}>{t('supplier.noProducts', 'No products available')}</Text>
                        </View>
                    ) : null
                }
            />
        );
    };

    const renderAbout = () => {
        if (!supplier) return null;

        // Build list of available sections
        const sections = [
            { key: 'about-us', label: t('supplier.aboutCompany', 'About Company'), content: supplier.company_overview },
            { key: 'shipping', label: t('supplier.shippingPolicies', 'Shipping Policies'), content: supplier.shipping_policy },
            { key: 'return', label: t('supplier.returnPolicies', 'Return Policies'), content: supplier.return_policy },
            { key: 'privacy', label: t('supplier.privacyPolicies', 'Privacy Policies'), content: supplier.privacy_policy },
        ].filter(section => section.content); // Only show sections with content

        const currentSection = sections.find(s => s.key === aboutSection) || sections[0];

        return (
            <ScrollView style={styles.contentScroll} showsVerticalScrollIndicator={false}>
                <View style={styles.aboutContainer}>
                    {/* Section Selector - Similar to web app dropdown */}
                    <View style={styles.aboutSelectorContainer}>
                        <View style={styles.aboutSelector}>
                            {sections.map((section) => (
                                <TouchableOpacity
                                    key={section.key}
                                    style={[
                                        styles.aboutOption,
                                        aboutSection === section.key && styles.aboutOptionActive,
                                    ]}
                                    onPress={() => setAboutSection(section.key as any)}
                                >
                                    <Text
                                        style={[
                                            styles.aboutOptionText,
                                            aboutSection === section.key && styles.aboutOptionTextActive,
                                        ]}
                                    >
                                        {section.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Content Section - Matching web app structure */}
                    <View style={styles.aboutContent}>
                        {currentSection && (
                            <>
                                {/* Section Heading */}
                                <Text style={styles.aboutSectionHeading}>
                                    {currentSection.label}
                                </Text>

                                {/* Section Content */}
                                <View style={styles.aboutSectionContent}>
                                    {currentSection.key === 'about-us' && currentSection.content ? (
                                        <HTMLContent html={currentSection.content} />
                                    ) : currentSection.content ? (
                                        <Text style={styles.policyText}>{currentSection.content}</Text>
                                    ) : (
                                        <View style={styles.emptyState}>
                                            <Text style={styles.emptyText}>
                                                {t('supplier.noContent', 'No content available')}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            </>
                        )}
                    </View>
                </View>
            </ScrollView>
        );
    };

    const formatReviewDate = (dateString: string): string => {
        const date = new Date(dateString);
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const day = date.getDate();
        const month = months[date.getMonth()];
        const year = date.getFullYear();
        return `${day} ${month}, ${year}`;
    };

    const getInitials = (name: string | undefined | null): string => {
        if (!name || typeof name !== 'string') return '?';

        const trimmedName = name.trim();
        if (!trimmedName) return '?';

        const nameParts = trimmedName.split(' ').filter(part => part.length > 0);
        if (nameParts.length === 0) return '?';

        // Get first character of first name
        const firstInitial = nameParts[0].charAt(0).toUpperCase();

        // Get first character of last name if available
        const lastInitial = nameParts.length > 1 ? nameParts[nameParts.length - 1].charAt(0).toUpperCase() : '';

        return firstInitial + lastInitial;
    };

    const renderReviews = () => {
        if (!supplier) return null;

        return (
            <ScrollView style={styles.contentScroll} showsVerticalScrollIndicator={false}>
                <View style={styles.reviewsContainer}>
                    {/* Write Review Button */}
                    {isAuthenticated && (
                        <View style={styles.writeReviewButtonContainer}>
                            <TouchableOpacity
                                style={styles.writeReviewButton}
                                onPress={() => setIsReviewModalVisible(true)}
                            >
                                <Ionicons name="create-outline" size={20} color={theme.colors.primary[500]} />
                                <Text style={styles.writeReviewButtonText}>
                                    {t('supplier.review.writeReview', 'Write a Review')}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {supplier.total_reviews > 0 ? (
                        <>
                            <View style={styles.reviewsSummary}>
                                <Text style={styles.reviewsAverage}>{supplier.rating.toFixed(1)}</Text>
                                <View style={styles.reviewsStars}>
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <Ionicons
                                            key={star}
                                            name={star <= Math.round(supplier.rating) ? 'star' : 'star-outline'}
                                            size={24}
                                            color={theme.colors.warning.main}
                                        />
                                    ))}
                                </View>
                                <Text style={styles.reviewsCount}>
                                    {supplier.total_reviews} {supplier.total_reviews === 1 ? t('supplier.review') : t('supplier.reviews')}
                                </Text>
                            </View>

                            {supplier.recent_reviews && supplier.recent_reviews.length > 0 && (
                                <View style={styles.reviewsList}>
                                    {supplier.recent_reviews.map((review) => (
                                        <View key={review.id} style={styles.reviewCard}>
                                            <View style={styles.reviewCardContent}>
                                                {/* Avatar with initials */}
                                                <View style={styles.reviewAvatar}>
                                                    <Text style={styles.reviewAvatarText}>
                                                        {getInitials(review.customer_name)}
                                                    </Text>
                                                </View>

                                                {/* Review content */}
                                                <View style={styles.reviewContent}>
                                                    <View style={styles.reviewHeader}>
                                                        <Text style={styles.reviewTitle}>{review.title}</Text>
                                                        <View style={styles.reviewRating}>
                                                            {[1, 2, 3, 4, 5].map((star) => (
                                                                <Ionicons
                                                                    key={star}
                                                                    name={star <= review.rating ? 'star' : 'star-outline'}
                                                                    size={16}
                                                                    color={theme.colors.warning.main}
                                                                />
                                                            ))}
                                                        </View>
                                                    </View>

                                                    <Text style={styles.reviewComment}>{review.comment}</Text>

                                                    <Text style={styles.reviewAuthor}>
                                                        {review.customer_name ? (
                                                            <>
                                                                {t('supplier.reviewBy', 'Review by')} <Text style={styles.reviewAuthorName}>{review.customer_name}</Text> • {formatReviewDate(review.created_at)}
                                                            </>
                                                        ) : (
                                                            formatReviewDate(review.created_at)
                                                        )}
                                                    </Text>
                                                </View>
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            )}
                        </>
                    ) : (
                        <View style={styles.emptyState}>
                            <Ionicons name="star-outline" size={64} color={theme.colors.gray[400]} />
                            <Text style={styles.emptyText}>{t('supplier.noReviews', 'No reviews yet')}</Text>
                        </View>
                    )}
                </View>
            </ScrollView>
        );
    };

    const renderQuickOrder = () => {
        if (!supplier) return null;

        if (!isAuthenticated) {
            return (
                <View style={styles.quickOrderContainer}>
                    <View style={styles.emptyState}>
                        <Ionicons name="lock-closed-outline" size={64} color={theme.colors.gray[400]} />
                        <Text style={styles.emptyText}>
                            {t('supplier.quickOrder.loginRequired', 'Please login to use Quick Order')}
                        </Text>
                        <Button
                            title={t('auth.login', 'Login')}
                            onPress={() => router.push('/login')}
                            style={{ marginTop: theme.spacing.md, minWidth: 120 }}
                        />
                    </View>
                </View>
            );
        }

        // Show all cart items (matching web application behavior)
        // The web app shows all cart items, not filtered by supplier
        const supplierCartItems = cart?.items || [];

        return (
            <ScrollView style={styles.contentScroll} showsVerticalScrollIndicator={false}>
                <View style={styles.quickOrderContainer}>


                    {/* Product Search */}
                    <View style={styles.quickOrderSearchContainer}>
                        <Text style={styles.quickOrderLabel}>
                            {t('supplier.quickOrder.productName', 'Product Name')}
                        </Text>
                        <View style={styles.quickOrderSearchWrapper}>
                            <Ionicons
                                name="search-outline"
                                size={20}
                                color={theme.colors.text.secondary}
                                style={styles.searchIcon}
                            />
                            <TextInput
                                style={styles.quickOrderSearchInput}
                                placeholder={t('supplier.quickOrder.searchPlaceholder', 'Press any key to search...')}
                                placeholderTextColor={theme.colors.text.secondary}
                                value={quickOrderSearch}
                                onChangeText={setQuickOrderSearch}
                                onFocus={() => {
                                    if (quickOrderSearch.length >= 2) {
                                        setIsDropdownOpen(true);
                                    }
                                }}
                            />
                            {isSearching && (
                                <ActivityIndicator size="small" color={theme.colors.primary[500]} />
                            )}
                        </View>

                        {/* Search Results Dropdown */}
                        {isDropdownOpen && quickOrderResults.length > 0 && (
                            <View style={styles.searchResultsContainer}>
                                {quickOrderResults.map((item) => (
                                    <TouchableOpacity
                                        key={item.id}
                                        style={styles.searchResultItem}
                                        onPress={() => handleSelectProduct(item)}
                                    >
                                        {item.base_image && (
                                            <ProductImage
                                                imageUrl={item.base_image}
                                                style={styles.searchResultImage}
                                            />
                                        )}
                                        <View style={styles.searchResultContent}>
                                            <Text style={styles.searchResultName} numberOfLines={2}>
                                                {item.name}
                                            </Text>
                                            <Text style={styles.searchResultPrice}>
                                                {item.formated_price}
                                            </Text>
                                        </View>
                                        <Ionicons
                                            name="chevron-forward-outline"
                                            size={20}
                                            color={theme.colors.text.secondary}
                                        />
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </View>

                    {/* Quantity Field */}
                    <View style={styles.quickOrderQuantityContainer}>
                        <Text style={styles.quickOrderLabel}>
                            {t('supplier.quickOrder.quantity', 'Quantity')}
                        </Text>
                        <TextInput
                            style={styles.quickOrderQuantityInput}
                            placeholder={t('supplier.quickOrder.quantityPlaceholder', 'Enter quantity')}
                            placeholderTextColor={theme.colors.text.secondary}
                            value={quickOrderQuantity}
                            onChangeText={(text) => {
                                // Only allow numbers
                                const numericValue = text.replace(/[^0-9]/g, '');
                                setQuickOrderQuantity(numericValue);
                            }}
                            keyboardType="numeric"
                        />
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.quickOrderActionsContainer}>
                        <TouchableOpacity
                            style={[
                                styles.addToCartButton,
                                (!selectedProduct ||
                                    isAddingToCart ||
                                    !quickOrderQuantity ||
                                    quickOrderQuantity.trim() === '' ||
                                    isNaN(parseInt(quickOrderQuantity, 10)) ||
                                    parseInt(quickOrderQuantity, 10) <= 0) && styles.addToCartButtonDisabled
                            ]}
                            onPress={handleAddToCart}
                            disabled={
                                !selectedProduct ||
                                isAddingToCart ||
                                !quickOrderQuantity ||
                                quickOrderQuantity.trim() === '' ||
                                isNaN(parseInt(quickOrderQuantity, 10)) ||
                                parseInt(quickOrderQuantity, 10) <= 0
                            }
                        >
                            {isAddingToCart ? (
                                <ActivityIndicator size="small" color={theme.colors.primary[500]} />
                            ) : (
                                <>
                                    <Ionicons
                                        name="cart-outline"
                                        size={18}
                                        color={theme.colors.primary[500]}
                                    />
                                    <Text style={styles.addToCartButtonText}>
                                        {t('supplier.quickOrder.addToCart', 'Add to Cart')}
                                    </Text>
                                </>
                            )}
                        </TouchableOpacity>
                        <Button
                            title={t('supplier.quickOrder.proceedToBuy', 'Proceed to Buy')}
                            onPress={handleProceedToBuy}
                            disabled={!cart || !cart.items || cart.items.length === 0}
                            variant="primary"
                            style={styles.proceedToBuyButton}
                        />
                    </View>
                    {/* Cart Items - Show by default at the top */}
                    <View style={styles.quickOrderCartContainer}>
                        <Text style={styles.quickOrderSectionTitle}>
                            {t('supplier.quickOrder.cartItems', 'Cart Items')}
                        </Text>

                        {isLoadingCart ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="small" color={theme.colors.primary[500]} />
                            </View>
                        ) : supplierCartItems.length > 0 ? (
                            <View style={styles.cartItemsList}>
                                {supplierCartItems.map((item) => (
                                    <View key={item.id} style={styles.cartItem}>
                                        {item.product?.images && item.product.images.length > 0 && (
                                            <ProductImage
                                                imageUrl={item.product.images[0].url}
                                                style={styles.cartItemImage}
                                            />
                                        )}
                                        <View style={styles.cartItemContent}>
                                            <Text style={styles.cartItemName} numberOfLines={2}>
                                                {item.name}
                                            </Text>
                                            <View style={styles.cartItemDetails}>
                                                <Text style={styles.cartItemQuantity}>
                                                    {t('supplier.quickOrder.quantity', 'Qty')}: {item.quantity}
                                                </Text>
                                                <Text style={styles.cartItemSubtotal}>
                                                    {formatters.formatPrice(item.total)}
                                                </Text>
                                            </View>
                                        </View>
                                        <TouchableOpacity
                                            style={styles.removeButton}
                                            onPress={() => handleRemoveCartItem(item.id)}
                                        >
                                            <Ionicons
                                                name="trash-outline"
                                                size={20}
                                                color={theme.colors.error.main}
                                            />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </View>
                        ) : (
                            <View style={styles.emptyState}>
                                <Ionicons name="cart-outline" size={64} color={theme.colors.gray[400]} />
                                <Text style={styles.emptyText}>
                                    {t('supplier.quickOrder.noItems', 'No items in cart')}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>
            </ScrollView>
        );
    };

    const renderContact = () => {
        if (!supplier) return null;

        return (
            <ScrollView style={styles.contentScroll} showsVerticalScrollIndicator={false}>
                <View style={styles.contactContainer}>
                    {/* Action Buttons */}
                    <View style={styles.contactActionsContainer}>
                        <TouchableOpacity
                            style={styles.contactActionButton}
                            onPress={() => setIsContactModalVisible(true)}
                        >
                            <Ionicons name="mail-outline" size={18} color={theme.colors.primary[500]} />
                            <Text style={styles.contactActionButtonText}>
                                {t('supplier.contactSupplier', 'Contact Supplier')}
                            </Text>
                        </TouchableOpacity>
                        {isAuthenticated && (
                            <>
                                <TouchableOpacity
                                    style={styles.contactActionButton}
                                    onPress={() => setIsMessageModalVisible(true)}
                                >
                                    <Ionicons name="chatbubble-outline" size={18} color={theme.colors.primary[500]} />
                                    <Text style={styles.contactActionButtonText}>
                                        {t('supplier.messageSupplier', 'Message Supplier')}
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.contactActionButton}
                                    onPress={() => setIsReportModalVisible(true)}
                                >
                                    <Ionicons name="flag-outline" size={18} color={theme.colors.primary[500]} />
                                    <Text style={styles.contactActionButtonText}>
                                        {t('supplier.reportSupplier', 'Report Supplier')}
                                    </Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </View>

                    {/* Contact Information */}
                    <View style={styles.contactInfoSection}>
                        <Text style={styles.contactInfoTitle}>
                            {t('supplier.contactInformation', 'Contact Information')}
                        </Text>

                        <View style={styles.contactItem}>
                            <Ionicons name="person-outline" size={20} color={theme.colors.text.secondary} />
                            <Text style={styles.contactLabel}>{t('supplier.name', 'Name')}:</Text>
                            <Text style={styles.contactValue}>{supplier.first_name} {supplier.last_name}</Text>
                        </View>
                        <View style={styles.contactItem}>
                            <Ionicons name="mail-outline" size={20} color={theme.colors.text.secondary} />
                            <Text style={styles.contactLabel}>{t('supplier.email', 'Email')}:</Text>
                            <Text style={styles.contactValue}>{supplier.email}</Text>
                        </View>
                        {supplier.phone && (
                            <View style={styles.contactItem}>
                                <Ionicons name="call-outline" size={20} color={theme.colors.text.secondary} />
                                <Text style={styles.contactLabel}>{t('supplier.phone', 'Phone')}:</Text>
                                <Text style={styles.contactValue}>{supplier.phone}</Text>
                            </View>
                        )}
                        {supplier.corporate_phone && (
                            <View style={styles.contactItem}>
                                <Ionicons name="business-outline" size={20} color={theme.colors.text.secondary} />
                                <Text style={styles.contactLabel}>{t('supplier.corporatePhone', 'Corporate Phone')}:</Text>
                                <Text style={styles.contactValue}>{supplier.corporate_phone}</Text>
                            </View>
                        )}
                        {supplier.address1 && (
                            <View style={styles.contactItem}>
                                <Ionicons name="location-outline" size={20} color={theme.colors.text.secondary} />
                                <Text style={styles.contactLabel}>{t('supplier.address', 'Address')}:</Text>
                                <Text style={styles.contactValue}>
                                    {supplier.address1}
                                    {supplier.address2 ? `, ${supplier.address2}` : ''}
                                </Text>
                            </View>
                        )}
                        {supplier.city && (
                            <View style={styles.contactItem}>
                                <Ionicons name="business-outline" size={20} color={theme.colors.text.secondary} />
                                <Text style={styles.contactLabel}>{t('supplier.city', 'City')}:</Text>
                                <Text style={styles.contactValue}>{supplier.city}</Text>
                            </View>
                        )}
                        {supplier.state && (
                            <View style={styles.contactItem}>
                                <Ionicons name="map-outline" size={20} color={theme.colors.text.secondary} />
                                <Text style={styles.contactLabel}>{t('supplier.state', 'State')}:</Text>
                                <Text style={styles.contactValue}>{supplier.state}</Text>
                            </View>
                        )}
                        {supplier.postcode && (
                            <View style={styles.contactItem}>
                                <Ionicons name="mail-outline" size={20} color={theme.colors.text.secondary} />
                                <Text style={styles.contactLabel}>{t('supplier.postcode', 'Post Code')}:</Text>
                                <Text style={styles.contactValue}>{supplier.postcode}</Text>
                            </View>
                        )}
                        {supplier.country && (
                            <View style={styles.contactItem}>
                                <Ionicons name="globe-outline" size={20} color={theme.colors.text.secondary} />
                                <Text style={styles.contactLabel}>{t('supplier.country', 'Country')}:</Text>
                                <Text style={styles.contactValue}>{supplier.country}</Text>
                            </View>
                        )}
                    </View>
                </View>
            </ScrollView>
        );
    };

    const renderContent = () => {
        if (isLoading) {
            return <LoadingSpinner />;
        }

        if (error && !supplier) {
            return <ErrorMessage message={error} onRetry={loadSupplierProfile} />;
        }

        if (!supplier) {
            return null;
        }

        return (
            <View style={styles.container}>
                <ScrollView
                    style={styles.headerContent}
                    refreshControl={
                        <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={[theme.colors.primary[500]]} />
                    }
                    scrollEnabled={activeTab !== 'products'}
                >
                    {renderBanner()}
                    {renderSupplierInfo()}
                    {renderRFQButton()}
                    {renderTabs()}
                    {activeTab !== 'products' && (
                        <View style={styles.tabContent}>
                            {activeTab === 'about' && renderAbout()}
                            {activeTab === 'quickorder' && renderQuickOrder()}
                            {activeTab === 'reviews' && renderReviews()}
                            {activeTab === 'contact' && renderContact()}
                        </View>
                    )}
                </ScrollView>
                {activeTab === 'products' && (
                    <View style={styles.tabContent}>
                        {renderProducts()}
                    </View>
                )}
            </View>
        );
    };

    const handleShare = () => {
        if (supplier) {
            showToast({
                message: t('supplier.shareMessage', `Share ${supplier.company_name}`) || `Share ${supplier.company_name}`,
                type: 'info',
            });
        }
    };

    return (
        <SafeAreaView style={styles.safeArea} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>
                    {supplier?.company_name || t('supplier.shop', 'Supplier Shop')}
                </Text>
                <View style={styles.headerRight}>
                    {supplier && (
                        <TouchableOpacity onPress={handleShare} style={styles.shareButton}>
                            <Ionicons name="share-outline" size={24} color={theme.colors.text.primary} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>
            {renderContent()}

            {/* Write Review Modal */}
            {supplier && (
                <WriteReviewModal
                    visible={isReviewModalVisible}
                    supplierUrl={url || ''}
                    supplierCompanyName={supplier.company_name}
                    onClose={() => setIsReviewModalVisible(false)}
                    onSuccess={() => {
                        // Refresh supplier profile to get updated reviews
                        loadSupplierProfile();
                    }}
                />
            )}

            {/* Contact Supplier Modal */}
            {supplier && url && (
                <ContactSupplierModal
                    visible={isContactModalVisible}
                    supplierUrl={url}
                    supplierCompanyName={supplier.company_name}
                    onClose={() => setIsContactModalVisible(false)}
                    onSuccess={() => {
                        showToast({
                            message: t('supplier.contactSuccess', 'Your message has been sent successfully'),
                            type: 'success',
                        });
                    }}
                />
            )}

            {/* Message Supplier Modal */}
            {supplier && isAuthenticated && (
                <MessageSupplierModal
                    visible={isMessageModalVisible}
                    supplierId={supplier.id}
                    supplierCompanyName={supplier.company_name}
                    onClose={() => setIsMessageModalVisible(false)}
                    onSuccess={() => {
                        showToast({
                            message: t('supplier.messageSuccess', 'Your message has been sent successfully'),
                            type: 'success',
                        });
                    }}
                />
            )}

            {/* Report Supplier Modal */}
            {supplier && isAuthenticated && (
                <ReportSupplierModal
                    visible={isReportModalVisible}
                    supplierId={supplier.id}
                    supplierCompanyName={supplier.company_name}
                    onClose={() => setIsReportModalVisible(false)}
                    onSuccess={() => {
                        showToast({
                            message: t('supplier.reportSuccess', 'Your report has been submitted successfully'),
                            type: 'success',
                        });
                    }}
                />
            )}
        </SafeAreaView>
    );
};

// Styles continue in next part due to length...
const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: theme.colors.background.default,
    },
    container: {
        flex: 1,
    },
    headerContent: {
        flex: 0,
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
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
    },
    shareButton: {
        padding: theme.spacing.xs,
        marginLeft: theme.spacing.sm,
    },
    bannerContainer: {
        width: '100%',
        height: 200,
        marginBottom: theme.spacing.md,
    },
    banner: {
        width: '100%',
        height: '100%',
    },
    supplierInfoContainer: {
        flexDirection: 'row',
        padding: theme.spacing.lg,
        backgroundColor: theme.colors.white,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.gray[200],
    },
    rfqButtonContainer: {
        padding: theme.spacing.lg,
        backgroundColor: theme.colors.white,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.gray[200],
    },
    rfqButton: {
        marginTop: 0,
    },
    logoContainer: {
        width: 80,
        height: 80,
        borderRadius: theme.borderRadius.md,
        borderWidth: 1,
        borderColor: theme.colors.gray[200],
        overflow: 'hidden',
        marginRight: theme.spacing.md,
    },
    logo: {
        width: '100%',
        height: '100%',
    },
    supplierDetails: {
        flex: 1,
    },
    companyNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.spacing.xs,
    },
    companyName: {
        fontSize: theme.typography.fontSize.xl,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.text.primary,
        marginRight: theme.spacing.sm,
    },
    verifiedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    verifiedText: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.success.main,
        marginLeft: theme.spacing.xs,
    },
    address: {
        fontSize: theme.typography.fontSize.base,
        color: theme.colors.text.secondary,
        marginBottom: theme.spacing.xs,
    },
    metaRow: {
        flexDirection: 'row',
        marginBottom: theme.spacing.xs,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: theme.spacing.md,
    },
    metaText: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.text.secondary,
        marginLeft: theme.spacing.xs,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    stars: {
        flexDirection: 'row',
        marginRight: theme.spacing.sm,
    },
    ratingText: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.text.secondary,
    },
    tabsContainer: {
        backgroundColor: theme.colors.white,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.gray[200],
    },
    tabsScroll: {
        paddingHorizontal: theme.spacing.md,
    },
    tab: {
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.lg,
        marginRight: theme.spacing.sm,
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    activeTab: {
        borderBottomColor: theme.colors.primary[500],
    },
    tabText: {
        fontSize: theme.typography.fontSize.base,
        color: theme.colors.text.secondary,
        fontWeight: theme.typography.fontWeight.medium,
    },
    activeTabText: {
        color: theme.colors.primary[500],
        fontWeight: theme.typography.fontWeight.bold,
    },
    tabContent: {
        flex: 1,
        minHeight: 400,
    },
    productsContainer: {
        padding: theme.spacing.md,
    },
    productRow: {
        justifyContent: 'space-between',
    },
    productItem: {
        flex: 1,
        maxWidth: '48%',
        marginBottom: theme.spacing.md,
    },
    loadingMore: {
        padding: theme.spacing.lg,
        alignItems: 'center',
    },
    emptyState: {
        padding: theme.spacing.xl,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: theme.typography.fontSize.base,
        color: theme.colors.text.secondary,
        marginTop: theme.spacing.md,
    },
    contentScroll: {
        flex: 1,
    },
    aboutContainer: {
        padding: theme.spacing.lg,
    },
    aboutSelectorContainer: {
        marginBottom: theme.spacing.xl,
    },
    aboutSelector: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: theme.spacing.sm,
        marginBottom: theme.spacing.lg,
    },
    aboutOption: {
        paddingVertical: theme.spacing.sm,
        paddingHorizontal: theme.spacing.md,
        borderRadius: theme.borderRadius.md,
        borderWidth: 1,
        borderColor: theme.colors.gray[300],
        backgroundColor: theme.colors.white,
    },
    aboutOptionActive: {
        borderColor: theme.colors.primary[500],
        backgroundColor: theme.colors.primary[50] || theme.colors.primary[100],
    },
    aboutOptionText: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.text.secondary,
        fontWeight: theme.typography.fontWeight.regular || '400',
    },
    aboutOptionTextActive: {
        color: theme.colors.primary[500],
        fontWeight: theme.typography.fontWeight.medium,
    },
    aboutContent: {
        marginTop: theme.spacing.lg,
    },
    aboutSectionHeading: {
        fontSize: theme.typography.fontSize['2xl'] || 24,
        fontWeight: theme.typography.fontWeight.medium,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.md,
    },
    aboutSectionContent: {
        marginTop: theme.spacing.md,
    },
    policyText: {
        fontSize: theme.typography.fontSize.base,
        color: theme.colors.text.primary,
        lineHeight: 24,
    },
    reviewsContainer: {
        padding: theme.spacing.lg,
    },
    writeReviewButtonContainer: {
        marginBottom: theme.spacing.lg,
    },
    writeReviewButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.lg,
        borderRadius: theme.borderRadius.md,
        borderWidth: 1,
        borderColor: theme.colors.primary[500],
        backgroundColor: theme.colors.white,
        gap: theme.spacing.sm,
    },
    writeReviewButtonText: {
        fontSize: theme.typography.fontSize.base,
        fontWeight: theme.typography.fontWeight.medium,
        color: theme.colors.primary[500],
    },
    reviewsSummary: {
        alignItems: 'center',
        paddingVertical: theme.spacing.xl,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.gray[200],
        marginBottom: theme.spacing.lg,
    },
    reviewsAverage: {
        fontSize: 48,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.sm,
    },
    reviewsStars: {
        flexDirection: 'row',
        marginBottom: theme.spacing.sm,
    },
    reviewsCount: {
        fontSize: theme.typography.fontSize.base,
        color: theme.colors.text.secondary,
    },
    reviewsList: {
        gap: theme.spacing.md,
    },
    reviewCard: {
        borderWidth: 1,
        borderColor: '#e5e5e5',
        borderRadius: theme.borderRadius.lg,
        marginBottom: theme.spacing.md,
        backgroundColor: theme.colors.white,
    },
    reviewCardContent: {
        flexDirection: 'row',
        padding: theme.spacing.lg,
        gap: theme.spacing.md,
    },
    reviewAvatar: {
        width: 70,
        height: 70,
        borderRadius: theme.borderRadius.md,
        backgroundColor: '#F5F5F5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    reviewAvatarText: {
        fontSize: 24,
        fontWeight: theme.typography.fontWeight.semiBold,
        color: '#6E6E6E',
    },
    reviewContent: {
        flex: 1,
    },
    reviewHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: theme.spacing.sm,
        gap: theme.spacing.sm,
    },
    reviewTitle: {
        fontSize: theme.typography.fontSize.lg,
        fontWeight: theme.typography.fontWeight.medium,
        color: theme.colors.text.primary,
        flex: 1,
    },
    reviewRating: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    reviewComment: {
        fontSize: theme.typography.fontSize.base,
        color: '#757575',
        marginBottom: theme.spacing.sm,
        lineHeight: 20,
    },
    reviewAuthor: {
        fontSize: theme.typography.fontSize.sm,
        color: '#666666',
        marginTop: theme.spacing.xs,
    },
    reviewAuthorName: {
        fontWeight: theme.typography.fontWeight.medium,
        color: '#666666',
    },
    contactContainer: {
        padding: theme.spacing.lg,
    },
    contactActionsContainer: {
        marginBottom: theme.spacing.xl,
        gap: theme.spacing.md,
    },
    contactActionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.lg,
        backgroundColor: theme.colors.white,
        borderRadius: theme.borderRadius.md,
        borderWidth: 1,
        borderColor: theme.colors.primary[500],
        gap: theme.spacing.sm,
        marginBottom: 0,
    },
    contactActionButtonText: {
        fontSize: theme.typography.fontSize.base,
        fontWeight: theme.typography.fontWeight.semiBold,
        color: theme.colors.primary[500],
    },
    contactInfoSection: {
        marginTop: theme.spacing.lg,
    },
    contactInfoTitle: {
        fontSize: theme.typography.fontSize.xl,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.lg,
    },
    contactItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.gray[200],
    },
    contactLabel: {
        fontSize: theme.typography.fontSize.base,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.text.primary,
        marginLeft: theme.spacing.sm,
        minWidth: 100,
    },
    contactValue: {
        flex: 1,
        fontSize: theme.typography.fontSize.base,
        color: theme.colors.text.secondary,
        marginLeft: theme.spacing.sm,
    },
    quickOrderContainer: {
        padding: theme.spacing.lg,
    },
    quickOrderSearchContainer: {
        marginBottom: theme.spacing.xl,
    },
    quickOrderLabel: {
        fontSize: theme.typography.fontSize.base,
        fontWeight: theme.typography.fontWeight.medium,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.sm,
    },
    quickOrderSearchWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.colors.gray[300],
        borderRadius: theme.borderRadius.md,
        paddingHorizontal: theme.spacing.md,
        backgroundColor: theme.colors.white,
    },
    searchIcon: {
        marginRight: theme.spacing.sm,
    },
    quickOrderSearchInput: {
        flex: 1,
        paddingVertical: theme.spacing.md,
        fontSize: theme.typography.fontSize.base,
        color: theme.colors.text.primary,
    },
    searchResultsContainer: {
        marginTop: theme.spacing.sm,
        maxHeight: 300,
        backgroundColor: theme.colors.white,
        borderRadius: theme.borderRadius.md,
        borderWidth: 1,
        borderColor: theme.colors.gray[300],
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    searchResultItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.gray[200],
    },
    searchResultImage: {
        width: 50,
        height: 50,
        borderRadius: theme.borderRadius.sm,
        marginRight: theme.spacing.md,
    },
    searchResultContent: {
        flex: 1,
        marginRight: theme.spacing.sm,
    },
    searchResultName: {
        fontSize: theme.typography.fontSize.sm,
        fontWeight: theme.typography.fontWeight.medium,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.xs,
    },
    searchResultPrice: {
        fontSize: theme.typography.fontSize.sm,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.primary[500],
    },
    quickOrderQuantityContainer: {
        marginBottom: theme.spacing.xl,
    },
    quickOrderQuantityInput: {
        borderWidth: 1,
        borderColor: theme.colors.gray[300],
        borderRadius: theme.borderRadius.md,
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.md,
        fontSize: theme.typography.fontSize.base,
        color: theme.colors.text.primary,
        backgroundColor: theme.colors.white,
    },
    quickOrderActionsContainer: {
        flexDirection: 'row',
        gap: theme.spacing.md,
        marginBottom: theme.spacing.xl,
        justifyContent: 'flex-end',
    },
    addToCartButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.lg,
        backgroundColor: theme.colors.white,
        borderRadius: theme.borderRadius.md,
        borderWidth: 1,
        borderColor: theme.colors.primary[500],
        gap: theme.spacing.sm,
    },
    addToCartButtonDisabled: {
        opacity: 0.5,
    },
    addToCartButtonText: {
        fontSize: theme.typography.fontSize.base,
        fontWeight: theme.typography.fontWeight.semiBold,
        color: theme.colors.primary[500],
    },
    proceedToBuyButton: {
        flex: 1,
    },
    quickOrderCartContainer: {
        marginBottom: theme.spacing.xl,
    },
    quickOrderSectionTitle: {
        fontSize: theme.typography.fontSize.lg,
        fontWeight: theme.typography.fontWeight.semiBold,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.md,
    },
    loadingContainer: {
        padding: theme.spacing.xl,
        alignItems: 'center',
    },
    cartItemsList: {
        gap: theme.spacing.md,
    },
    cartItem: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.colors.gray[200],
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.md,
        backgroundColor: theme.colors.white,
        gap: theme.spacing.md,
    },
    cartItemImage: {
        width: 60,
        height: 60,
        borderRadius: theme.borderRadius.sm,
    },
    cartItemContent: {
        flex: 1,
    },
    removeButton: {
        padding: theme.spacing.sm,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cartItemName: {
        fontSize: theme.typography.fontSize.base,
        fontWeight: theme.typography.fontWeight.medium,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.sm,
    },
    cartItemDetails: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    cartItemQuantity: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.text.secondary,
    },
    cartItemSubtotal: {
        fontSize: theme.typography.fontSize.base,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.text.primary,
    },
});

export default SupplierShopScreen;

