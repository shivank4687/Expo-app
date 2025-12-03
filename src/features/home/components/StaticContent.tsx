import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions } from 'react-native';
import { StaticContentOptions } from '@/types/theme.types';
import { theme } from '@/theme';
import { getAbsoluteImageUrl } from '@/shared/utils/imageUtils';

interface StaticContentProps {
    options: StaticContentOptions;
}

interface CardData {
    imageUrl: string;
    text: string;
}

interface ContentData {
    heading: string;
    paragraphs: string[];
    buttonText: string;
}

/**
 * CardItem Component
 * Renders a single card with image and text overlay
 */
const CardItem: React.FC<{ card: CardData; cardWidth: number }> = ({ card, cardWidth }) => {
    const cardText = card.text.trim();
    const hasValidImage = 
        card.imageUrl && 
        card.imageUrl.trim().length > 0 && 
        !isPlaceholderUrl(card.imageUrl);

    return (
        <View style={[styles.cardWrapper, { width: cardWidth }]}>
            <TouchableOpacity style={styles.cardItem} activeOpacity={0.9}>
                {hasValidImage ? (
                    <Image
                        source={{ uri: card.imageUrl }}
                        style={styles.cardImage}
                        resizeMode="cover"
                    />
                ) : (
                    <View style={styles.cardImagePlaceholder} />
                )}
                <View style={styles.cardOverlay}>
                    <Text style={styles.cardText} numberOfLines={2}>
                        {cardText}
                    </Text>
                </View>
            </TouchableOpacity>
        </View>
    );
};

/**
 * ContentSection Component
 * Renders promotional content with heading, paragraphs, and button
 */
const ContentSection: React.FC<{ content: ContentData }> = ({ content }) => {
    const validParagraphs = content.paragraphs.filter(p => isValidText(p));
    const hasHeading = isValidText(content.heading);
    const hasButton = isValidText(content.buttonText);

    return (
        <View style={styles.contentSection}>
            {hasHeading ? (
                <Text style={styles.contentHeading}>
                    {content.heading.trim()}
                </Text>
            ) : null}
            
            {validParagraphs.map((paragraph, index) => (
                <Text key={`para-${index}`} style={styles.contentText}>
                    {paragraph.trim()}
                </Text>
            ))}
            
            {hasButton ? (
                <TouchableOpacity style={styles.button} activeOpacity={0.8}>
                    <Text style={styles.buttonText}>
                        {content.buttonText.trim()}
                    </Text>
                </TouchableOpacity>
            ) : null}
        </View>
    );
};

/**
 * StaticContent Component
 * Renders static HTML content as native React Native components
 * Mirrors Bagisto's responsive mobile design with cards, images, text, and buttons
 */
export const StaticContent: React.FC<StaticContentProps> = ({ options }) => {
    if (!options.html) return null;

    const { width: screenWidth } = Dimensions.get('window');
    const cardWidth = (screenWidth - (theme.spacing.md * 3)) / 2;

    const parsed = parseHTMLContent(options.html);

    const validCards = parsed.cards.filter(card => isValidText(card.text));
    const hasTitle = isValidText(parsed.title);
    const hasCards = validCards.length > 0;
    const hasMainImage = parsed.mainImage && parsed.mainImage.trim().length > 0;
    const hasContent = parsed.content && (
        isValidText(parsed.content.heading) ||
        parsed.content.paragraphs.some(p => isValidText(p))
    );

    if (!hasTitle && !hasCards && !hasMainImage && !hasContent) {
        return null;
    }

    // Detect if this is a home offer banner (title only, no other content)
    const isOfferBanner = 
        hasTitle && 
        !hasCards && 
        !hasMainImage && 
        !hasContent &&
        (options.html.includes('home-offer') || 
         parsed.title.toLowerCase().includes('off') ||
         parsed.title.toLowerCase().includes('shop now'));

    return (
        <View style={isOfferBanner ? styles.offerOnlyContainer : styles.container}>
            {/* Render Title (as banner if it's an offer) */}
            {hasTitle ? (
                isOfferBanner ? (
                    <View style={styles.offerBannerContainer}>
                        <Text style={styles.offerBannerText}>{parsed.title.trim()}</Text>
                    </View>
                ) : (
                    <Text style={styles.mainTitle}>{parsed.title.trim()}</Text>
                )
            ) : null}

            {/* Render Cards Grid */}
            {hasCards ? (
                <View style={styles.cardsGridContainer}>
                    {validCards.map((card, index) => (
                        <CardItem
                            key={`card-${index}`}
                            card={card}
                            cardWidth={cardWidth}
                        />
                    ))}
                </View>
            ) : null}

            {/* Render Main Image */}
            {hasMainImage ? (
                <View style={styles.mainImageContainer}>
                    <Image
                        source={{ uri: parsed.mainImage }}
                        style={styles.mainImage}
                        resizeMode="cover"
                    />
                </View>
            ) : null}

            {/* Render Content Section */}
            {hasContent && parsed.content ? (
                <ContentSection content={parsed.content} />
            ) : null}
        </View>
    );
};

