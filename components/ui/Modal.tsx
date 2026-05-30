"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
    hideCloseButton?: boolean;
}

const sizeStyles = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
};

import { createPortal } from 'react-dom';

export function Modal({ isOpen, onClose, title, children, size = 'md', className, hideCloseButton = false }: ModalProps) {
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    // Close on Escape key
    React.useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            // Prevent scroll on body
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!mounted) return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.95, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.95, y: 20 }}
                        transition={{ duration: 0.2 }}
                        className={twMerge(
                            'bg-card w-full rounded-2xl overflow-hidden shadow-2xl border border-border relative',
                            sizeStyles[size],
                            className
                        )}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        {title && (
                            <div className="p-4 border-b border-border flex items-center justify-between bg-card/95 backdrop-blur-sm">
                                <h3 className="font-bold text-lg text-foreground">{title}</h3>
                                {!hideCloseButton && (
                                    <button
                                        onClick={onClose}
                                        className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground"
                                        aria-label="Close modal"
                                    >
                                        <X size={20} />
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Close button without title */}
                        {!title && !hideCloseButton && (
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground z-10"
                                aria-label="Close modal"
                            >
                                <X size={20} />
                            </button>
                        )}

                        {/* Content */}
                        <div className="p-6">{children}</div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
}
