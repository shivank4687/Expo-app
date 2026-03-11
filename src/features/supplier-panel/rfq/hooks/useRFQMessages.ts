import { useCallback, useEffect, useRef, useState } from 'react';
import { getRFQMessages, RFQMessage, sendRFQMessage } from '../api/rfq.api';
import socketService from '@/services/socket/socketService';
import { useAppSelector } from '@/store/hooks';

interface UseRFQMessagesResult {
    messages: RFQMessage[];
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
    sendMessage: (text: string) => Promise<void>;
    sending: boolean;
    leaveRoom: () => void;
}

export function useRFQMessages(
    parentQuoteId: number | undefined,
    supplierQuoteId: number | undefined,
    customerQuoteId: number | undefined,
    onNewCustomerMessage?: () => void,
): UseRFQMessagesResult {
    const [messages, setMessages] = useState<RFQMessage[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [sending, setSending] = useState<boolean>(false);

    // Read supplier identity from Redux — same source used by useSupplierSocket
    const { supplier: supplierData } = useAppSelector((state) => state.supplierAuth);

    // Keep a stable ref to supplierQuoteId so the socket callback can read it
    // without causing the effect to re-run unnecessarily.
    const supplierQuoteIdRef = useRef(supplierQuoteId);
    useEffect(() => {
        supplierQuoteIdRef.current = supplierQuoteId;
    }, [supplierQuoteId]);

    // Track the IDs that were actually used to JOIN the room, so cleanup always
    // leaves with the correct IDs (not stale closure values).
    const joinedRoomRef = useRef<{ parentQuoteId: number; customerQuoteId: number } | null>(null);

    const fetchMessages = useCallback(async () => {
        if (!supplierQuoteId || !customerQuoteId) return;
        try {
            setLoading(true);
            setError(null);
            const response = await getRFQMessages(supplierQuoteId, customerQuoteId);
            setMessages(response.data);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch RFQ messages');
        } finally {
            setLoading(false);
        }
    }, [supplierQuoteId, customerQuoteId]);

    // ── Fetch on mount / when IDs change ─────────────────────────────────────
    useEffect(() => {
        if (supplierQuoteId && customerQuoteId) {
            fetchMessages();
        }
    }, [fetchMessages, supplierQuoteId, customerQuoteId]);

    // ── Real-time socket integration ──────────────────────────────────────────
    useEffect(() => {
        if (!supplierQuoteId || !customerQuoteId) return;

        const socketToken = supplierData?.id ? `supplier_${supplierData.id}` : undefined;
        socketService.connect(socketToken, 'supplier');

        // Room name the server uses: rfq:{parentQuoteId}:{customerQuoteId}
        socketService.joinRFQRoom(parentQuoteId!, customerQuoteId!);

        // Record which IDs we actually joined with so cleanup is always correct
        joinedRoomRef.current = { parentQuoteId: parentQuoteId!, customerQuoteId: customerQuoteId! };

        // Listen for inbound messages
        socketService.onRFQNewMessage((data) => {
            console.log('📨 RFQ new message via Socket.IO:', data);

            // Only append messages from the customer — own supplier messages
            // are already added optimistically in sendMessage().
            if (data?.sender?.type !== 'customer') {
                console.log('⏭️ Skipping non-customer RFQ socket message');
                return;
            }

            const newMsg: RFQMessage = {
                id: data.message?.id ?? Date.now(),
                message: data.message?.message ?? '',
                customer_id: data.sender?.id ?? null,
                supplier_id: null,
                created_at: data.timestamp ?? new Date().toISOString(),
            };

            setMessages((prev) => {
                // Guard against duplicates (message already in list)
                if (prev.some((m) => m.id === newMsg.id)) return prev;
                return [...prev, newMsg];
            });

            // Notify parent — mirrors the web's `@new-message` event from the chat component
            onNewCustomerMessage?.();
        });

        return () => {
            // Always leave with the IDs we actually joined with
            const joined = joinedRoomRef.current;
            if (joined) {
                socketService.leaveRFQRoom(joined.parentQuoteId, joined.customerQuoteId);
                joinedRoomRef.current = null;
            }
            socketService.offRFQNewMessage();
        };
    }, [parentQuoteId, supplierQuoteId, customerQuoteId, supplierData?.id]);

    // ── Send ──────────────────────────────────────────────────────────────────
    const handleSendMessage = async (text: string) => {
        if (!supplierQuoteId || !customerQuoteId) return;

        try {
            setSending(true);
            const response = await sendRFQMessage(text, supplierQuoteId, customerQuoteId);

            // Optimistically append — the server broadcasts to the customer via socket,
            // and we add our own message here (same as the web app pattern).
            const sentMessage: RFQMessage = response.data ?? {
                id: Date.now(),
                message: text,
                customer_id: null,
                supplier_id: null,
                created_at: new Date().toISOString(),
            };

            setMessages((prev) => {
                if (prev.some((m) => m.id === sentMessage.id)) return prev;
                return [...prev, sentMessage];
            });
        } catch (err: any) {
            throw new Error(err.message || 'Failed to send message');
        } finally {
            setSending(false);
        }
    };

    const leaveRoom = () => {
        const joined = joinedRoomRef.current;
        if (joined) {
            socketService.leaveRFQRoom(joined.parentQuoteId, joined.customerQuoteId);
            socketService.offRFQNewMessage();
            joinedRoomRef.current = null;
        }
    };

    return { messages, loading, error, refetch: fetchMessages, sendMessage: handleSendMessage, sending, leaveRoom };
}
