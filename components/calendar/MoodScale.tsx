'use client';

import React, { useState } from 'react';

export type MoodValue = 'locked_in' | 'solid' | 'mixed' | 'off' | 'cooked';

interface MoodOption {
  emoji: string;
  label: string;
  value: MoodValue;
}

const MOODS: MoodOption[] = [
  { emoji: '🔥', label: 'Locked in', value: 'locked_in' },
  { emoji: '👍', label: 'Solid', value: 'solid' },
  { emoji: '😐', label: 'Mixed bag', value: 'mixed' },
  { emoji: '😤', label: 'Off', value: 'off' },
  { emoji: '💀', label: 'Cooked', value: 'cooked' },
];

interface MoodScaleProps {
  onSelect: (mood: MoodValue) => void;
  selected?: MoodValue;
}

export default function MoodScale({ onSelect, selected }: MoodScaleProps) {
  const [localSelected, setLocalSelected] = useState<MoodValue | undefined>(selected);

  function handleTap(value: MoodValue) {
    setLocalSelected(value);
    setTimeout(() => {
      onSelect(value);
    }, 300);
  }

  return (
    <div className="flex flex-col gap-3 w-full stagger-children">
      {MOODS.map((mood) => {
        const isActive = localSelected === mood.value;
        return (
          <button
            key={mood.value}
            type="button"
            onClick={() => handleTap(mood.value)}
            className={`
              flex items-center gap-4 w-full px-5 py-4 rounded-2xl
              border transition-all duration-200 min-h-[56px]
              cursor-pointer select-none active:scale-[0.98] text-left
              ${isActive 
                ? 'bg-accent/10 border-accent text-accent shadow-[0_0_20px_rgba(0,230,118,0.08)]' 
                : 'bg-card border-border-subtle text-text-primary hover:bg-card-hover hover:border-border-focus'
              }
            `}
          >
            <span className="text-2xl">{mood.emoji}</span>
            <span className="text-body-lg font-medium">
              {mood.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
