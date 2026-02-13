"use client";

import { twMerge } from "tailwind-merge";

interface GoalieGuardLogoProps {
    size?: number;
    className?: string;
}

/**
 * GoalieGuard brand logo — solid filled shield, no border, no background.
 * Uses currentColor so it inherits text color from parent.
 */
export function GoalieGuardLogo({ size = 24, className }: GoalieGuardLogoProps) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={twMerge("shrink-0", className)}
        >
            <path
                d="M12 2C9 2 6.5 3 4.5 4.5V13c0 2.5 1.5 5 3.5 6.5C10 21 11.5 21.75 12 22c.5-.25 2-1 3.5-2.5 2-1.5 3.5-4 3.5-6.5V4.5C17.5 3 15 2 12 2z"
                fill="currentColor"
            />
        </svg>
    );
}
