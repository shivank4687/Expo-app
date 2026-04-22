import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Clipboard, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { TopHeader } from '@/shared/components/TopHeader';
import { theme } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { Promotion, PromotionCondition, promotionsApi } from '../api/promotions.api';
import { useToast } from '@/shared/components/Toast';

// Maps Bagisto attribute codes to human-readable labels
const ATTRIBUTE_LABELS: Record<string, string> = {
    'cart|base_sub_total':    'Min. order',
    'cart|base_total_qty':   'Min. items',
    'cart|total_qty':        'Min. items',
    'cart|base_grand_total': 'Min. total',
};

const OPERATOR_LABELS: Record<string, string> = {
    '>=': '≥',
    '<=': '≤',
    '>':  '>',
    '<':  '<',
    '==': '=',
    '{}': 'contains',
    '!{}': 'does not contain',
};

function formatCondition(cond: PromotionCondition): string {
    const label = ATTRIBUTE_LABELS[cond.attribute] ?? cond.attribute.replace('|', ' ');
    const op    = OPERATOR_LABELS[cond.operator] ?? cond.operator;
    const val   = cond.attribute_type === 'price' ? `$${cond.value}` : cond.value;
    return `${label} ${op} ${val}`;
}

export const PromotionsScreen: React.FC = () => {
    const { t } = useTranslation();
    const router = useRouter();
    const { showToast } = useToast();
    const [promotions, setPromotions] = useState<Promotion[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchPromotions = async () => {
            try {
                const data = await promotionsApi.getPromotions();
                setPromotions(data);
            } catch (error) {
                console.error('Error fetching promotions:', error);
                showToast({
                    message: t('common.errorFetchingPromotions', 'Could not load promotions.'),
                    type: 'error',
                });
            } finally {
                setIsLoading(false);
            }
        };

        fetchPromotions();
    }, []);

    const copyToClipboard = (code: string) => {
        Clipboard.setString(code);
        showToast({
            message: t('common.codeCopied', 'Coupon code copied to clipboard!'),
            type: 'success',
        });
    };

    const renderPromotionItem = ({ item }: { item: Promotion }) => {
        const discountText = item.action_type === 'by_percent' 
            ? `${Math.round(item.discount_amount)}% OFF`
            : `${item.discount_amount} OFF`;

        const hasConditions = Array.isArray(item.conditions) && item.conditions.length > 0;
        const conditionLabel = item.condition_type === 2 ? 'Meet any of:' : 'Requirements:';

        return (
            <View style={styles.promoCard}>
                <View style={styles.cardHeader}>
                    <View style={styles.discountBadge}>
                        <Text style={styles.discountText}>{discountText}</Text>
                    </View>
                    {item.free_shipping && (
                        <View style={[styles.discountBadge, styles.freeShippingBadge]}>
                            <Text style={styles.discountText}>FREE SHIPPING</Text>
                        </View>
                    )}
                </View>

                <View style={styles.cardContent}>
                    <Text style={styles.promoName}>{item.name}</Text>
                    {item.description && (
                        <Text style={styles.promoDescription}>{item.description}</Text>
                    )}

                    {/* Conditions / Requirements */}
                    {hasConditions && (
                        <View style={styles.conditionsSection}>
                            <Text style={styles.conditionsLabel}>{conditionLabel}</Text>
                            {item.conditions.map((cond, idx) => (
                                <View key={idx} style={styles.conditionRow}>
                                    <Ionicons name="checkmark-circle-outline" size={14} color={theme.colors.primary[500]} />
                                    <Text style={styles.conditionText}>{formatCondition(cond)}</Text>
                                </View>
                            ))}
                        </View>
                    )}

                    {item.coupon_code && (
                        <View style={styles.couponSection}>
                            <View style={styles.codeContainer}>
                                <Text style={styles.codeText}>{item.coupon_code}</Text>
                            </View>
                            <TouchableOpacity 
                                style={styles.copyButton}
                                onPress={() => copyToClipboard(item.coupon_code!)}
                            >
                                <Ionicons name="copy-outline" size={20} color={theme.colors.primary[500]} />
                                <Text style={styles.copyButtonText}>COPY</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {item.ends_till && (
                        <View style={styles.expiryRow}>
                            <Ionicons name="time-outline" size={14} color={theme.colors.gray[500]} />
                            <Text style={styles.expiryText}>
                                Expires: {new Date(item.ends_till).toLocaleDateString()}
                            </Text>
                        </View>
                    )}
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <TopHeader 
                title={t('account.coupons', 'Coupons & Promotions')}
                onBack={() => router.back()}
            />
            
            {isLoading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={theme.colors.primary[500]} />
                </View>
            ) : (promotions?.length ?? 0) === 0 ? (
                <View style={styles.centerContainer}>
                    <View style={styles.emptyIconContainer}>
                        <Ionicons name="pricetag-outline" size={60} color={theme.colors.gray[300]} />
                    </View>
                    <Text style={styles.emptyTitle}>No active promotions</Text>
                    <Text style={styles.emptySubtitle}>Check back later for new discounts and offers.</Text>
                </View>
            ) : (
                <FlatList
                    data={promotions}
                    renderItem={renderPromotionItem}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background.default,
    },
    listContent: {
        padding: theme.spacing.lg,
    },
    promoCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: theme.borderRadius.lg,
        marginBottom: theme.spacing.lg,
        borderWidth: 1,
        borderColor: theme.colors.gray[100],
        ...theme.shadows.sm,
        overflow: 'hidden',
    },
    cardHeader: {
        flexDirection: 'row',
        padding: theme.spacing.md,
        gap: theme.spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.gray[50],
        backgroundColor: 'rgba(0, 97, 94, 0.02)',
    },
    discountBadge: {
        backgroundColor: theme.colors.primary[500],
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: 4,
        borderRadius: theme.borderRadius.sm,
    },
    freeShippingBadge: {
        backgroundColor: '#BB5625',
    },
    discountText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '700',
        fontFamily: Platform.OS === 'ios' ? 'Inter' : 'sans-serif',
    },
    cardContent: {
        padding: theme.spacing.md,
    },
    promoName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#000000',
        marginBottom: theme.spacing.xs,
        fontFamily: Platform.OS === 'ios' ? 'Inter' : 'sans-serif',
    },
    promoDescription: {
        fontSize: 14,
        color: theme.colors.gray[600],
        lineHeight: 20,
        marginBottom: theme.spacing.md,
        fontFamily: Platform.OS === 'ios' ? 'Inter' : 'sans-serif',
    },
    conditionsSection: {
        backgroundColor: 'rgba(0, 97, 94, 0.05)',
        borderRadius: theme.borderRadius.sm,
        padding: theme.spacing.sm,
        marginBottom: theme.spacing.md,
        borderLeftWidth: 3,
        borderLeftColor: theme.colors.primary[400],
    },
    conditionsLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: theme.colors.primary[600],
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 6,
        fontFamily: Platform.OS === 'ios' ? 'Inter' : 'sans-serif',
    },
    conditionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 3,
    },
    conditionText: {
        fontSize: 13,
        color: theme.colors.gray[700],
        fontFamily: Platform.OS === 'ios' ? 'Inter' : 'sans-serif',
    },
    couponSection: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.gray[50],
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.sm,
        borderStyle: 'dashed',
        borderWidth: 1,
        borderColor: theme.colors.gray[300],
        marginBottom: theme.spacing.md,
    },
    codeContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    codeText: {
        fontSize: 16,
        fontWeight: '600',
        letterSpacing: 2,
        color: theme.colors.primary[600],
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
    copyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingLeft: theme.spacing.sm,
        borderLeftWidth: 1,
        borderLeftColor: theme.colors.gray[300],
    },
    copyButtonText: {
        fontSize: 12,
        fontWeight: '700',
        color: theme.colors.primary[500],
        fontFamily: Platform.OS === 'ios' ? 'Inter' : 'sans-serif',
    },
    expiryRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    expiryText: {
        fontSize: 12,
        color: theme.colors.gray[500],
        fontFamily: Platform.OS === 'ios' ? 'Inter' : 'sans-serif',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: theme.spacing.xl,
    },
    emptyIconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: theme.colors.gray[50],
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: theme.spacing.lg,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#000000',
        marginBottom: theme.spacing.xs,
        fontFamily: Platform.OS === 'ios' ? 'Inter' : 'sans-serif',
    },
    emptySubtitle: {
        fontSize: 14,
        color: theme.colors.gray[500],
        textAlign: 'center',
        lineHeight: 20,
        fontFamily: Platform.OS === 'ios' ? 'Inter' : 'sans-serif',
    },
});

export default PromotionsScreen;
