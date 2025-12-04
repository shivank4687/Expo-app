import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { WebView } from 'react-native-webview';
import { cmsApi, CMSPage } from '@/services/api/cms.api';
import { LoadingSpinner } from '@/shared/components/LoadingSpinner';
import { ErrorMessage } from '@/shared/components/ErrorMessage';
import { theme } from '@/theme';

/**
 * StaticPageScreen Component
 * Displays CMS pages dynamically from the backend
 * Content is fetched based on url_key and respects current locale
 */
export const StaticPageScreen: React.FC = () => {
    const { page } = useLocalSearchParams<{ page: string }>();
    const [pageData, setPageData] = useState<CMSPage | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (page) {
            loadPage();
        }
    }, [page]);

    const loadPage = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const data = await cmsApi.getPageByUrlKey(page);
            setPageData(data);
        } catch (err: any) {
            console.error('[StaticPageScreen] Error loading page:', err);
            setError(err.message || 'Failed to load page');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <>
                <Stack.Screen options={{ title: 'Loading...', headerBackTitle: 'Back' }} />
                <LoadingSpinner />
            </>
        );
    }

    if (error || !pageData) {
        return (
            <>
                <Stack.Screen options={{ title: 'Error', headerBackTitle: 'Back' }} />
                <ErrorMessage message={error || 'Page not found'} onRetry={loadPage} />
            </>
        );
    }

    // Create HTML content with proper styling
    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
            <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                    font-size: 16px;
                    line-height: 1.6;
                    color: #374151;
                    padding: 20px;
                    background-color: #fff;
                }
                h1, h2, h3, h4, h5, h6 {
                    margin-top: 24px;
                    margin-bottom: 16px;
                    font-weight: 600;
                    color: #111827;
                }
                h1 { font-size: 28px; }
                h2 { font-size: 24px; }
                h3 { font-size: 20px; }
                p {
                    margin-bottom: 16px;
                }
                ul, ol {
                    margin-bottom: 16px;
                    padding-left: 24px;
                }
                li {
                    margin-bottom: 8px;
                }
                a {
                    color: #3B82F6;
                    text-decoration: none;
                }
                img {
                    max-width: 100%;
                    height: auto;
                    border-radius: 8px;
                    margin: 16px 0;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 16px;
                }
                th, td {
                    border: 1px solid #E5E7EB;
                    padding: 12px;
                    text-align: left;
                }
                th {
                    background-color: #F3F4F6;
                    font-weight: 600;
                }
            </style>
        </head>
        <body>
            ${pageData.html_content}
        </body>
        </html>
    `;

    return (
        <>
            <Stack.Screen options={{ title: pageData.page_title, headerBackTitle: 'Back' }} />
            <WebView
                source={{ html: htmlContent }}
                style={styles.webview}
                showsVerticalScrollIndicator={true}
                scalesPageToFit={true}
                startInLoadingState={true}
            />
        </>
    );
};

const styles = StyleSheet.create({
    webview: {
        flex: 1,
        backgroundColor: theme.colors.white,
    },
});

export default StaticPageScreen;
