import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';

interface PriceBadgeProps {
  priceLabel?: string;
  formattedPrice: string;
  formattedRegularPrice?: string;
  style?: ViewStyle;
}

export const PriceBadge: React.FC<PriceBadgeProps> = ({ priceLabel, formattedPrice, formattedRegularPrice, style }) => {
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.text}>
        {priceLabel ? `${priceLabel} ` : ''}{formattedPrice}
      </Text>
      {formattedRegularPrice ? (
        <Text style={styles.originalPriceText}>{formattedRegularPrice}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 50,
    gap: 6, // Slightly reduced to fit both regular and special prices cleanly
    // Adding optional subtle shadow for visibility over images
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  text: {
    color: '#00615E',
    fontSize: 11,
    fontWeight: '600', // Typically numeric font weights fall back properly or map safely
    lineHeight: 15, // 140% of 11px is approximately 15px
  },
  originalPriceText: {
    color: '#9CA3AF',
    fontSize: 10,
    fontWeight: '400',
    textDecorationLine: 'line-through',
    lineHeight: 14,
  },
});

export default PriceBadge;
