import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface SoldByProps {
  supplier?: {
    company_name?: string;
    rating?: number;
    total_reviews?: number;
    url?: string;
  };
}

export const SoldBy: React.FC<SoldByProps> = ({ supplier }) => {
  const router = useRouter();

  if (!supplier || !supplier.company_name) return null;

  const rating = supplier.rating || 0;
  const reviewCount = supplier.total_reviews || 0;

  const handlePress = () => {
    if (supplier.url) {
      router.push(`/supplier/${supplier.url}` as any);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.soldByText}>Sold by</Text>
      
      <TouchableOpacity 
        style={styles.supplierInfoContainer}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <Text style={styles.companyName} numberOfLines={1}>
          {supplier.company_name}
        </Text>
        
        {rating > 0 ? (
          <>
            <View style={styles.ratingContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Ionicons 
                  key={star} 
                  name={star <= Math.round(rating) ? "star" : "star-outline"} 
                  size={14} 
                  color="#F1AD3B" 
                />
              ))}
            </View>
            
            <Text style={styles.ratingText}>{rating.toFixed(1)}({reviewCount})</Text>
          </>
        ) : null}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6, // Adding a slight top margin so it spaces nicely below product name
  },
  soldByText: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 14,
    lineHeight: 17,
    color: '#0A292D',
  },
  supplierInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 1, // Ensures name truncates nicely on smaller screens
  },
  companyName: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 14,
    lineHeight: 17,
    color: '#00615E',
    flexShrink: 1,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 14,
    lineHeight: 17,
    color: '#0A292D',
  },
});

export default SoldBy;
