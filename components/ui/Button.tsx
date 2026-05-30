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
    primary: 'bg-primary text-primary-foreground hover:opacity-90 shadow-md hover:shadow-lg transition-all active:scale-[0.98]',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-sm active:scale-[0.98]',
    ghost: 'bg-transparent hover:bg-accent hover:text-accent-foreground active:scale-[0.98]',
    danger: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-md active:scale-[0.98]',
    outline: 'bg-transparent border border-border hover:bg-accent hover:text-accent-foreground text-foreground active:scale-[0.98]',
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
