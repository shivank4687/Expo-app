import React from 'react';
import { View, Text, StyleSheet, ViewStyle, StyleProp } from 'react-native';

interface TierPriceCardProps {
  label?: string;
  price?: string;
  unitLabel?: string;
  style?: StyleProp<ViewStyle>;
}

export const TierPriceCard: React.FC<TierPriceCardProps> = ({
  label = '2+ Units',
  price = 'MX$ 499',
  unitLabel = '/pc',
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.innerContainer}>
        <Text style={styles.unitsLabel} numberOfLines={1}>{label}</Text>
        
        <View style={styles.priceRow}>
          <Text style={styles.priceText} numberOfLines={1}>{price}</Text>
          <Text style={styles.unitText}>{unitLabel}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'center', // Helps center inner vertical alignment
    paddingHorizontal: 8,
    paddingVertical: 6, // Figma says 8, tweaking slightly for perfect 52 box-sizing fit with text line heights
    minWidth: 100, // flexible width to content if longer but ~112px default
    height: 52,
    borderWidth: 1,
    borderColor: '#E9E3D3',
    borderRadius: 8,
    backgroundColor: '#FFFFFF', 
  },
  innerContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 4,
  },
  unitsLabel: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 11,
    lineHeight: 15,
    color: '#0A292D',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline', 
    gap: 4,
  },
  priceText: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 14,
    lineHeight: 17,
    color: '#00615E',
  },
  unitText: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 14,
    lineHeight: 17,
    color: '#000000',
  },
});

export default TierPriceCard;
