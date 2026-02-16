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
}

interface ReviewCardProps {
    review: Review;
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

export function ReviewCard({ review }: ReviewCardProps) {
    return (
        <View style={styles.card}>
            <TouchableOpacity style={styles.eyeButton}>
                <EyeViewIcon width={16} height={16} color="#00615E" />
            </TouchableOpacity>
            <View style={styles.cardContent}>
                <StarRow rating={review.rating} />
                <Text style={styles.reviewText}>{review.text}</Text>
                <Text style={styles.authorText}>
                    - {review.author} ({review.tag})
                </Text>
                <ReplyRow />
                {review.reply ? (
                    <View style={styles.replyBubble}>
                        <View style={styles.replyPointer} />
                        <Text style={styles.replyText}>{review.reply}</Text>
                        <Text style={styles.replyBy}>{review.replyBy}</Text>
                    </View>
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
    replyBubble: {
        marginLeft: 20,
        paddingVertical: 4,
        paddingLeft: 12,
        gap: 4,
        borderLeftWidth: 2,
        borderLeftColor: '#E0D7C2',
    },
    replyPointer: {
        position: 'absolute',
        left: -10,
        top: 2,
        width: 20,
        height: 27,
        borderWidth: 1,
        borderColor: '#E0D7C2',
        borderRadius: 8,
        backgroundColor: 'transparent',
    },
    replyText: {
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '500',
        fontSize: 16,
        lineHeight: 19,
        color: '#000000',
    },
    replyBy: {
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '500',
        fontSize: 13,
        lineHeight: 18,
        color: '#0A292D',
    },
});
