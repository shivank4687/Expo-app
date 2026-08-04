import React from 'react';
import { View, StyleSheet, ScrollView, StyleProp, ViewStyle } from 'react-native';
import { TierPriceCard } from './TierPriceCard';
import { CustomerGroupPricingOffer, SupplierInfo } from '../types/product.types';
import { useAppSelector } from '@/store/hooks';
import { formatters } from '@/shared/utils/formatters';

interface PricingGroupProps {
  offers: CustomerGroupPricingOffer[];
  supplier?: SupplierInfo;
  currencySymbol?: string;
  style?: StyleProp<ViewStyle>;
}

export const PricingGroup: React.FC<PricingGroupProps> = ({ offers, supplier, currencySymbol = '$', style }) => {
  const { user } = useAppSelector((state) => state.auth);

  if (!offers || offers.length === 0) return null;

  // Determine if multiplier should be applied (not wholesale group, and setting is enabled)
  const isWholesale = user?.group?.code === 'wholesale' || user?.customer_group_id === 3;
  const shouldApplyMultiplier = !isWholesale && supplier?.special_price_from_wholesale;
  const multiplier = shouldApplyMultiplier ? (supplier?.wholesale_price_multiplier ?? 1.0) : 1.0;

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

          // Apply multiplier to the raw price if needed and format as currency
          const rawPrice = typeof offer.price === 'string' ? parseFloat(offer.price) : (offer.price || 0);
          const finalPrice = rawPrice * multiplier;
          const displayPrice = shouldApplyMultiplier 
            ? formatters.formatPrice(finalPrice, currencySymbol) 
            : offer.formatted_price;

          return (
            <TierPriceCard 
              key={index} 
              label={label} 
              price={displayPrice} 
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
