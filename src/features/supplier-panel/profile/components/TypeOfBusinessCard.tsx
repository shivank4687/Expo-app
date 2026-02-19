import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ViewStyle, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface TypeOfBusinessCardProps {
    expanded: boolean;
    onToggle: () => void;
    styles: {
        businessCard: ViewStyle;
        businessHeader: ViewStyle;
        businessIconBg: ViewStyle;
        businessTextContainer: ViewStyle;
        businessTitle: TextStyle;
        businessDescription: TextStyle;
        chevronContainer: ViewStyle;
        doneBadge: ViewStyle;
        doneText: TextStyle;
        formSection: ViewStyle;
        inputRow: ViewStyle;
        inputLabel: TextStyle;
        inputChip: ViewStyle;
        inputText: TextStyle;
        noticeText: TextStyle;
    };
}

export default function TypeOfBusinessCard({
    expanded,
    onToggle,
    styles,
}: TypeOfBusinessCardProps) {
    const [selectedOption, setSelectedOption] = useState<string | null>(null);

    const options = [
        {
            value: 'artisan',
            label: 'Artisan / Local shop / Independent professional',
        },
        {
            value: 'company',
            label: 'Company / Business',
        },
    ];

    const renderOption = (option: typeof options[number]) => {
        const isSelected = selectedOption === option.value;
        return (
            <TouchableOpacity
                key={option.value}
                style={[
                    styles.businessOption,
                    isSelected && styles.businessOptionSelected,
                ]}
                onPress={() => setSelectedOption(option.value)}
                activeOpacity={0.7}
            >
                <Ionicons
                    name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
                    size={20}
                    color={isSelected ? '#00615E' : '#7D8A8C'}
                />
                <Text
                    style={[
                        styles.optionLabel,
                        isSelected && styles.optionLabelSelected,
                    ]}
                >
                    {option.label}
                </Text>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.businessCard}>
            <TouchableOpacity
                style={styles.businessHeader}
                onPress={onToggle}
                activeOpacity={0.7}
            >
                <View style={styles.businessIconBg}>
                    <Ionicons name="cube-outline" size={16} color="#FFFFFF" />
                </View>

                <View style={styles.businessTextContainer}>
                    <Text style={styles.businessTitle}>Type of business</Text>
                    <Text style={styles.businessDescription}>Define how you sell today</Text>
                </View>

                <View style={styles.chevronContainer}>
                    <Ionicons
                        name={expanded ? 'chevron-up' : 'chevron-down'}
                        size={16}
                        color="#0A292D"
                    />
                </View>

                <View style={styles.doneBadge}>
                    <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
                    <Text style={styles.doneText}>Done</Text>
                </View>
            </TouchableOpacity>

            {expanded && (
                <View style={styles.formSection}>
                    {options.map(renderOption)}
                    <Text style={styles.noticeText} />
                </View>
            )}
        </View>
    );
}