/**
 * Parse HTML content to extract structured data
 */
function parseHTMLContent(html: string): {
    title: string;
    cards: CardData[];
    mainImage: string;
    content: ContentData | null;
} {
    const result = {
        title: '',
        cards: [] as CardData[],
        mainImage: '',
        content: null as ContentData | null,
    };

    if (!html || typeof html !== 'string') return result;

    result.title = extractTitle(html);
    result.cards = extractCards(html);
    result.mainImage = extractMainImage(html, result.cards.length);
    result.content = extractContent(html);

    return result;
}

/**
 * Extract title from HTML
 */
function extractTitle(html: string): string {
    const titleMatch = html.match(/<h[1-3][^>]*>(.*?)<\/h[1-3]>/i);
    if (!titleMatch) return '';
    
    const title = stripHtml(titleMatch[1]);
    return isValidText(title) ? title : '';
}

/**
 * Extract cards with background images or img tags
 */
function extractCards(html: string): CardData[] {
    const cards: CardData[] = [];

    // Extract cards with background images
    const cardPattern = /<(?:div|a)[^>]*style="[^"]*background-image:\s*url\(['"]?([^'")\s]+)['"]?\)[^"]*"[^>]*>(.*?)<\/(?:div|a)>/gi;
    let cardMatch;
    while ((cardMatch = cardPattern.exec(html)) !== null) {
        const rawImageUrl = cardMatch[1];
        if (isPlaceholderUrl(rawImageUrl)) continue;
        
        const processedUrl = getAbsoluteImageUrl(rawImageUrl);
        const imageUrl = typeof processedUrl === 'string' ? processedUrl : '';
        const text = stripHtml(cardMatch[2]);
        
        if (isValidText(text)) {
            cards.push({ imageUrl, text });
        }
    }

    // Extract cards with img tags
    const cardDivPattern = /<div[^>]*class="[^"]*(?:card|collection|category-item)[^"]*"[^>]*>(.*?)<\/div>/gi;
    const cardDivMatches = [...html.matchAll(cardDivPattern)];
    
    for (const match of cardDivMatches) {
        if (cards.length >= 6) break;
        
        const cardHtml = match[1];
        const imgMatch = cardHtml.match(/<img[^>]*src=["']([^"']+)["'][^>]*>/i);
        const text = stripHtml(cardHtml);
        
        if (imgMatch && isValidText(text)) {
            const rawImageUrl = imgMatch[1];
            if (isPlaceholderUrl(rawImageUrl)) continue;
            
            const processedUrl = getAbsoluteImageUrl(rawImageUrl);
            const imageUrl = typeof processedUrl === 'string' ? processedUrl : '';
            cards.push({ imageUrl, text });
        }
    }

    return cards;
}

/**
 * Extract main promotional image
 */
function extractMainImage(html: string, existingCardsCount: number): string {
    const imgPattern = /<img[^>]*src=["']([^"']+)["'][^>]*>/gi;
    const imgMatches = html.match(imgPattern);
    
    if (!imgMatches || imgMatches.length <= existingCardsCount) return '';
    
    for (let i = existingCardsCount; i < imgMatches.length; i++) {
        const srcMatch = imgMatches[i].match(/src=["']([^"']+)["']/i);
        if (!srcMatch) continue;
        
        const rawImageUrl = srcMatch[1];
        if (isPlaceholderUrl(rawImageUrl)) continue;
        
        const processedUrl = getAbsoluteImageUrl(rawImageUrl);
        const imageUrl = typeof processedUrl === 'string' ? processedUrl : '';
        if (imageUrl && imageUrl.trim()) {
            return imageUrl;
        }
    }
    
    return '';
}

/**
 * Extract content section (heading, paragraphs, button)
 */
function extractContent(html: string): ContentData | null {
    // Try to extract structured content sections
    const contentSectionPattern = /<(?:div|section)[^>]*>([\s\S]*?)<\/(?:div|section)>/gi;
    const contentMatches = [...html.matchAll(contentSectionPattern)];
    
    for (const match of contentMatches) {
        const sectionHtml = match[1];
        const hasHeading = /<h[2-6]/i.test(sectionHtml);
        const hasParagraph = /<p/i.test(sectionHtml);
        
        if (hasHeading && hasParagraph) {
            const headingMatch = sectionHtml.match(/<h[2-6][^>]*>(.*?)<\/h[2-6]>/i);
            const heading = headingMatch ? stripHtml(headingMatch[1]).trim() : '';
            
            const paragraphMatches = sectionHtml.match(/<p[^>]*>(.*?)<\/p>/gi);
            const paragraphs = paragraphMatches
                ? paragraphMatches.map(p => stripHtml(p)).filter(p => isValidText(p))
                : [];
            
            const buttonMatch = sectionHtml.match(/<(?:a|button)[^>]*>(.*?)<\/(?:a|button)>/i);
            const buttonText = buttonMatch ? stripHtml(buttonMatch[1]).trim() : '';
            
            if (isValidText(heading) || paragraphs.length > 0) {
                return { heading, paragraphs, buttonText };
            }
        }
    }

    // Fallback: Extract from plain text if contains "collection"
    if (html.toLowerCase().includes('collection')) {
        const allText = stripHtml(html);
        if (!isValidText(allText) || allText.length <= 10) return null;
        
        const lines = allText.split(/[.!?]\s+/).map(l => l.trim()).filter(isValidText);
        const heading = lines[0] || '';
        const paragraphs = lines.slice(1).filter(line => line.length > 20);
        
        const buttonPattern = /\b(view|shop|explore|discover|learn more|get started|buy now|order now|see more)\b[^.!?]*/i;
        const buttonMatch = allText.match(buttonPattern);
        const buttonText = buttonMatch ? buttonMatch[0].trim() : '';
        
        if (isValidText(heading) || paragraphs.length > 0) {
            return { heading, paragraphs, buttonText };
        }
    }

    return null;
}

