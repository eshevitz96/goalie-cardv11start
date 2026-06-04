"use client";

import React from 'react';

interface PerformanceAvatarProps {
    score: number; // 0 to 100
    size?: number; // overall width/height
    children: React.ReactNode;
}

export function PerformanceAvatar({ score, size = 48, children }: PerformanceAvatarProps) {
    const strokeWidth = 2.5;
    const padding = 3; // Space between ring and inner content
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const validatedScore = Math.min(Math.max(score, 0), 100);
    const strokeDashoffset = circumference - (validatedScore / 100) * circumference;

    return (
        <div className="relative flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
            {/* SVG Performance Ring */}
            <svg className="absolute transform -rotate-90 pointer-events-none select-none" width={size} height={size}>
                {/* Background track (greyed-out) */}
                <circle
                    className="text-zinc-800"
                    stroke="currentColor"
                    fill="transparent"
                    strokeWidth={strokeWidth}
                    r={radius}
                    cx={size / 2}
                    cy={size / 2}
                />
                {/* Active progress track */}
                {validatedScore > 0 && (
                    <circle
                        className="text-[#006747] transition-all duration-700 ease-out"
                        stroke="currentColor"
                        fill="transparent"
                        strokeWidth={strokeWidth}
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        r={radius}
                        cx={size / 2}
                        cy={size / 2}
                    />
                )}
            </svg>

            {/* Inner avatar container */}
            <div 
                className="rounded-full overflow-hidden flex items-center justify-center" 
                style={{ 
                    width: size - (strokeWidth * 2) - (padding * 2), 
                    height: size - (strokeWidth * 2) - (padding * 2) 
                }}
            >
                {children}
            </div>
        </div>
    );
}
