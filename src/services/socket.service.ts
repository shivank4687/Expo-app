import { io, Socket } from 'socket.io-client';
import config from '@/config/env';

export interface SocketUser {
    id: number;
    name: string;
    email: string;
    type: 'customer' | 'supplier';
}

export interface NewMessageData {
    message: {
        message: string;
        customer_id?: number;
        supplier_id?: number;
        created_at: string;
    };
    sender: SocketUser;
    timestamp: string;
}

class SocketService {
    private socket: Socket | null = null;
    private connected: boolean = false;
    private serverUrl: string;

    constructor() {
        // Use the same base URL as API but on port 3000
        const baseUrl = config.baseUrl.replace(':8000', ':3000');
        this.serverUrl = baseUrl;
    }

    connect(token: string, userType: 'customer' | 'supplier'): void {
        if (this.socket && this.connected) {
            console.log('Already connected to Socket.IO');
            return;
        }

        console.log(`Connecting to Socket.IO: ${this.serverUrl}`);

        this.socket = io(this.serverUrl, {
            auth: { token, userType },
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });

        this.socket.on('connect', () => {
            console.log('✅ Socket.IO connected');
            this.connected = true;
        });

        this.socket.on('disconnect', () => {
            console.log('❌ Socket.IO disconnected');
            this.connected = false;
        });

        this.socket.on('connect_error', (error) => {
            console.error('Socket.IO connection error:', error.message);
        });

        this.socket.on('error', (error) => {
            console.error('Socket.IO error:', error);
        });
    }

    joinRFQRoom(quoteId: number, customerQuoteId: number): void {
        if (!this.socket) {
            console.error('Socket not connected');
            return;
        }

        this.socket.emit('rfq:join', {
            quoteId,
            customerQuoteId,
        });

        console.log(`Joining RFQ room: ${quoteId}-${customerQuoteId}`);
    }

    leaveRFQRoom(quoteId: number, customerQuoteId: number): void {
        if (!this.socket) return;

        this.socket.emit('rfq:leave', {
            quoteId,
            customerQuoteId,
        });
    }

    sendRFQMessage(quoteId: number, customerQuoteId: number, message: any): void {
        if (!this.socket) {
            console.error('Socket not connected');
            return;
        }

        this.socket.emit('rfq:send-message', {
            quoteId,
            customerQuoteId,
            message,
        });
    }

    onNewMessage(callback: (data: NewMessageData) => void): void {
        if (!this.socket) return;

        this.socket.on('rfq:new-message', callback);
    }

    offNewMessage(): void {
        if (!this.socket) return;

        this.socket.off('rfq:new-message');
    }

    onUserJoined(callback: (data: any) => void): void {
        if (!this.socket) return;

        this.socket.on('rfq:user-joined', callback);
    }

    onUserLeft(callback: (data: any) => void): void {
        if (!this.socket) return;

        this.socket.on('rfq:user-left', callback);
    }

    onRoomMembers(callback: (data: any) => void): void {
        if (!this.socket) return;

        this.socket.on('rfq:room-members', callback);
    }

    emitTyping(quoteId: number, customerQuoteId: number): void {
        if (!this.socket) return;

        this.socket.emit('rfq:typing', {
            quoteId,
            customerQuoteId,
        });
    }

    emitStopTyping(quoteId: number, customerQuoteId: number): void {
        if (!this.socket) return;

        this.socket.emit('rfq:stop-typing', {
            quoteId,
            customerQuoteId,
        });
    }

    onUserTyping(callback: (data: any) => void): void {
        if (!this.socket) return;

        this.socket.on('rfq:user-typing', callback);
    }

    onUserStoppedTyping(callback: (data: any) => void): void {
        if (!this.socket) return;

        this.socket.on('rfq:user-stopped-typing', callback);
    }

    disconnect(): void {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.connected = false;
            console.log('Socket.IO disconnected');
        }
    }

    isConnected(): boolean {
        return this.connected;
    }
}

// Export singleton instance
export const socketService = new SocketService();
export default socketService;
