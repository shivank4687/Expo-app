import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { config } from '@/config/env';
import { useAppSelector } from '@/store/hooks';

interface UseSupplierSocketOptions {
    onNewNotification?: (data: any) => void;
    onConnect?: () => void;
    onDisconnect?: () => void;
}

export const useSupplierSocket = ({
    onNewNotification,
    onConnect,
    onDisconnect,
}: UseSupplierSocketOptions = {}) => {
    const { token: supplierToken, supplier: supplierData } = useAppSelector((state) => state.supplierAuth);
    const socketRef = useRef<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        // Only connect if we have a supplier token and ID
        if (!supplierToken || !supplierData?.id) {
            return;
        }

        // Initialize socket connection matching the web implementation
        socketRef.current = io(config.socketUrl, {
            auth: {
                token: `supplier_${supplierData.id}`,
                userType: 'supplier',
            },
            transports: ['websocket'], // Prefer websocket for React Native
            reconnection: true,
            reconnectionAttempts: 5,
        });

        const socket = socketRef.current;

        // Connection events
        socket.on('connect', () => {
            console.log('Supplier Socket.IO connected');
            setIsConnected(true);

            // Subscribe to notifications when connected (matching web implementation)
            socket.emit('notification:subscribe');

            if (onConnect) onConnect();
        });

        socket.on('disconnect', () => {
            console.log('Supplier Socket.IO disconnected');
            setIsConnected(false);
            if (onDisconnect) onDisconnect();
        });

        // Application events
        socket.on('notification:new', (data) => {
            console.log('New real-time notification received:', data);
            if (onNewNotification) onNewNotification(data);
        });

        // Cleanup on unmount or when token changes
        return () => {
            if (socket) {
                // Ensure we unsubscribe before disconnecting
                socket.emit('notification:unsubscribe');
                socket.disconnect();
                socketRef.current = null;
                setIsConnected(false);
            }
        };
    }, [supplierToken, supplierData?.id]); // Re-run if auth state changes

    return {
        socket: socketRef.current,
        isConnected,
    };
};
