import React, { useState } from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { WebView } from 'react-native-webview';
import { theme } from '@/theme';

interface HTMLContentProps {
    html: string;
    baseStyle?: any;
}

/**
 * HTMLContent Component
 * Renders HTML content using WebView
 * Properly handles HTML from Bagisto product descriptions
 */
export const HTMLContent: React.FC<HTMLContentProps> = ({ html, baseStyle }) => {
    const { width } = useWindowDimensions();
    const [webViewHeight, setWebViewHeight] = useState(200);

    // If no HTML content, return null
    if (!html || html.trim() === '') {
        return null;
    }

    // Clean and prepare HTML
    const cleanHTML = html.trim();

    // Create full HTML document with proper styling
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
                    color: ${theme.colors.text.secondary};
                    padding: 0;
                    margin: 0;
                    word-wrap: break-word;
                    overflow-wrap: break-word;
                }
                p {
                    margin-bottom: 12px;
                }
                h1, h2, h3, h4, h5, h6 {
                    color: ${theme.colors.text.primary};
                    margin-bottom: 8px;
                    margin-top: 16px;
                    font-weight: 600;
                }
                h1 { font-size: 24px; }
                h2 { font-size: 20px; }
                h3 { font-size: 18px; }
                h4 { font-size: 16px; }
                h5 { font-size: 14px; }
                h6 { font-size: 12px; }
                ul, ol {
                    margin-left: 20px;
                    margin-bottom: 12px;
                }
                li {
                    margin-bottom: 4px;
                }
                a {
                    color: ${theme.colors.primary[500]};
                    text-decoration: none;
                }
                img {
                    max-width: 100%;
                    height: auto;
                    display: block;
                    margin: 12px 0;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 12px;
                }
                th, td {
                    border: 1px solid ${theme.colors.border.main};
                    padding: 8px;
                    text-align: left;
                }
                th {
                    background-color: ${theme.colors.background.paper};
                    font-weight: 600;
                }
                blockquote {
                    border-left: 4px solid ${theme.colors.primary[500]};
                    padding-left: 16px;
                    margin: 12px 0;
                    font-style: italic;
                }
                code {
                    background-color: ${theme.colors.background.paper};
                    padding: 2px 6px;
                    border-radius: 4px;
                    font-family: 'Courier New', monospace;
                    font-size: 14px;
                }
                pre {
                    background-color: ${theme.colors.background.paper};
                    padding: 12px;
                    border-radius: 8px;
                    overflow-x: auto;
                    margin-bottom: 12px;
                }
                pre code {
                    background-color: transparent;
                    padding: 0;
                }
                strong, b {
                    font-weight: 600;
                }
                em, i {
                    font-style: italic;
                }
            </style>
        </head>
        <body>
            ${cleanHTML}
            <script>
                // Send height to React Native
                window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'height',
                    height: document.body.scrollHeight
                }));
                
                // Handle link clicks
                document.addEventListener('click', function(e) {
                    if (e.target.tagName === 'A') {
                        e.preventDefault();
                        window.ReactNativeWebView.postMessage(JSON.stringify({
                            type: 'link',
                            url: e.target.href
                        }));
                    }
                });
            </script>
        </body>
        </html>
    `;

    const handleMessage = (event: any) => {
        try {
            const data = JSON.parse(event.nativeEvent.data);
            
            if (data.type === 'height') {
                // Add some padding to prevent content cutoff
                setWebViewHeight(data.height + 20);
            } else if (data.type === 'link') {
                // Handle link clicks - could open in browser
                console.log('Link clicked:', data.url);
                // You can add Linking.openURL(data.url) here if needed
            }
        } catch (error) {
            console.error('Error handling WebView message:', error);
        }
    };

    return (
        <View style={[styles.container, baseStyle]}>
            <WebView
                source={{ html: htmlContent }}
                style={[styles.webView, { height: webViewHeight }]}
                scrollEnabled={false}
                showsVerticalScrollIndicator={false}
                showsHorizontalScrollIndicator={false}
                onMessage={handleMessage}
                androidHardwareAccelerationDisabled={false}
                originWhitelist={['*']}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                mixedContentMode="compatibility"
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
    },
    webView: {
        backgroundColor: 'transparent',
        width: '100%',
    },
});

