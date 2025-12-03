import { useEffect } from 'react';
import { useAppSelector } from '@/store/hooks';
import i18n from './config';

/**
 * Component to sync Redux locale state with i18next
 * This ensures the app UI updates when user changes language
 */
export const LocaleSync = () => {
    const { selectedLocale } = useAppSelector((state) => state.core);

    useEffect(() => {
        if (selectedLocale && i18n.language !== selectedLocale.code) {
            console.log('[i18n] Changing language to:', selectedLocale.code);
            i18n.changeLanguage(selectedLocale.code);
        }
    }, [selectedLocale]);

    return null; // This component doesn't render anything
};

