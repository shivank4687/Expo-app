import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import socketService from '@/services/socket.service';
import { fetchUnreadCountThunk } from '@/store/slices/notificationSlice';
import { useToast } from '@/shared/components/Toast';

interface SocketProviderProps {
    children: React.ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
    const dispatch = useAppDispatch();
    const { showToast } = useToast();
    
    // Customer Auth State
    const { isAuthenticated: isCustomerAuth, user } = useAppSelector((state) => state.auth);
    
    // Supplier Auth State
    const { isAuthenticated: isSupplierAuth, supplier } = useAppSelector((state) => state.supplierAuth);

    // Manage Customer Socket Connection
    useEffect(() => {
        if (isCustomerAuth && user?.id) {
            const token = `customer_${user.id}`;
            socketService.connect(token, 'customer');
            socketService.subscribeToNotifications();

            const handleNotification = (data: any) => {
                console.log('[SocketProvider] New notification received, refreshing count', data);
                dispatch(fetchUnreadCountThunk());

                if (data) {
                    showToast({
                        message: data.message || 'New notification received',
                        type: 'info',
                        title: data.title || 'Notification',
                    });
                }
            };

            socketService.onNewNotification(handleNotification);

            return () => {
                socketService.offNewNotification(handleNotification);
                socketService.disconnect();
            };
        }
    }, [isCustomerAuth, user?.id, dispatch, showToast]);

    // Manage Supplier Socket Connection
    useEffect(() => {
        if (isSupplierAuth && supplier?.id) {
            const token = `supplier_${supplier.id}`;
            // If the socket service supports a supplier type connection
            socketService.connect(token, 'supplier');
            
            // Suppliers might also receive notifications depending on the backend implementation
            // Add supplier notification logic here if necessary in the future
            
            return () => {
                socketService.disconnect();
            };
        }
    }, [isSupplierAuth, supplier?.id]);

    return <>{children}</>;
};

export default SocketProvider;
