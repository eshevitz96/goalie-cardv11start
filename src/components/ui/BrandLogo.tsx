"use client";

import React, { useState, useEffect } from 'react';
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
  size, 
  withText = true,
  textClassName = "text-2xl font-black tracking-tighter"
}: BrandProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  
  const isDark = mounted && resolvedTheme === 'dark';

  return (
    <div 
      className={twMerge("flex items-center gap-[0.4ch]", textClassName, className)}
      style={size ? { fontSize: `${size}px` } : undefined}
    >
      <div className="relative flex items-center justify-center shrink-0" style={{ height: '0.78em', width: '0.78em' }}>
        <img
          src="/flower-logo.png?v=5"
          alt="Goalie Card Logo"
          draggable={false}
          className="h-full w-full object-contain pointer-events-none select-none opacity-100 transition-all duration-300"
          style={{ 
            filter: isDark ? 'invert(1)' : 'none',
            display: mounted ? 'block' : 'none' 
          }}
        />
        {!mounted && <div style={{ height: '0.78em', width: '0.78em' }} />}
      </div>
      {withText && (
        <span className="leading-none whitespace-nowrap">
          Goalie Card
        </span>
      )}
    </div>
  );
}
