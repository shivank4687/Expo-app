import { useAppSelector } from '@/store/hooks';
import { supplierTheme } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator, TextInput } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { SalesStatsCard } from '@/features/supplier-panel/dashboard/components/SalesStatsCard';
import { PendingOrdersCard } from '@/features/supplier-panel/dashboard/components/PendingOrdersCard';
import { PaymentsCard } from '@/features/supplier-panel/dashboard/components/PaymentsCard';
import { QuotesCard } from '@/features/supplier-panel/dashboard/components/QuotesCard';
import { usePendingOrdersList } from '@/features/supplier-panel/dashboard/hooks/usePendingOrdersList';
import { createShipment } from '@/features/supplier-panel/dashboard/api/shipments.api';
import { useToast } from '@/shared/components/Toast';
import { LowStockProductsList } from '@/features/supplier-panel/dashboard/components/LowStockProductsList';
import { useRouter } from 'expo-router';

export default function SupplierDashboardScreen() {
  const { supplier, isAuthenticated } = useAppSelector((state) => state.supplierAuth);
  const [activeTab, setActiveTab] = useState<'pending' | 'shipped' | 'issues'>('pending');
  const { data: ordersData, loading: ordersLoading, error: ordersError, refetch } = usePendingOrdersList();
  const { showToast } = useToast();
  const router = useRouter();

  // State for tracking numbers and photos per order
  const [trackingNumbers, setTrackingNumbers] = useState<Record<number, string>>({});
  const [trackingPhotos, setTrackingPhotos] = useState<Record<number, ImagePicker.ImagePickerAsset>>({});
  const [creatingShipment, setCreatingShipment] = useState<Record<number, boolean>>({});

  // Handle photo picker
  const handlePickPhoto = async (orderId: number) => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        showToast({ message: 'Please grant camera roll permissions to upload photos.', type: 'warning' });
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets[0]) {
        setTrackingPhotos(prev => ({
          ...prev,
          [orderId]: result.assets[0]
        }));
        showToast({ message: 'Photo selected successfully', type: 'success' });
      }
    } catch (error) {
      console.error('Error picking photo:', error);
      showToast({ message: 'Failed to pick photo. Please try again.', type: 'error' });
    }
  };

  // Handle shipment creation
  const handleCreateShipment = async (orderId: number) => {
    const trackingNumber = trackingNumbers[orderId];
    const trackingPhoto = trackingPhotos[orderId];

    if (!trackingNumber && !trackingPhoto) {
      showToast({ message: 'Please enter a tracking number or upload a photo.', type: 'warning' });
      return;
    }

    try {
      setCreatingShipment(prev => ({ ...prev, [orderId]: true }));

      const shipmentData: any = {};

      if (trackingNumber) {
        shipmentData.track_number = trackingNumber;
      }

      if (trackingPhoto) {
        shipmentData.tracking_photo = {
          uri: trackingPhoto.uri,
          type: trackingPhoto.type || 'image/jpeg',
          name: trackingPhoto.fileName || `tracking_${orderId}.jpg`,
        };
      }

      const response = await createShipment(orderId, shipmentData);

      if (response.success) {
        showToast({ message: 'Shipment created successfully!', type: 'success' });

        // Clear the inputs for this order
        setTrackingNumbers(prev => {
          const newState = { ...prev };
          delete newState[orderId];
          return newState;
        });
        setTrackingPhotos(prev => {
          const newState = { ...prev };
          delete newState[orderId];
          return newState;
        });

        // Refresh the orders list
        refetch();
      } else {
        showToast({ message: response.message || 'Failed to create shipment', type: 'error' });
      }
    } catch (error: any) {
      console.error('Error creating shipment:', error);
      console.error('Error response:', error?.response);
      console.error('Error response data:', error?.response?.data);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to create shipment. Please try again.';
      showToast({ message: errorMessage, type: 'error' });
    } finally {
      setCreatingShipment(prev => ({ ...prev, [orderId]: false }));
    }
  };

  // Handle product save
  const handleProductSave = (productId: number, price: number, stock: number) => {
    console.log('Save product:', productId, price, stock);
    showToast({ message: 'Product updated successfully!', type: 'success' });
  };

  // Handle product edit
  const handleProductEdit = (productId: number) => {
    console.log('Edit product:', productId);
    // Navigate to product edit screen
  };

  // Handle edit variants
  const handleEditVariants = (productId: number) => {
    console.log('Edit variants:', productId);
    // Navigate to variants edit screen
  };

  // Handle add product
  const handleAddProduct = () => {
    console.log('Add new product');
    // Navigate to add product screen
  };

  // Handle see all products
  const handleSeeAllProducts = () => {
    console.log('See all products');
    // Navigate to all products screen
  };

  if (!isAuthenticated || !supplier) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Not authenticated</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['#00615E', '#1a7470', '#4d9892', '#8bbbb7', '#c4dbd9', '#FCF7EA']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.backgroundGradient}
      />
      <ScrollView contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileContent}>
            {/* Avatar */}
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {supplier.name.charAt(0).toUpperCase()}
              </Text>
            </View>

            {/* Profile Info */}
            <View style={styles.profileInfo}>
              <Text style={styles.greetingText}>Hey {supplier.name}!</Text>
              <Text style={styles.descriptionText}>
                Your dashboard. Sales. Orders. Payments
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="add" size={16} color="#000000" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push('/(supplier-drawer)/messages')}
            >
              <Ionicons name="chatbubble-outline" size={16} color="#000000" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Info Card */}
        <View style={styles.infoCardContainer}>
          <View style={styles.infoImagePlaceholder}>
            <Ionicons name="image-outline" size={40} color="#999999" />
          </View>
          <View style={styles.infoTextContent}>
            <Text style={styles.infoTitle}>
              Today: The important stuff in 10 seconds
            </Text>
            <Text style={styles.infoDescription}>
              Prioritize: pending orders and upload tracking on time to avoid penalties. Your payments are released automatically after delivery.
            </Text>
          </View>
        </View>

        {/* Metrics Grid */}
        <View style={styles.metricsGrid}>
          {/* Sales Card - Now using API data */}
          <SalesStatsCard />

          {/* Pending Orders Card - Now using API data */}
          <PendingOrdersCard />


          {/* Payments Card - Now using API data */}
          <PaymentsCard />

          {/* Quotes Card - Now using API data */}
          <QuotesCard />
        </View>

        {/* My Orders Section */}
        <View style={styles.ordersSection}>
          <Text style={styles.ordersSectionTitle}>My Orders</Text>

          {/* Tabs */}
          <View style={styles.orderTabs}>
            <TouchableOpacity
              style={[styles.orderTab, activeTab === 'pending' && styles.orderTabActive]}
              onPress={() => setActiveTab('pending')}
            >
              <Text style={styles.orderTabText}>Pending</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.orderTab, activeTab === 'shipped' && styles.orderTabActive]}
              onPress={() => setActiveTab('shipped')}
            >
              <Text style={styles.orderTabText}>Shipped</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.orderTab, activeTab === 'issues' && styles.orderTabActive]}
              onPress={() => setActiveTab('issues')}
            >
              <Text style={styles.orderTabText}>Issues</Text>
            </TouchableOpacity>
          </View>

          {/* Warning Text - Only show for pending tab */}
          {activeTab === 'pending' && (
            <Text style={styles.ordersWarning}>
              If you don't upload the tracking within the deadline, there may be a penalty (less visibility/extra commission/temporary block).
            </Text>
          )}

          {/* Tab Content */}
          {activeTab === 'pending' ? (
            ordersLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#00615E" />
                <Text style={styles.loadingText}>Loading orders...</Text>
              </View>
            ) : ordersError ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle-outline" size={48} color="#FF6B6B" />
                <Text style={styles.errorText}>{ordersError}</Text>
              </View>
            ) : ordersData && ordersData.orders.length > 0 ? (
              <>
                {/* Orders Scroll Container */}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.ordersScroll}
                  contentContainerStyle={styles.ordersScrollContent}
                >
                  {ordersData.orders.map((order) => (
                    <View key={order.id} style={styles.orderCard}>
                      <View style={styles.orderHeader}>
                        <View style={styles.orderHeaderTop}>
                          <Text style={styles.orderNumber}>{order.order_increment_id}</Text>
                          <View style={styles.orderTimeBadge}>
                            <Ionicons name="time-outline" size={16} color="#E5A75F" />
                            <Text style={styles.orderTimeText}>18h</Text>
                          </View>
                        </View>
                        <View style={styles.orderMeta}>
                          <Text style={styles.orderMetaText}>{order.customer_name}</Text>
                          <Text style={styles.orderMetaText}>{order.total_items} items</Text>
                          <Text style={styles.orderMetaText}>{order.formatted_amount}</Text>
                        </View>
                      </View>

                      <View style={styles.orderContent}>
                        <Text style={styles.orderContentTitle}>Shipping Code / Tracking</Text>
                        <View style={styles.trackingInputRow}>
                          <TextInput
                            style={styles.trackingInput}
                            placeholder="Paste the code"
                            placeholderTextColor="#999999"
                            value={trackingNumbers[order.id] || ''}
                            onChangeText={(text) => setTrackingNumbers(prev => ({ ...prev, [order.id]: text }))}
                          />
                          <TouchableOpacity
                            style={styles.photoButton}
                            onPress={() => handlePickPhoto(order.id)}
                          >
                            <Ionicons name="camera-outline" size={16} color="#000000" />
                            <Text style={styles.photoButtonText}>Photo</Text>
                          </TouchableOpacity>
                        </View>
                        {trackingPhotos[order.id] && (
                          <Text style={styles.photoSelectedText}>
                            ✓ Photo selected
                          </Text>
                        )}
                        <Text style={styles.orderHelpText}>
                          You can also upload a photo of the number if you have it on paper.
                        </Text>
                        <View style={styles.orderActions}>
                          <TouchableOpacity
                            style={[styles.orderActionPrimary, creatingShipment[order.id] && styles.orderActionDisabled]}
                            onPress={() => handleCreateShipment(order.id)}
                            disabled={creatingShipment[order.id]}
                          >
                            {creatingShipment[order.id] ? (
                              <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                              <Text style={styles.orderActionPrimaryText}>Save</Text>
                            )}
                          </TouchableOpacity>
                          <TouchableOpacity style={styles.orderActionSecondary}>
                            <Ionicons name="print-outline" size={16} color="#00615E" />
                            <Text style={styles.orderActionSecondaryText}>Print</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={styles.orderActionOutline}>
                            <Text style={styles.orderActionOutlineText}>Details</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  ))}
                </ScrollView>

                {/* View All Button - Hidden for now */}
                {/* {ordersData.total_count > 0 && (
                  <TouchableOpacity style={styles.viewAllButton}>
                    <Text style={styles.viewAllButtonText}>View All</Text>
                  </TouchableOpacity>
                )} */}
              </>
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="checkmark-circle-outline" size={48} color="#00615E" />
                <Text style={styles.emptyText}>No pending orders</Text>
              </View>
            )
          ) : (
            <View style={styles.comingSoonContainer}>
              <Ionicons name="time-outline" size={48} color="#666666" />
              <Text style={styles.comingSoonText}>Coming Soon</Text>
              <Text style={styles.comingSoonSubtext}>
                {activeTab === 'shipped' ? 'Shipped orders' : 'Orders with issues'} will be available soon
              </Text>
            </View>
          )}
        </View>

        {/* My Products Section - Low Stock Products */}
        <LowStockProductsList
          onProductSave={handleProductSave}
          onProductEdit={handleProductEdit}
          onEditVariants={handleEditVariants}
          onSeeAll={handleSeeAllProducts}
        />

        {/* My Reviews Section */}
        <View style={styles.reviewsSection}>
          <View style={styles.reviewsSectionHeader}>
            <Text style={styles.reviewsSectionTitle}>My reviews</Text>
            <Text style={styles.reviewsSectionSubtitle}>Your reputation sells for you</Text>
          </View>

          <View style={styles.reviewsContainer}>
            {/* Review Card 1 */}
            <View style={styles.reviewCard}>
              <View style={styles.reviewContent}>
                <View style={styles.reviewStars}>
                  <Ionicons name="star" size={16} color="#00615E" />
                  <Ionicons name="star" size={16} color="#00615E" />
                  <Ionicons name="star" size={16} color="#00615E" />
                  <Ionicons name="star" size={16} color="#00615E" />
                  <Ionicons name="star" size={16} color="#00615E" />
                </View>
                <Text style={styles.reviewText}>
                  Fast delivery and excellent quality.
                </Text>
                <Text style={styles.reviewAuthor}>- Downtown Store (PRO)</Text>
              </View>
              <TouchableOpacity style={styles.reviewCheckButton}>
                <Ionicons name="checkmark" size={16} color="#00615E" />
              </TouchableOpacity>
            </View>

            {/* Review Card 2 */}
            <View style={styles.reviewCard}>
              <View style={styles.reviewContent}>
                <View style={styles.reviewStars}>
                  <Ionicons name="star" size={16} color="#00615E" />
                  <Ionicons name="star" size={16} color="#00615E" />
                  <Ionicons name="star" size={16} color="#00615E" />
                  <Ionicons name="star" size={16} color="#00615E" />
                  <Ionicons name="star" size={16} color="#00615E" />
                </View>
                <Text style={styles.reviewText}>
                  Good product, packaging could be improved.
                </Text>
                <Text style={styles.reviewAuthor}>- Maria (B2C)</Text>
              </View>
              <TouchableOpacity style={styles.reviewCheckButton}>
                <Ionicons name="checkmark" size={16} color="#00615E" />
              </TouchableOpacity>
            </View>

            {/* Review Card 3 */}
            <View style={styles.reviewCard}>
              <View style={styles.reviewContent}>
                <View style={styles.reviewStars}>
                  <Ionicons name="star" size={16} color="#00615E" />
                  <Ionicons name="star" size={16} color="#00615E" />
                  <Ionicons name="star" size={16} color="#00615E" />
                  <Ionicons name="star" size={16} color="#00615E" />
                  <Ionicons name="star" size={16} color="#00615E" />
                </View>
                <Text style={styles.reviewText}>
                  Very professional, we will buy again.
                </Text>
                <Text style={styles.reviewAuthor}>- Importer (PRO)</Text>
              </View>
              <TouchableOpacity style={styles.reviewCheckButton}>
                <Ionicons name="checkmark" size={16} color="#00615E" />
              </TouchableOpacity>
            </View>
          </View>

          {/* See All Button */}
          <TouchableOpacity style={styles.seeAllButton}>
            <Text style={styles.seeAllButtonText}>See All</Text>
          </TouchableOpacity>
        </View>

        {/* <View style={styles.infoSection}>
          <View style={styles.infoCard}>
            <Ionicons name="information-circle-outline" size={24} color={supplierTheme.colors.text.secondary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoCardTitle}>Account Status</Text>
              <Text style={styles.infoValue}>
                {supplier.is_approved ? 'Approved' : 'Pending Approval'}
              </Text>
            </View>
          </View>
          <View style={styles.infoCard}>
            <Ionicons name="checkmark-circle-outline" size={24} color={supplierTheme.colors.text.secondary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoCardTitle}>Verification</Text>
              <Text style={styles.infoValue}>
                {supplier.is_verified ? 'Verified' : 'Not Verified'}
              </Text>
            </View>
          </View>
        </View> */}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({

  root: {
    flex: 1,
    backgroundColor: supplierTheme.colors.background.default,
  },
  container: {
    flex: 1,
    backgroundColor: supplierTheme.colors.background.default,
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 241,
  },

  content: {
    padding: supplierTheme.spacing.lg,
    paddingTop: 80, // content starts inside gradient
  },

  header: {
    marginBottom: supplierTheme.spacing.xl,
  },

  welcomeText: {
    fontSize: supplierTheme.typography.fontSize.base,
    color: '#E6F2F1',
  },

  nameText: {
    fontSize: supplierTheme.typography.fontSize['2xl'],
    fontWeight: supplierTheme.typography.fontWeight.bold,
    color: '#FFFFFF',
  },

  companyText: {
    fontSize: supplierTheme.typography.fontSize.lg,
    color: '#F1F5F4',
  },

  // Profile Card Styles
  profileCard: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
    padding: 8,
    gap: 12,
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: supplierTheme.spacing.xl,
  },
  profileContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 0,
    gap: 8,
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    backgroundColor: '#000000',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 20,
    color: '#FFFFFF',
  },
  profileInfo: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: 0,
    gap: 4,
    flex: 1,
  },
  greetingText: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 16,
    color: '#000000',
  },
  descriptionText: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 14,
    lineHeight: 17,
    color: '#666666',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 0,
    gap: 4,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
    backgroundColor: '#E0FFFE',
    borderWidth: 1,
    borderColor: '#00615E',
    borderRadius: 8,
  },

  // Info Card Styles
  infoCardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 16,
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: supplierTheme.spacing.xl,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3, // For Android
  },
  infoImagePlaceholder: {
    width: 104,
    backgroundColor: '#E2E2E2',
    borderRadius: 8,
    alignSelf: 'stretch',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoTextContent: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: 0,
    gap: 8,
    width: 209,
  },
  infoTitle: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 19,
    color: '#000000',
  },
  infoDescription: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 14,
    lineHeight: 20,
    color: '#666666',
  },

  // Metrics Grid Styles
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    alignContent: 'flex-start',
    padding: 0,
    gap: 9,
    width: '100%',
    marginBottom: supplierTheme.spacing.xl,
  },
  metricCard: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: 8,
    gap: 8,
    width: '48%', // Changed from fixed 176px to percentage for 2 cards per row
    height: 106,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  metricCardTall: {
    height: 115,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 0,
    gap: 8,
    alignSelf: 'stretch',
  },
  metricLabel: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 14,
    lineHeight: 17,
    color: '#000000',
    flex: 1,
  },
  badge: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
    paddingHorizontal: 8,
    backgroundColor: '#E0FFFE',
    borderRadius: 50,
  },
  badgeText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 12,
    lineHeight: 17,
    color: '#00615E',
  },
  metricContent: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: 0,
    gap: 4,
    alignSelf: 'stretch',
  },
  metricValue: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 16,
    lineHeight: 19,
    color: '#000000',
    alignSelf: 'stretch',
  },
  metricSubtext: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 12,
    lineHeight: 17,
    color: '#666666',
    alignSelf: 'stretch',
  },

  // Orders Section Styles
  ordersSection: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-start',
    padding: 16,
    gap: 16,
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: supplierTheme.spacing.xl,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  ordersSectionTitle: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 24,
    lineHeight: 24,
    color: '#000000',
    alignSelf: 'stretch',
  },
  orderTabs: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
    alignSelf: 'stretch',
    backgroundColor: '#EEEEEF',
    borderRadius: 8,
  },
  orderTab: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
    flex: 1,
    height: 34,
    borderRadius: 4,
  },
  orderTabActive: {
    backgroundColor: '#E0FFFE',
    borderWidth: 1,
    borderColor: '#00615E',
  },
  orderTabText: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 14,
    lineHeight: 14,
    color: '#000000',
  },
  ordersWarning: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 14,
    lineHeight: 20,
    color: '#000000',
    alignSelf: 'stretch',
  },
  ordersScroll: {
    alignSelf: 'stretch',
  },
  ordersScrollContent: {
    gap: 8,
  },
  orderCard: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: 16,
    gap: 16,
    width: 329,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EEEEEF',
    borderRadius: 16,
  },
  orderHeader: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: 0,
    gap: 8,
    alignSelf: 'stretch',
  },
  orderHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 0,
    gap: 8,
    alignSelf: 'stretch',
  },
  orderNumber: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 20,
    lineHeight: 24,
    color: '#000000',
  },
  orderTimeBadge: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
    paddingHorizontal: 8,
    gap: 4,
    backgroundColor: '#F7EFE6',
    borderRadius: 40,
  },
  orderTimeText: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 12,
    lineHeight: 17,
    color: '#000000',
  },
  orderMeta: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 0,
    gap: 8,
  },
  orderMetaText: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 13,
    lineHeight: 18,
    color: '#666666',
  },
  orderContent: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: 0,
    gap: 16,
    alignSelf: 'stretch',
  },
  orderContentTitle: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 19,
    color: '#000000',
    alignSelf: 'stretch',
  },
  trackingInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 0,
    gap: 8,
    alignSelf: 'stretch',
  },
  trackingInput: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 8,
    flex: 1,
    height: 40,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderRadius: 8,
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 14,
    lineHeight: 17,
    color: '#000000',
  },
  photoSelectedText: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 12,
    lineHeight: 17,
    color: '#00615E',
    marginTop: 4,
  },
  trackingPlaceholder: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 14,
    lineHeight: 17,
    color: '#999999',
  },
  photoButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
    paddingHorizontal: 12,
    gap: 4,
    height: 40,
    backgroundColor: '#E0FFFE',
    borderWidth: 1,
    borderColor: '#00615E',
    borderRadius: 8,
  },
  photoButtonText: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 14,
    lineHeight: 17,
    color: '#000000',
  },
  orderHelpText: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 12,
    lineHeight: 17,
    color: '#666666',
    alignSelf: 'stretch',
  },
  orderActions: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 0,
    gap: 8,
    alignSelf: 'stretch',
  },
  orderActionPrimary: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    gap: 8,
    flex: 1,
    height: 40,
    backgroundColor: '#00615E',
    borderRadius: 8,
  },
  orderActionDisabled: {
    opacity: 0.6,
  },
  orderActionPrimaryText: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 16,
    lineHeight: 16,
    color: '#F5F5F5',
  },
  orderActionSecondary: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    gap: 8,
    flex: 1,
    height: 40,
    backgroundColor: '#E0FFFE',
    borderWidth: 1,
    borderColor: '#00615E',
    borderRadius: 8,
  },
  orderActionSecondaryText: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 16,
    lineHeight: 16,
    color: '#000000',
  },
  orderActionOutline: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    gap: 8,
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#00615E',
    borderRadius: 8,
  },
  orderActionOutlineText: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 16,
    lineHeight: 16,
    color: '#000000',
  },

  // Products Section Styles
  productsSection: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-start',
    padding: 16,
    gap: 16,
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: supplierTheme.spacing.xl,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  productsSectionHeader: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: 0,
    gap: 8,
    alignSelf: 'stretch',
  },
  productsSectionTitle: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 24,
    lineHeight: 24,
    color: '#000000',
    alignSelf: 'stretch',
  },
  productsSectionSubtitle: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 14,
    lineHeight: 20,
    color: '#000000',
    alignSelf: 'stretch',
  },
  productsScroll: {
    alignSelf: 'stretch',
  },
  productsScrollContent: {
    gap: 8,
  },
  productCard: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: 16,
    gap: 16,
    alignSelf: 'stretch',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EEEEEF',
    borderRadius: 16,
  },
  productHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 0,
    gap: 16,
    alignSelf: 'stretch',
  },
  productImage: {
    width: 53,
    height: 53,
    backgroundColor: '#A6A6A6',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productInfo: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: 0,
    gap: 8,
    flex: 1,
  },
  productName: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 20,
    lineHeight: 24,
    color: '#000000',
  },
  productCategory: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 13,
    lineHeight: 18,
    color: '#666666',
  },
  productFields: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 0,
    gap: 8,
    alignSelf: 'stretch',
  },
  productField: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: 0,
    gap: 8,
    flex: 1,
  },
  productFieldLabel: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 19,
    color: '#000000',
    alignSelf: 'stretch',
  },
  productFieldInput: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    paddingHorizontal: 16,
    alignSelf: 'stretch',
    height: 40,
    backgroundColor: '#EEEEEF',
    borderRadius: 8,
  },
  productFieldValue: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 16,
    lineHeight: 16,
    color: '#666666',
    flex: 1,
  },
  productActions: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 0,
    gap: 8,
    alignSelf: 'stretch',
  },
  productActionPrimary: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    gap: 8,
    flex: 1,
    height: 40,
    backgroundColor: '#00615E',
    borderRadius: 8,
  },
  productActionPrimaryText: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 16,
    lineHeight: 16,
    color: '#F5F5F5',
  },
  productActionOutline: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    gap: 8,
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#00615E',
    borderRadius: 8,
  },
  productActionOutlineText: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 16,
    lineHeight: 16,
    color: '#000000',
  },
  productActionsThree: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 0,
    gap: 8,
    alignSelf: 'stretch',
  },
  productActionSmallPrimary: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    gap: 8,
    flex: 1,
    height: 40,
    backgroundColor: '#00615E',
    borderRadius: 8,
  },
  productActionMediumOutline: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    gap: 8,
    width: 131,
    height: 40,
    borderWidth: 1,
    borderColor: '#00615E',
    borderRadius: 8,
  },
  productActionSmallOutline: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    gap: 8,
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#00615E',
    borderRadius: 8,
  },
  addProductButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    gap: 8,
    alignSelf: 'stretch',
    height: 40,
    borderWidth: 1,
    borderColor: '#00615E',
    borderRadius: 8,
  },
  addProductButtonText: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 16,
    lineHeight: 16,
    color: '#000000',
  },

  // Reviews Section Styles
  reviewsSection: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-start',
    padding: 16,
    gap: 16,
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: supplierTheme.spacing.xl,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  reviewsSectionHeader: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: 0,
    gap: 8,
    alignSelf: 'stretch',
  },
  reviewsSectionTitle: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 24,
    lineHeight: 24,
    color: '#000000',
    alignSelf: 'stretch',
  },
  reviewsSectionSubtitle: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 14,
    lineHeight: 20,
    color: '#000000',
    alignSelf: 'stretch',
  },
  reviewsContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: 0,
    gap: 8,
    alignSelf: 'stretch',
  },
  reviewCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    gap: 16,
    alignSelf: 'stretch',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EEEEEF',
    borderRadius: 16,
  },
  reviewContent: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: 0,
    gap: 8,
    flex: 1,
  },
  reviewStars: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 0,
    gap: 0,
  },
  reviewText: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 19,
    color: '#000000',
    alignSelf: 'stretch',
  },
  reviewAuthor: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 13,
    lineHeight: 18,
    color: '#666666',
    alignSelf: 'stretch',
  },
  reviewCheckButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
    gap: 8,
    width: 32,
    height: 32,
    backgroundColor: '#E0FFFE',
    borderWidth: 1,
    borderColor: '#00615E',
    borderRadius: 8,
  },
  seeAllButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    gap: 8,
    alignSelf: 'stretch',
    height: 40,
    borderWidth: 1,
    borderColor: '#00615E',
    borderRadius: 8,
  },
  seeAllButtonText: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 16,
    lineHeight: 16,
    color: '#000000',
  },

  welcomeSection: {
    marginBottom: supplierTheme.spacing.sm,
  },

  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: supplierTheme.spacing.xl,
    gap: supplierTheme.spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: supplierTheme.colors.background.paper,
    borderRadius: supplierTheme.borderRadius.md,
    padding: supplierTheme.spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: supplierTheme.colors.border.light,
  },
  statValue: {
    fontSize: supplierTheme.typography.fontSize['2xl'],
    fontWeight: supplierTheme.typography.fontWeight.bold,
    color: supplierTheme.colors.text.primary,
    marginTop: supplierTheme.spacing.sm,
  },
  statLabel: {
    fontSize: supplierTheme.typography.fontSize.sm,
    color: supplierTheme.colors.text.secondary,
    marginTop: supplierTheme.spacing.xs,
  },
  infoSection: {
    gap: supplierTheme.spacing.md,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: supplierTheme.colors.background.paper,
    borderRadius: supplierTheme.borderRadius.md,
    padding: supplierTheme.spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: supplierTheme.colors.border.light,
  },
  infoContent: {
    marginLeft: supplierTheme.spacing.md,
    flex: 1,
  },
  infoCardTitle: {
    fontSize: supplierTheme.typography.fontSize.sm,
    color: supplierTheme.colors.text.secondary,
    marginBottom: supplierTheme.spacing.xs,
  },
  infoValue: {
    fontSize: supplierTheme.typography.fontSize.base,
    fontWeight: supplierTheme.typography.fontWeight.medium,
    color: supplierTheme.colors.text.primary,
  },
  errorText: {
    fontSize: supplierTheme.typography.fontSize.base,
    color: supplierTheme.colors.error.main,
  },

  // Loading, Error, Empty, Coming Soon States
  loadingContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    gap: 12,
  },
  loadingText: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 14,
    color: '#666666',
  },
  errorContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    gap: 12,
  },
  emptyContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    gap: 12,
  },
  emptyText: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    color: '#00615E',
  },
  comingSoonContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    gap: 12,
  },
  comingSoonText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 18,
    color: '#000000',
  },
  comingSoonSubtext: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
  viewAllButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#E0FFFE',
    borderWidth: 1,
    borderColor: '#00615E',
    borderRadius: 8,
    marginTop: 16,
  },
  viewAllButtonText: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 14,
    color: '#00615E',
  },
});
