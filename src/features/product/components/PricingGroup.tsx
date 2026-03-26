import React from 'react';
import { View, StyleSheet, ScrollView, StyleProp, ViewStyle } from 'react-native';
import { TierPriceCard } from './TierPriceCard';
import { CustomerGroupPricingOffer } from '../types/product.types';

interface PricingGroupProps {
  offers: CustomerGroupPricingOffer[];
  style?: StyleProp<ViewStyle>;
}

export const PricingGroup: React.FC<PricingGroupProps> = ({ offers, style }) => {
  if (!offers || offers.length === 0) return null;

  return (
    <View style={[styles.container, style]}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        {offers.map((offer, index) => {
          const nextOffer = offers[index + 1];
          let label = `${offer.qty}+ Units`;
          
          if (nextOffer) {
            const maxQty = nextOffer.qty - 1;
            label = offer.qty === maxQty ? `${offer.qty} Unit${offer.qty > 1 ? 's' : ''}` : `${offer.qty}-${maxQty} Units`;
          } else if (offer.qty === 1) {
             label = '1 Unit';
          }

          return (
            <TierPriceCard 
              key={index} 
              label={label} 
              price={offer.formatted_price} 
              unitLabel="/pc" 
            />
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    alignItems: 'stretch', // Allow inner items to flow normally
    paddingHorizontal: 8,
    paddingVertical: 8, // Snug top and bottom padding
    gap: 4,
    width: '100%', 
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E9E3D3',
    borderRadius: 8,
  },
  scrollContainer: {
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  }
});

export default PricingGroup;
