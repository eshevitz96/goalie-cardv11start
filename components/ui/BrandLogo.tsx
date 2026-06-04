"use client";

import React from 'react';
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
  size, 
  withText = true,
  textClassName = "text-3xl md:text-4xl font-medium tracking-tight"
}: BrandProps) {
  return (
    <div 
      className={twMerge("flex items-center gap-[0.4ch]", textClassName, className)}
      style={size ? { fontSize: `${size}px` } : undefined}
    >
      <div className="relative flex items-center justify-center shrink-0" style={{ height: '1.0em', width: '1.0em' }}>
        <img
          src="/flower-logo.png?v=5"
          alt="Goalie Card Logo"
          draggable={false}
          className="h-full w-full object-contain pointer-events-none select-none opacity-100 transition-all duration-300"
          style={{ 
            filter: 'invert(1)'
          }}
        />
      </div>
      {withText && (
        <span className="leading-none whitespace-nowrap">
          Goalie Card
        </span>
      )}
    </div>
  );
}
