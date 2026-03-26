import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface QtyUpdateProps {
  quantity?: number;
  onIncrease?: () => void;
  onDecrease?: () => void;
  minQuantity?: number;
  maxQuantity?: number;
  style?: StyleProp<ViewStyle>;
}

export const QtyUpdate: React.FC<QtyUpdateProps> = ({
  quantity = 12, // Defaulting to 12 as per the Figma spec you provided
  onIncrease,
  onDecrease,
  minQuantity = 1,
  maxQuantity = 99,
  style,
}) => {
  const isMin = quantity <= minQuantity;
  const isMax = quantity >= maxQuantity;

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity
        style={[styles.button, isMin && styles.buttonDisabled]}
        onPress={onDecrease}
        disabled={isMin}
        activeOpacity={0.7}
      >
        <Ionicons name="remove" size={16} color={isMin ? '#9CA3AF' : '#000000'} />
      </TouchableOpacity>

      <Text style={styles.quantityText} numberOfLines={1}>
        {quantity}
      </Text>

      <TouchableOpacity
        style={[styles.button, isMax && styles.buttonDisabled]}
        onPress={onIncrease}
        disabled={isMax}
        activeOpacity={0.7}
      >
        <Ionicons name="add" size={16} color={isMax ? '#9CA3AF' : '#000000'} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
    gap: 8,
    width: 100,
    height: 40,
    borderWidth: 1,
    borderColor: '#E9E3D3',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
    backgroundColor: '#FCF7EA',
    borderRadius: 8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  quantityText: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 11,
    lineHeight: 15,
    color: '#0A292D',
    textAlign: 'center',
    minWidth: 12,
  },
});

export default QtyUpdate;
