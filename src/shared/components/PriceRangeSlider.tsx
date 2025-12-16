import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import { theme } from '@/theme';
import { formatters } from '@/shared/utils/formatters';

interface PriceRangeSliderProps {
    minPrice: number;
    maxPrice: number;
    defaultMin?: number;
    defaultMax?: number;
    onRangeChange: (min: number, max: number) => void;
}

export const PriceRangeSlider: React.FC<PriceRangeSliderProps> = ({
    minPrice,
    maxPrice,
    defaultMin,
    defaultMax,
    onRangeChange,
}) => {
    const [minValue, setMinValue] = useState(defaultMin || minPrice);
    const [maxValue, setMaxValue] = useState(defaultMax || maxPrice);

    useEffect(() => {
        if (defaultMin !== undefined) setMinValue(defaultMin);
        if (defaultMax !== undefined) setMaxValue(defaultMax);
    }, [defaultMin, defaultMax]);

    const handleMinChange = (value: number) => {
        const newMin = Math.min(value, maxValue - 1);
        setMinValue(newMin);
        onRangeChange(newMin, maxValue);
    };

    const handleMaxChange = (value: number) => {
        const newMax = Math.max(value, minValue + 1);
        setMaxValue(newMax);
        onRangeChange(minValue, newMax);
    };

    return (
        <View style={styles.container}>
            <View style={styles.priceDisplay}>
                <Text style={styles.priceText}>{formatters.formatPrice(minValue)}</Text>
                <Text style={styles.separator}>-</Text>
                <Text style={styles.priceText}>{formatters.formatPrice(maxValue)}</Text>
            </View>

            <View style={styles.sliderContainer}>
                <Text style={styles.label}>Min</Text>
                <Slider
                    style={styles.slider}
                    minimumValue={minPrice}
                    maximumValue={maxPrice}
                    value={minValue}
                    onValueChange={handleMinChange}
                    minimumTrackTintColor={theme.colors.primary[500]}
                    maximumTrackTintColor={theme.colors.gray[300]}
                    thumbTintColor={theme.colors.primary[500]}
                    step={1}
                />
            </View>

            <View style={styles.sliderContainer}>
                <Text style={styles.label}>Max</Text>
                <Slider
                    style={styles.slider}
                    minimumValue={minPrice}
                    maximumValue={maxPrice}
                    value={maxValue}
                    onValueChange={handleMaxChange}
                    minimumTrackTintColor={theme.colors.primary[500]}
                    maximumTrackTintColor={theme.colors.gray[300]}
                    thumbTintColor={theme.colors.primary[500]}
                    step={1}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingVertical: theme.spacing.md,
    },
    priceDisplay: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: theme.spacing.lg,
    },
    priceText: {
        fontSize: theme.typography.fontSize.lg,
        fontWeight: theme.typography.fontWeight.semiBold,
        color: theme.colors.text.primary,
    },
    separator: {
        marginHorizontal: theme.spacing.md,
        fontSize: theme.typography.fontSize.lg,
        color: theme.colors.text.secondary,
    },
    sliderContainer: {
        marginBottom: theme.spacing.sm,
    },
    label: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.text.secondary,
        marginBottom: theme.spacing.xs,
        fontWeight: theme.typography.fontWeight.medium,
    },
    slider: {
        width: '100%',
        height: 40,
    },
});
