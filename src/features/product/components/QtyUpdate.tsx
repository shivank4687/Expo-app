import React, { useState, useEffect } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface QtyUpdateProps {
  quantity?: number;
  onIncrease?: () => void;
  onDecrease?: () => void;
  onQuantityChange?: (qty: number) => void;
  minQuantity?: number;
  maxQuantity?: number;
  style?: StyleProp<ViewStyle>;
}

export const QtyUpdate: React.FC<QtyUpdateProps> = ({
  quantity = 1,
  onIncrease,
  onDecrease,
  onQuantityChange,
  minQuantity = 1,
  maxQuantity = 99,
  style,
}) => {
  const isMin = quantity <= minQuantity;
  const isMax = quantity >= maxQuantity;

  // Local string state so the user can type freely; we commit on blur/submit
  const [inputValue, setInputValue] = useState(String(quantity));

  // Keep local value in sync when parent changes qty (e.g. via + / - buttons)
  useEffect(() => {
    setInputValue(String(quantity));
  }, [quantity]);

  const commitValue = (raw: string) => {
    const parsed = parseInt(raw, 10);
    if (isNaN(parsed) || parsed < minQuantity) {
      setInputValue(String(minQuantity));
      onQuantityChange?.(minQuantity);
    } else if (parsed > maxQuantity) {
      setInputValue(String(maxQuantity));
      onQuantityChange?.(maxQuantity);
    } else {
      setInputValue(String(parsed));
      onQuantityChange?.(parsed);
    }
  };

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

      <TextInput
        style={styles.quantityInput}
        value={inputValue}
        onChangeText={(text) => {
          // Allow only numeric characters while typing
          const numeric = text.replace(/[^0-9]/g, '');
          setInputValue(numeric);
          // Immediately notify parent so quantity state is always current
          const parsed = parseInt(numeric, 10);
          if (!isNaN(parsed) && parsed >= minQuantity && parsed <= maxQuantity) {
            onQuantityChange?.(parsed);
          }
        }}
        onBlur={() => commitValue(inputValue)}
        onSubmitEditing={() => commitValue(inputValue)}
        keyboardType="numeric"
        maxLength={3}
        selectTextOnFocus
        textAlign="center"
      />

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
    gap: 6,
    width: 130,
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
    width: 28,
    height: 28,
    backgroundColor: '#FCF7EA',
    borderRadius: 6,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  quantityInput: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 13,
    lineHeight: 18,
    color: '#0A292D',
    textAlign: 'center',
    minWidth: 40,
    flex: 1,
    paddingVertical: 0,
    paddingHorizontal: 2,
  },
});

export default QtyUpdate;
