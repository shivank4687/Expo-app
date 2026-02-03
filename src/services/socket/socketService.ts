import { io, Socket } from 'socket.io-client';

class SocketService {
    private socket: Socket | null = null;
    private readonly SOCKET_URL = 'http://192.168.31.102:3000'; // Update with your Socket.IO server URL

    connect() {
        if (this.socket?.connected) {
            return;
        }

        this.socket = io(this.SOCKET_URL, {
            transports: ['websocket'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5,
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

    joinOrderRoom(supplierOrderId: number, supplierId: number) {
        const room = `order:${supplierOrderId}:${supplierId}`;
        console.log('Joining room:', room);
        this.socket?.emit('join-room', { room });
    }

    leaveOrderRoom(supplierOrderId: number, supplierId: number) {
        const room = `order:${supplierOrderId}:${supplierId}`;
        console.log('Leaving room:', room);
        this.socket?.emit('leave-room', { room });
    }

    onNewMessage(callback: (data: any) => void) {
        this.socket?.on('order:new-message', callback);
    }

    offNewMessage() {
        this.socket?.off('order:new-message');
    }

    isConnected(): boolean {
        return this.socket?.connected || false;
    }
}

export default new SocketService();
