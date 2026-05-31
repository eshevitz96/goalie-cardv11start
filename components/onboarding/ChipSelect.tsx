'use client';

import React from 'react';

export interface SportOption {
  id: string;
  label: string;
  icon: string;
}

export const SPORT_OPTIONS: SportOption[] = [
  { id: 'ice_hockey_mens', label: 'Ice Hockey (M)', icon: '🏒' },
  { id: 'ice_hockey_womens', label: 'Ice Hockey (W)', icon: '🏒' },
  { id: 'soccer_mens', label: 'Soccer (M)', icon: '⚽' },
  { id: 'soccer_womens', label: 'Soccer (W)', icon: '⚽' },
  { id: 'lacrosse_mens', label: 'Lacrosse (M)', icon: '🥍' },
  { id: 'lacrosse_womens', label: 'Lacrosse (W)', icon: '🥍' },
  { id: 'field_hockey', label: 'Field Hockey', icon: '🏑' },
];

interface ChipSelectProps {
  selected: string | null;
  onChange: (sportId: string) => void;
}

export default function ChipSelect({ selected, onChange }: ChipSelectProps) {
  return (
    <div className="grid grid-cols-1 gap-3 stagger-children w-full">
      {SPORT_OPTIONS.map((sport) => {
        const isActive = selected === sport.id;
        return (
          <button
            key={sport.id}
            onClick={() => onChange(sport.id)}
            type="button"
            className={`
              flex items-center gap-4 px-5 py-4 rounded-2xl border text-body-lg font-semibold
              transition-all duration-200 min-h-[56px] w-full text-left
              cursor-pointer select-none active:scale-[0.98]
              ${isActive
                ? 'bg-accent/10 border-accent text-accent'
                : 'bg-card border-border-subtle text-text-primary hover:bg-card-hover hover:border-border-focus'
              }
            `}
          >
            <span className="text-2xl">{sport.icon}</span>
            <span className="flex-1">{sport.label}</span>
          </button>
        );
      })}
    </div>
  );
}
