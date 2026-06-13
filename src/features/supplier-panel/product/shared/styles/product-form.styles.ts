/**
 * Shared StyleSheet for the product add/edit screens.
 * Extracted from AddProductScreen and EditProductScreen to eliminate duplication.
 */

import { StyleSheet } from 'react-native';
import { COLORS } from '@/features/supplier-panel/styles';

const productFormStyles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        backgroundColor: COLORS.background,
        paddingTop: 60,
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        height: 32,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
        width: 32,
        height: 32,
        backgroundColor: COLORS.white,
        borderRadius: 8,
        justifyContent: 'center',
    },
    titleContainer: {
        flexDirection: 'column',
        alignItems: 'flex-start',
        padding: 0,
        gap: 4,
        flex: 1,
    },
    headerTitle: {
        fontFamily: 'Inter',
        fontWeight: '400',
        fontSize: 16,
        color: '#000000',
    },
    content: {
        padding: 16,
        gap: 16,
    },
    // --- Tabs ---
    tabsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 4,
        height: 42,
        backgroundColor: COLORS.white,
        borderRadius: 8,
    },
    tabsContainerDisabled: {
        opacity: 0.6,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 10,
        height: 34,
        borderRadius: 4,
    },
    tabActive: {
        backgroundColor: COLORS.primaryLight,
        borderWidth: 1,
        borderColor: COLORS.primary,
    },
    tabText: {
        fontFamily: 'Inter',
        fontWeight: '400',
        fontSize: 14,
        color: '#000000',
    },
    tabTextActive: {
        color: '#000000',
    },
    // --- Action buttons ---
    actionButtonsRow: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
        marginTop: 16,
        marginBottom: 32,
    },
    actionButtonsFull: {
        width: '100%',
        marginTop: 16,
        marginBottom: 32,
    },
    draftButton: {
        flex: 1,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: COLORS.primary,
        borderRadius: 8,
    },
    draftButtonText: {
        fontFamily: 'Inter',
        fontWeight: '400',
        fontSize: 14,
        color: COLORS.primary,
    },
    publishButton: {
        flex: 1,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.primary,
        borderRadius: 8,
    },
    publishButtonText: {
        fontFamily: 'Inter',
        fontWeight: '400',
        fontSize: 14,
        color: '#F5F5F5',
    },
    saveButton: {
        width: '100%',
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.primary,
        borderRadius: 8,
    },
    saveButtonText: {
        fontFamily: 'Inter',
        fontWeight: '400',
        fontSize: 14,
        color: '#F5F5F5',
    },
    disabledButton: {
        opacity: 0.6,
    },
    // --- Loading / Error states ---
    loadingContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
        gap: 16,
        backgroundColor: COLORS.white,
        borderRadius: 16,
    },
    loadingText: {
        fontFamily: 'Inter',
        fontSize: 16,
        color: '#666666',
        textAlign: 'center',
    },
    errorContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        gap: 12,
        backgroundColor: '#FEE2E2',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#FCA5A5',
    },
    errorText: {
        fontFamily: 'Inter',
        fontSize: 14,
        color: '#DC2626',
        textAlign: 'center',
    },
    retryButton: {
        paddingHorizontal: 16,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.primary,
        borderRadius: 8,
        marginTop: 8,
    },
    retryButtonText: {
        fontFamily: 'Inter',
        fontSize: 14,
        color: '#FFFFFF',
    },
    // --- Submitting overlay ---
    submittingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
    },
});

export default productFormStyles;
