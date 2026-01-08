import React, { useState, forwardRef, useImperativeHandle } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/features/supplier-panel/styles';

export interface SettingsCardRef {
    getData: () => {
        status: number;
        new: number;
        featured: number;
        guest_checkout: number;
        visible_individually: number;
    };
}

const SettingsCard = forwardRef<SettingsCardRef, {}>((props, ref) => {
    const [isNewProduct, setIsNewProduct] = useState(true);
    const [isFeatured, setIsFeatured] = useState(true);
    const [allowGuestCheckout, setAllowGuestCheckout] = useState(true);
    const [visibleIndividually, setVisibleIndividually] = useState(true);

    useImperativeHandle(ref, () => ({
        getData: () => ({
            status: 0, // Always published when using this form
            new: isNewProduct ? 1 : 0,
            featured: isFeatured ? 1 : 0,
            guest_checkout: allowGuestCheckout ? 1 : 0,
            visible_individually: visibleIndividually ? 1 : 0,
        })
    }));

    const CheckboxRow = ({
        label,
        value,
        onToggle
    }: {
        label: string;
        value: boolean;
        onToggle: () => void;
    }) => (
        <View style={styles.checkboxRow}>
            <TouchableOpacity
                style={styles.checkbox}
                onPress={onToggle}
                activeOpacity={0.7}
            >
                {value && <View style={styles.checkboxChecked} />}
            </TouchableOpacity>
            <TouchableOpacity
                style={styles.checkboxContent}
                onPress={onToggle}
                activeOpacity={0.7}
            >
                <Text style={styles.checkboxLabel}>{label}</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.card}>
            {/* Card Title */}
            <View style={styles.titleContainer}>
                <Text style={styles.cardTitle}>4) Settings</Text>
            </View>

            {/* Content */}
            <View style={styles.content}>
                {/* Row 1: New Product & Featured */}
                <View style={styles.row}>
                    <View style={styles.halfWidth}>
                        <CheckboxRow
                            label="New Product"
                            value={isNewProduct}
                            onToggle={() => setIsNewProduct(!isNewProduct)}
                        />
                    </View>
                    <View style={styles.halfWidth}>
                        <CheckboxRow
                            label="Featured"
                            value={isFeatured}
                            onToggle={() => setIsFeatured(!isFeatured)}
                        />
                    </View>
                </View>

                {/* Row 2: Guest Checkout & Visible Individually */}
                <View style={styles.row}>
                    <View style={styles.halfWidth}>
                        <CheckboxRow
                            label="Guest Checkout"
                            value={allowGuestCheckout}
                            onToggle={() => setAllowGuestCheckout(!allowGuestCheckout)}
                        />
                    </View>
                    <View style={styles.halfWidth}>
                        <CheckboxRow
                            label="Visible Individually"
                            value={visibleIndividually}
                            onToggle={() => setVisibleIndividually(!visibleIndividually)}
                        />
                    </View>
                </View>

                {/* Info Text */}
                <Text style={styles.infoText}>
                    These settings control product visibility and checkout options.
                </Text>
            </View>
        </View>
    );
});

export default SettingsCard;

const styles = StyleSheet.create({
    card: {
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'flex-start',
        padding: 16,
        gap: 8,
        width: '100%',
        backgroundColor: COLORS.white,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 3,
        borderRadius: 16,
    },
    titleContainer: {
        width: '100%',
    },
    cardTitle: {
        fontFamily: 'Inter',
        fontWeight: '500',
        fontSize: 20,
        lineHeight: 24,
        color: '#000000',
    },
    content: {
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 12,
        width: '100%',
    },
    row: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    halfWidth: {
        flex: 1,
    },
    checkboxRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        width: '100%',
    },
    checkbox: {
        width: 16,
        height: 16,
        backgroundColor: '#EEEEEF',
        borderWidth: 1,
        borderColor: '#666666',
        borderRadius: 4,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxChecked: {
        width: 10,
        height: 10,
        backgroundColor: COLORS.primary,
        borderRadius: 2,
    },
    checkboxContent: {
        flex: 1,
    },
    checkboxLabel: {
        fontFamily: 'Inter',
        fontWeight: '500',
        fontSize: 16,
        lineHeight: 19,
        color: '#000000',
    },
    infoText: {
        fontFamily: 'Inter',
        fontWeight: '400',
        fontSize: 12,
        lineHeight: 16,
        color: '#666666',
        marginTop: 4,
    },
});
