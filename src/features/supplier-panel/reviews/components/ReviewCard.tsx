import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThumbUpIcon, ThumbDownIcon, EyeViewIcon } from '@/assets/icons';

interface Review {
    id: string;
    rating: number;
    text: string;
    author: string;
    tag: string;
    reply?: string;
    replyBy?: string;
    productName?: string;
}

interface ReviewCardProps {
    review: Review;
    onReply?: (reviewId: string, currentReply?: string) => void;
}

function StarRow({ rating }: { rating: number }) {
    return (
        <View style={styles.starsRow}>
            {Array.from({ length: 5 }).map((_, index) => (
                <Ionicons
                    key={`star-${index}`}
                    name={index < rating ? "star" : "star-outline"}
                    size={16}
                    color="#00615E"
                    style={styles.starIcon}
                />
            ))}
        </View>
    );
}

function ReplyRow() {
    return (
        <View style={styles.replyRow}>
            <View style={styles.thumbBox}>
                <ThumbUpIcon width={24} height={24} color="#000000" />
            </View>
            <View style={styles.thumbBox}>
                <ThumbDownIcon width={24} height={24} color="#000000" />
            </View>
            <Text style={styles.replyLabel}>Reply</Text>
        </View>
    );
}

export function ReviewCard({ review, onReply }: ReviewCardProps) {
    return (
        <View style={styles.card}>
            <TouchableOpacity style={styles.eyeButton}>
                <EyeViewIcon width={16} height={16} color="#00615E" />
            </TouchableOpacity>
            <View style={styles.cardContent}>
                {review.productName ? (
                    <Text style={styles.productNameText}>{review.productName}</Text>
                ) : null}
                <StarRow rating={review.rating} />
                <Text style={styles.reviewText}>{review.text}</Text>
                <Text style={styles.authorText}>
                    - {review.author} ({review.tag})
                </Text>
                {review.reply ? (
                    <View style={styles.replyContainer}>
                        <View style={styles.replyHeaderRow}>
                            <Ionicons name="chatbubble-ellipses" size={16} color="#00615E" />
                            <Text style={styles.replyHeaderLabel}>
                                {review.replyBy ? `Reply by ${review.replyBy}` : 'Your Reply'}
                            </Text>
                        </View>
                        <Text style={styles.replyContentText}>{review.reply}</Text>
                    </View>
                ) : null}
                {review.productName ? (
                    <TouchableOpacity
                        style={styles.replyButton}
                        onPress={() => onReply?.(review.id, review.reply)}
                    >
                        <Ionicons
                            name={review.reply ? "create-outline" : "chatbubble-outline"}
                            size={16}
                            color="#00615E"
                        />
                        <Text style={styles.replyButtonText}>
                            {review.reply ? "Edit Reply" : "Reply"}
                        </Text>
                    </TouchableOpacity>
                ) : null}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        width: '100%',
        backgroundColor: '#FCF7EA',
        borderWidth: 1,
        borderColor: '#E9E3D3',
        borderRadius: 16,
        padding: 12,
    },
    cardContent: {
        gap: 8,
        paddingRight: 40,
    },
    starsRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: 0,
        width: 80,
        height: 16,
        gap: 0,
    },
    starIcon: {
        width: 16,
        height: 16,
    },
    reviewText: {
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '500',
        fontSize: 16,
        lineHeight: 19,
        color: '#000000',
    },
    authorText: {
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '500',
        fontSize: 13,
        lineHeight: 18,
        color: '#0A292D',
    },
    replyRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    thumbBox: {
        width: 24,
        height: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    replyLabel: {
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '500',
        fontSize: 13,
        lineHeight: 18,
        color: '#0A292D',
    },
    eyeButton: {
        position: 'absolute',
        top: 12,
        right: 12,
        width: 32,
        height: 32,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#00615E',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
        zIndex: 1,
    },
    replyContainer: {
        marginTop: 10,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#EFEFEF',
        borderRadius: 12,
        padding: 12,
        gap: 6,
    },
    replyHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    replyHeaderLabel: {
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '600',
        fontSize: 13,
        color: '#00615E',
    },
    replyContentText: {
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '400',
        fontSize: 14,
        lineHeight: 18,
        color: '#333333',
    },
    replyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 8,
        alignSelf: 'flex-start',
    },
    replyButtonText: {
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '600',
        fontSize: 14,
        color: '#00615E',
    },
    productNameText: {
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '600',
        fontSize: 14,
        lineHeight: 18,
        color: '#00615E',
        marginBottom: 2,
    },
});
