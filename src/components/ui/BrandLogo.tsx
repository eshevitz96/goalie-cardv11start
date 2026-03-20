"use client";

import React from 'react';
import { useTheme } from 'next-themes';
import { twMerge } from 'tailwind-merge';

interface BrandProps {
  className?: string;
  size?: number;
  withText?: boolean;
  textClassName?: string;
}

/**
 * Standard Goalie Card Logo Lock (V11)
 * Optimized for consistency across all platforms.
 */
export function BrandLogo({ 
  className, 
  size = 64, 
  withText = true,
  textClassName = "text-2xl font-medium tracking-tight"
}: BrandProps) {
  const { theme } = useTheme();
  
  return (
    <div className={twMerge("flex items-center gap-0.5", className)}>
      <div className="relative flex items-center justify-center overflow-hidden" style={{ width: size, height: size }}>
        <img
          src="/flower-logo.png?v=5"
          alt="Goalie Card Logo"
          width={size}
          height={size}
          draggable={false}
          className="object-contain pointer-events-none select-none opacity-100 transition-all duration-300"
          style={{ filter: theme === 'dark' ? 'invert(1)' : 'none' }}
        />
      </div>
      {withText && (
        <span className={twMerge("text-foreground leading-none whitespace-nowrap", textClassName)}>
          Goalie Card
        </span>
      )}
    </div>
  );
}
