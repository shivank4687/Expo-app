import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastConfig {
    message: string;
    title?: string;
    type?: ToastType;
    duration?: number;
}

export interface ToastState extends ToastConfig {
    visible: boolean;
    id: number;
}

interface ToastContextType {
    toast: ToastState;
    showToast: (config: ToastConfig) => void;
    hideToast: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [toast, setToast] = useState<ToastState>({
        visible: false,
        message: '',
        type: 'info',
        duration: 3000,
        id: 0,
    });

    const showToast = useCallback((config: ToastConfig) => {
        setToast({
            visible: true,
            message: config.message,
            title: config.title,
            type: config.type || 'info',
            duration: config.duration || 3000,
            id: Date.now(),
        });
    }, []);

    const hideToast = useCallback(() => {
        setToast((prev) => ({ ...prev, visible: false }));
    }, []);

    return (
        <ToastContext.Provider value={{ toast, showToast, hideToast }}>
            {children}
        </ToastContext.Provider>
    );
};

export const useToast = (): ToastContextType => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within ToastProvider');
    }
    return context;
};

export { ToastContext };

