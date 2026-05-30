/* eslint-disable @next/next/no-img-element */
import { cn } from "@/lib/utils"

/**
 * Avatar Component
 * Displays a user image or fallback initials.
 */
interface AvatarProps {
    src?: string | null;
    alt?: string;
    fallback?: string;
    size?: "sm" | "md" | "lg" | "xl";
    className?: string;
}

export function Avatar({ src, alt, fallback, size = "md", className }: AvatarProps) {
    const sizeClasses = {
        sm: "h-8 w-8 text-xs",
        md: "h-12 w-12 text-sm",
        lg: "h-16 w-16 text-base",
        xl: "h-24 w-24 text-lg",
    };

    return (
        <div
            className={cn(
                "relative inline-flex shrink-0 overflow-hidden rounded-full bg-muted shadow-inner border border-white/10",
                sizeClasses[size],
                className
            )}
        >
            {src ? (
                <img
                    src={src}
                    alt={alt || "Avatar"}
                    className="aspect-square h-full w-full object-cover"
                />
            ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900 text-zinc-400 font-bold uppercase tracking-wider">
                    {fallback || (alt ? alt.substring(0, 2) : "??")}
                </div>
            )}
        </div>
    )
}
