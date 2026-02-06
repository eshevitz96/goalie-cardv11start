"use client";

import React from 'react';
import { twMerge } from 'tailwind-merge';
import { Loader2 } from 'lucide-react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    loading?: boolean;
    children: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
    primary: 'bg-primary text-primary-foreground hover:opacity-90 shadow-lg shadow-primary/20',
    secondary: 'bg-secondary text-secondary-foreground hover:opacity-90',
    ghost: 'bg-transparent hover:bg-muted text-foreground',
    danger: 'bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/20',
    outline: 'bg-transparent border-2 border-border hover:bg-muted text-foreground',
};

const sizeStyles: Record<ButtonSize, string> = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
    icon: 'h-10 w-10 p-0',
};

export function Button({
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled,
    className,
    children,
    ...props
}: ButtonProps) {
    return (
        <button
            disabled={disabled || loading}
            className={twMerge(
                'font-bold rounded-xl transition-all inline-flex items-center justify-center gap-2',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'active:scale-[0.98]',
                variantStyles[variant],
                sizeStyles[size],
                className
            )}
            {...props}
        >
            {loading && <Loader2 className="animate-spin" size={16} />}
            {children}
        </button>
    );
}
