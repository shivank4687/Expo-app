import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAppSelector } from '@/store/hooks';
import { COLORS } from '@/features/supplier-panel/styles';
import { ListIcon, GridIcon } from '@/assets/icons';
import { ProductCard, ProductListCard } from '@/features/supplier-panel/components';
import { useProductsList } from '@/features/supplier-panel/products/hooks/useProductsList';
import type { Product } from '@/features/supplier-panel/products/types/products.types';

type ViewMode = 'list' | 'grid';

export default function ProductsScreen() {
  const { supplier, isAuthenticated } = useAppSelector((state) => state.supplierAuth);
  const [viewMode, setViewMode] = useState<ViewMode>('grid'); // Default to grid
  const router = useRouter();

  // Fetch products from API with infinite scroll
  const { products, loading, isLoadingMore, isRefreshing, error, hasMore, loadMore, refresh } = useProductsList();

  if (!isAuthenticated || !supplier) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Not authenticated</Text>
      </View>
    );
  }

  const renderFooter = () => {
    if (!isLoadingMore) return null;

    return (
      <View style={styles.loadingMore}>
        <ActivityIndicator size="small" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading more products...</Text>
      </View>
    );
  };

  const renderEmpty = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.stateText}>Loading products...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.stateContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={COLORS.error} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={refresh}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.stateContainer}>
        <Ionicons name="cube-outline" size={64} color={COLORS.textSecondary} />
        <Text style={styles.emptyText}>No products found</Text>
        <Text style={styles.emptySubtext}>Add your first product to get started</Text>
      </View>
    );
  };

  return (
    <View style={styles.root}>
      {/* Fixed Header with Title and View Toggle */}
      <View style={styles.fixedHeader}>
        <View style={styles.header}>
          <Text style={styles.title}>My Products</Text>

          <View style={styles.viewToggle}>
            {/* Grid View Button */}
            <TouchableOpacity
              style={[
                styles.toggleButton,
                viewMode === 'grid' && styles.toggleButtonActive
              ]}
              onPress={() => setViewMode('grid')}
            >
              <GridIcon
                width={14}
                height={14}
                color={COLORS.black}
              />
            </TouchableOpacity>

            {/* List View Button */}
            <TouchableOpacity
              style={[
                styles.toggleButton,
                viewMode === 'list' && styles.toggleButtonActive
              ]}
              onPress={() => setViewMode('list')}
            >
              <ListIcon
                width={14}
                height={10}
                color={COLORS.black}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Add Product Button */}
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/(supplier-drawer)/add-product')}
        >
          <Ionicons name="add" size={16} color={COLORS.black} />
          <Text style={styles.addButtonText}>Add Product</Text>
        </TouchableOpacity>
      </View>

      {/* Products List */}
      <FlatList
        key={viewMode} // Force re-render when view mode changes
        data={products}
        keyExtractor={(item) => item.id.toString()}
        numColumns={viewMode === 'grid' ? 2 : 1}
        columnWrapperStyle={viewMode === 'grid' && products.length > 0 ? styles.productsRow : undefined}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        renderItem={({ item }: { item: Product }) => {
          if (viewMode === 'grid') {
            return (
              <View style={styles.productItem}>
                <ProductCard
                  id={item.id}
                  name={item.name}
                  price={item.formatted_price}
                  status={item.status}
                  stock={item.stock}
                  imageUrl={item.image_url}
                  onEdit={() => console.log('Edit product:', item.id)}
                />
              </View>
            );
          } else {
            return (
              <ProductListCard
                id={item.id}
                name={item.name}
                price={item.formatted_price}
                status={item.status}
                stock={item.stock}
                imageUrl={item.image_url}
                onEdit={() => console.log('Edit product:', item.id)}
              />
            );
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Fixed Header Container
  fixedHeader: {
    backgroundColor: COLORS.background,
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },

  // List Content
  listContent: {
    padding: 16,
    paddingTop: 16,
  },

  // Header Styles
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 0,
    gap: 16,
    width: '100%',
    height: 32,
    marginBottom: 24,
  },
  title: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 24,
    lineHeight: 24,
    color: COLORS.black,
    flex: 0,
  },

  // View Toggle Styles
  viewToggle: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 0,
    gap: 8,
    height: 32,
  },
  toggleButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    paddingHorizontal: 16,
    width: 32,
    height: 32,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 8,
  },
  toggleButtonActive: {
    backgroundColor: COLORS.primaryLight,
  },

  // Add Product Button
  addButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    gap: 8,
    width: '100%',
    height: 40,
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 8,
    marginBottom: 24,
  },
  addButtonText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: 16,
    lineHeight: 18,
    color: COLORS.black,
  },

  // Products Grid
  productsRow: {
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  productItem: {
    width: '48%',
  },

  // Loading More
  loadingMore: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginLeft: 8,
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  loadingContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
    gap: 16,
  },

  // State Containers
  stateContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 60,
    gap: 16,
  },
  stateText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  emptyText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 20,
    color: COLORS.textPrimary,
  },
  emptySubtext: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 8,
    marginTop: 8,
  },
  retryButtonText: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    color: COLORS.primary,
  },

  errorText: {
    fontSize: 16,
    color: COLORS.error,
  },
});
