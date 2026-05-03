import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StyleProp, ViewStyle } from 'react-native';
import { QtyUpdate } from './QtyUpdate';
import { theme } from '@/theme';

interface ProductTotalsProps {
  price?: string;
  deliveryText?: string;
  quantity?: number;
  onIncreaseQty?: () => void;
  onDecreaseQty?: () => void;
  showRfq?: boolean;
  onRfqPress?: () => void;
  rfqText?: string;
  onAddToCart?: () => void;
  addToCartText?: string;
  isAddingToCart?: boolean;
  showAddToCart?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const ProductTotals: React.FC<ProductTotalsProps> = ({
  price = 'MX$ 499',
  deliveryText = 'Delivery 22 Dec - 24 Dec',
  quantity = 1,
  onIncreaseQty,
  onDecreaseQty,
  showRfq = false,
  onRfqPress,
  rfqText = 'Request Quote',
  onAddToCart,
  addToCartText = 'Add to Cart',
  isAddingToCart = false,
  showAddToCart = true,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      {/* Top Row: Price & Delivery / QtyUpdate */}
      <View style={styles.topRow}>
        <View style={styles.priceColumn}>
          <Text style={styles.price}>{price}</Text>
          <Text style={styles.deliveryText}>{deliveryText}</Text>
        </View>

        {/* Aligning QtyUpdate inside the layout structure */}
        <View style={styles.qtyContainer}>
          <QtyUpdate
            quantity={quantity}
            onIncrease={onIncreaseQty}
            onDecrease={onDecreaseQty}
          />
        </View>
      </View>

      {/* Bottom Row: Action Buttons */}
      {(showAddToCart || showRfq) ? (
        <View style={styles.buttonRow}>
          {showRfq && (
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={onRfqPress}
              activeOpacity={0.7}
            >
              <Text style={styles.secondaryButtonText}>{rfqText}</Text>
            </TouchableOpacity>
          )}

          {showAddToCart && (
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={onAddToCart}
              activeOpacity={0.7}
              disabled={isAddingToCart}
            >
              <Text style={styles.primaryButtonText}>{addToCartText}</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    padding: theme.spacing.sm,
    gap: 4,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E9E3D3',
    borderRadius: 8,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    width: '100%',
  },
  priceColumn: {
    flexDirection: 'column',
    padding: 8,
    gap: 4,
    flex: 1,
  },
  price: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 14,
    lineHeight: 17,
    color: '#00615E',
  },
  deliveryText: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 11,
    lineHeight: 15,
    color: '#0A292D',
  },
  qtyContainer: {
    padding: 4, // Spacing matching Figma layout
    justifyContent: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '100%',
    paddingTop: 4,
  },
  secondaryButton: {
    flex: 1,
    height: 40,
    backgroundColor: '#EAECE1',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    color: '#0A292D',
  },
  primaryButton: {
    flex: 1,
    height: 40,
    backgroundColor: '#00615E',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonText: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    color: '#F5F5F5',
  },
});

export default ProductTotals;
