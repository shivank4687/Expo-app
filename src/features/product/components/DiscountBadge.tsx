import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';

interface DiscountBadgeProps {
  discountPercent: number;
  label?: string;
  style?: ViewStyle;
}

export const DiscountBadge: React.FC<DiscountBadgeProps> = ({ 
  discountPercent, 
  label = 'Flash', 
  style 
}) => {
  if (!discountPercent || discountPercent <= 0) return null;

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.text}>
        -{discountPercent}% {label}
      </Text>
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
    gap: 10,
    // Provide a subtle shadow if it's over an image
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  text: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 11,
    lineHeight: 15,
    color: '#00615E',
  },
});

export default DiscountBadge;
