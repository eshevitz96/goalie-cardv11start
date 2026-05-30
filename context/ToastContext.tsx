"use client";

import React, { createContext, useContext, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
    id: string;
    type: ToastType;
    message: string;
    duration?: number;
}

interface ToastContextValue {
    toast: (message: string, type?: ToastType, duration?: number) => void;
    success: (message: string, duration?: number) => void;
    error: (message: string, duration?: number) => void;
    info: (message: string, duration?: number) => void;
    warning: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const addToast = useCallback((message: string, type: ToastType = 'info', duration = 5000) => {
        const id = Math.random().toString(36).substring(7);
        const newToast: Toast = { id, type, message, duration };

        setToasts((prev) => [...prev, newToast]);

        if (duration > 0) {
            setTimeout(() => removeToast(id), duration);
        }
    }, [removeToast]);

    const toast = useCallback((message: string, type: ToastType = 'info', duration?: number) => {
        addToast(message, type, duration);
    }, [addToast]);

    const success = useCallback((message: string, duration?: number) => {
        addToast(message, 'success', duration);
    }, [addToast]);

    const error = useCallback((message: string, duration?: number) => {
        addToast(message, 'error', duration);
    }, [addToast]);

    const info = useCallback((message: string, duration?: number) => {
        addToast(message, 'info', duration);
    }, [addToast]);

    const warning = useCallback((message: string, duration?: number) => {
        addToast(message, 'warning', duration);
    }, [addToast]);

    return (
        <ToastContext.Provider value={{ toast, success, error, info, warning }}>
            {children}
            <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none max-w-sm w-full sm:max-w-md">
                <AnimatePresence>
                    {toasts.map((toast) => (
                        <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
    const icons = {
        success: <CheckCircle size={20} />,
        error: <XCircle size={20} />,
        info: <Info size={20} />,
        warning: <AlertTriangle size={20} />,
    };

    const styles = {
        success: 'bg-green-500/90 text-white border-green-600',
        error: 'bg-red-500/90 text-white border-red-600',
        info: 'bg-blue-500/90 text-white border-blue-600',
        warning: 'bg-yellow-500/90 text-black border-yellow-600',
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.95 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className={`${styles[toast.type]} pointer-events-auto backdrop-blur-md rounded-xl border px-4 py-3 shadow-2xl flex items-start gap-3 relative group`}
        >
            <div className="shrink-0 mt-0.5">{icons[toast.type]}</div>
            <p className="text-sm font-medium flex-1 leading-relaxed">{toast.message}</p>
            <button
                onClick={() => onRemove(toast.id)}
                className="shrink-0 opacity-70 hover:opacity-100 transition-opacity p-1 -m-1"
                aria-label="Dismiss"
            >
                <X size={16} />
            </button>
        </motion.div>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within ToastProvider');
    }
    return context;
}
