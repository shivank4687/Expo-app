/**
 * Notification Slice
 * Redux slice for managing notification state
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { notificationsApi } from '@/services/api/notifications.api';
import { Notification } from '@/features/notifications/types/notification.types';
import { logoutThunk } from './authSlice';

interface NotificationState {
    orderNotifications: Notification[];
    customerNotifications: Notification[];
    totalUnread: number;
    orderUnread: number;
    customerUnread: number;
    isLoading: boolean;
    error: string | null;
}

const initialState: NotificationState = {
    orderNotifications: [],
    customerNotifications: [],
    totalUnread: 0,
    orderUnread: 0,
    customerUnread: 0,
    isLoading: false,
    error: null,
};

/**
 * Async Thunks
 */

// Fetch notifications
export const fetchNotificationsThunk = createAsyncThunk(
    'notifications/fetchNotifications',
    async ({ page = 1, append = false }: { page?: number; append?: boolean } = {}, { rejectWithValue }) => {
        try {
            const response = await notificationsApi.getNotifications(page);
            return { ...response.data, append };
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to fetch notifications');
        }
    }
);

// Fetch unread count
export const fetchUnreadCountThunk = createAsyncThunk(
    'notifications/fetchUnreadCount',
    async (_, { rejectWithValue }) => {
        try {
            const response = await notificationsApi.getUnreadCount();
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to fetch unread count');
        }
    }
);

// Mark as read
export const markAsReadThunk = createAsyncThunk(
    'notifications/markAsRead',
    async (id: number, { rejectWithValue }) => {
        try {
            await notificationsApi.markAsRead(id);
            return id;
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to mark as read');
        }
    }
);

// Mark order notification as read
export const markOrderAsReadThunk = createAsyncThunk(
    'notifications/markOrderAsRead',
    async (id: number, { rejectWithValue }) => {
        try {
            await notificationsApi.markOrderAsRead(id);
            return id;
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to mark order as read');
        }
    }
);

// Mark all as read
export const markAllAsReadThunk = createAsyncThunk(
    'notifications/markAllAsRead',
    async (_, { rejectWithValue }) => {
        try {
            await notificationsApi.markAllAsRead();
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to mark all as read');
        }
    }
);

/**
 * Notification Slice
 */
const notificationSlice = createSlice({
    name: 'notifications',
    initialState,
    reducers: {
        addNotification: (state, action: PayloadAction<Notification>) => {
            const notification = action.payload;
            if (notification.type === 'order') {
                state.orderNotifications.unshift(notification);
                state.orderUnread += 1;
            } else {
                state.customerNotifications.unshift(notification);
                state.customerUnread += 1;
            }
            state.totalUnread += 1;
        },
        incrementUnreadCount: (state) => {
            state.totalUnread += 1;
        },
        clearNotificationError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        // Fetch notifications
        builder
            .addCase(fetchNotificationsThunk.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchNotificationsThunk.fulfilled, (state, action) => {
                state.isLoading = false;
                const { append, order_notifications, customer_notifications, total_unread, order_unread, customer_unread } = action.payload;

                if (append) {
                    // Append to existing notifications, filtering out duplicates by ID
                    const existingOrderIds = new Set(state.orderNotifications.map(n => n.id));
                    const existingCustomerIds = new Set(state.customerNotifications.map(n => n.id));

                    const newOrderNotifications = order_notifications.filter(n => !existingOrderIds.has(n.id));
                    const newCustomerNotifications = customer_notifications.filter(n => !existingCustomerIds.has(n.id));

                    state.orderNotifications = [...state.orderNotifications, ...newOrderNotifications];
                    state.customerNotifications = [...state.customerNotifications, ...newCustomerNotifications];
                } else {
                    // Replace notifications (for initial load or refresh)
                    state.orderNotifications = order_notifications;
                    state.customerNotifications = customer_notifications;
                }

                state.totalUnread = total_unread;
                state.orderUnread = order_unread;
                state.customerUnread = customer_unread;
            })
            .addCase(fetchNotificationsThunk.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            });

        // Fetch unread count
        builder
            .addCase(fetchUnreadCountThunk.fulfilled, (state, action) => {
                state.totalUnread = action.payload.total_unread;
                state.orderUnread = action.payload.order_unread;
                state.customerUnread = action.payload.customer_unread;
            })
            .addCase(fetchUnreadCountThunk.rejected, (state, action) => {
                // Silently fail - don't show error for unread count
                console.log('Failed to fetch unread count:', action.payload);
            });

        // Mark as read
        builder
            .addCase(markAsReadThunk.fulfilled, (state, action) => {
                const id = action.payload;

                // Find and update in order notifications
                const orderNotif = state.orderNotifications.find(n => n.id === id);
                if (orderNotif && !orderNotif.read_at) {
                    orderNotif.read_at = new Date().toISOString();
                    state.orderUnread = Math.max(0, state.orderUnread - 1);
                    state.totalUnread = Math.max(0, state.totalUnread - 1);
                }

                // Find and update in customer notifications
                const customerNotif = state.customerNotifications.find(n => n.id === id);
                if (customerNotif && !customerNotif.read_at) {
                    customerNotif.read_at = new Date().toISOString();
                    state.customerUnread = Math.max(0, state.customerUnread - 1);
                    state.totalUnread = Math.max(0, state.totalUnread - 1);
                }
            });

        // Mark order as read
        builder
            .addCase(markOrderAsReadThunk.fulfilled, (state, action) => {
                const id = action.payload;

                // Find and update in order notifications
                const orderNotif = state.orderNotifications.find(n => n.id === id);
                if (orderNotif && !orderNotif.read_at) {
                    orderNotif.read_at = new Date().toISOString();
                    state.orderUnread = Math.max(0, state.orderUnread - 1);
                    state.totalUnread = Math.max(0, state.totalUnread - 1);
                }
            });

        // Mark all as read
        builder
            .addCase(markAllAsReadThunk.fulfilled, (state) => {
                const now = new Date().toISOString();
                state.orderNotifications.forEach(n => n.read_at = now);
                state.customerNotifications.forEach(n => n.read_at = now);
                state.totalUnread = 0;
                state.orderUnread = 0;
                state.customerUnread = 0;
            });

        // Reset on logout
        builder.addCase(logoutThunk.fulfilled, (state) => {
            state.orderNotifications = [];
            state.customerNotifications = [];
            state.totalUnread = 0;
            state.orderUnread = 0;
            state.customerUnread = 0;
            state.error = null;
        });
    },
});

export const { addNotification, incrementUnreadCount, clearNotificationError } = notificationSlice.actions;
export default notificationSlice.reducer;
