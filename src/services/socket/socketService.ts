import { io, Socket } from 'socket.io-client';
import config from '@/config/env';

class SocketService {
    private socket: Socket | null = null;
    private readonly SOCKET_URL = config.socketUrl;

    connect(token?: string, userType?: string) {
        if (this.socket?.connected) {
            return;
        }

        this.socket = io(this.SOCKET_URL, {
            transports: ['websocket'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5,
            ...(token && userType ? { auth: { token, userType } } : {}),
        });

        this.socket.on('connect', () => {
            console.log('✅ Socket.IO connected');
        });

        this.socket.on('disconnect', () => {
            console.log('❌ Socket.IO disconnected');
        });

        this.socket.on('connect_error', (error) => {
            console.error('Socket.IO connection error:', error);
        });
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    // ─── Order rooms ────────────────────────────────────────────────────────────

    joinOrderRoom(supplierOrderId: number, supplierId: number) {
        const room = `order:${supplierOrderId}:${supplierId}`;
        console.log('Joining order room:', room);
        this.socket?.emit('join-room', { room });
    }

    leaveOrderRoom(supplierOrderId: number, supplierId: number) {
        const room = `order:${supplierOrderId}:${supplierId}`;
        console.log('Leaving order room:', room);
        this.socket?.emit('leave-room', { room });
    }

    onNewMessage(callback: (data: any) => void) {
        this.socket?.on('order:new-message', callback);
    }

    offNewMessage() {
        this.socket?.off('order:new-message');
    }

    // ─── RFQ rooms ───────────────────────────────────────────────────────────────

    joinRFQRoom(quoteId: number, customerQuoteId: number) {
        console.log(`Joining RFQ room: ${quoteId}-${customerQuoteId}`);
        this.socket?.emit('rfq:join', { quoteId, customerQuoteId });
    }

    leaveRFQRoom(quoteId: number, customerQuoteId: number) {
        console.log(`Leaving RFQ room: ${quoteId}-${customerQuoteId}`);
        this.socket?.emit('rfq:leave', { quoteId, customerQuoteId });
    }

    onRFQNewMessage(callback: (data: any) => void) {
        this.socket?.on('rfq:new-message', callback);
    }

    offRFQNewMessage() {
        this.socket?.off('rfq:new-message');
    }

    // ─── Utilities ───────────────────────────────────────────────────────────────

    isConnected(): boolean {
        return this.socket?.connected || false;
    }
}

export default new SocketService();