/**
 * Check if a string is valid text (not empty, not just punctuation)
 */
function isValidText(text: string): boolean {
    if (!text || typeof text !== 'string') return false;
    const trimmed = text.trim();
    return trimmed.length > 1 && !/^[.,;:!?\s]+$/.test(trimmed);
}

/**
 * Check if URL is a placeholder
 */
function isPlaceholderUrl(url: string): boolean {
    if (!url) return true;
    const lower = url.toLowerCase();
    return lower.includes('placeholder') || lower.includes('via.placeholder');
}

/**
 * Strip HTML tags to get clean text
 */
function stripHtml(html: string): string {
    if (!html || typeof html !== 'string') return '';
    
    let result = html
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
        .replace(/<!--[\s\S]*?-->/g, '')
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&apos;/g, "'")
        .replace(/&mdash;/g, '—')
        .replace(/&ndash;/g, '–')
        .replace(/\.\s*\./g, '.')
        .replace(/^\.\s*/g, '')
        .replace(/\s*\.\s*$/g, '')
        .trim();
    
    // Return empty string if only punctuation/whitespace
    if (/^[.,;:!?\s]+$/.test(result)) {
        return '';
    }
    
    return result;
}

const styles = StyleSheet.create({
    container: {
        marginBottom: theme.spacing.xl,
    },
    offerOnlyContainer: {
        marginBottom: theme.spacing.lg,
    },
    
    // Offer Banner (e.g., "Get UPTO 40% OFF")
    offerBannerContainer: {
        width: '100%',
        backgroundColor: '#E8EDFE',
        paddingVertical: 16,
        paddingHorizontal: theme.spacing.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    offerBannerText: {
        fontSize: 18,
        fontWeight: '500',
        textAlign: 'center',
        color: '#060C3B',
        letterSpacing: 0.3,
        lineHeight: 24,
    },
    
    // Main Title (for section headers)
    mainTitle: {
        fontSize: 24,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.lg,
        paddingHorizontal: theme.spacing.md,
        letterSpacing: 0.3,
    },
    
    // Cards Grid Container (uses flexbox without gap)
    cardsGridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: theme.spacing.md,
        marginBottom: theme.spacing.lg,
    },
    cardWrapper: {
        paddingRight: theme.spacing.md,
        paddingBottom: theme.spacing.md,
    },
    cardItem: {
        height: 150,
        width: '100%',
        borderRadius: theme.borderRadius.lg,
        overflow: 'hidden',
        backgroundColor: theme.colors.gray[100],
        ...theme.shadows.md,
    },
    cardImage: {
        width: '100%',
        height: '100%',
        position: 'absolute',
    },
    cardImagePlaceholder: {
        width: '100%',
        height: '100%',
        backgroundColor: theme.colors.gray[200],
    },
    cardOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        paddingVertical: 12,
        paddingHorizontal: 12,
    },
    cardText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: theme.typography.fontWeight.semiBold,
        textAlign: 'center',
        lineHeight: 18,
    },
    
    // Main Image
    mainImageContainer: {
        marginHorizontal: theme.spacing.md,
        marginBottom: theme.spacing.lg,
        borderRadius: theme.borderRadius.lg,
        overflow: 'hidden',
        ...theme.shadows.md,
    },
    mainImage: {
        width: '100%',
        height: 200,
        backgroundColor: theme.colors.gray[100],
    },
    
    // Content Section
    contentSection: {
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
    },
    contentHeading: {
        fontSize: 22,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.md,
        lineHeight: 28,
        textAlign: 'center',
    },
    contentText: {
        fontSize: theme.typography.fontSize.base,
        color: theme.colors.text.secondary,
        lineHeight: theme.typography.fontSize.base * 1.7,
        marginBottom: theme.spacing.sm,
        textAlign: 'center',
    },
    button: {
        backgroundColor: theme.colors.primary[500],
        paddingVertical: 14,
        paddingHorizontal: 32,
        borderRadius: theme.borderRadius.full,
        alignSelf: 'center',
        marginTop: theme.spacing.md,
        ...theme.shadows.md,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: theme.typography.fontSize.base,
        fontWeight: theme.typography.fontWeight.bold,
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
});

