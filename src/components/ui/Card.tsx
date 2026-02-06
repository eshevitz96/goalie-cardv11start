import React from 'react';
import { cn } from '@/lib/utils'; // Assuming cn exists, if not use clsx/tailwind-merge

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'glass' | 'outline';
    padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function Card({
    className,
    variant = 'default',
    padding = 'md',
    children,
    ...props
}: CardProps) {
    const baseStyles = "rounded-2xl transition-all";

    const variants = {
        default: "bg-white text-black shadow-sm",
        glass: "glass text-foreground border border-white/10", // 'glass' class assumed global or from index.css
        outline: "border-2 border-border bg-transparent"
    };

    const paddings = {
        none: "p-0",
        sm: "p-4",
        md: "p-6",
        lg: "p-8"
    };

    return (
        <div
            className={cn(baseStyles, variants[variant], paddings[padding], className)}
            {...props}
        >
            {children}
        </div>
    );
}

export function CardHeader({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return <div className={cn("flex flex-col space-y-1.5 p-6", className)} {...props}>{children}</div>
}

export function CardTitle({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
    return <h3 className={cn("font-semibold leading-none tracking-tight", className)} {...props}>{children}</h3>
}

export function CardContent({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return <div className={cn("p-6 pt-0", className)} {...props}>{children}</div>
}
