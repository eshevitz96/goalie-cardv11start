'use client';

import React, { useEffect, useRef } from 'react';

interface TextInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  multiline?: boolean;
  autoFocus?: boolean;
  className?: string;
}

export default function TextInput({
  value,
  onChange,
  placeholder = '',
  maxLength,
  multiline = false,
  autoFocus = true,
  className = '',
}: TextInputProps) {
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      // Small delay to ensure the screen transition completes
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [autoFocus]);

  const sharedClasses = `
    w-full bg-transparent text-foreground text-xl font-bold
    border-b-2 border-border focus:border-[#006747] focus:outline-none
    transition-colors duration-200 pb-3 min-h-[56px]
    placeholder:text-muted-foreground
    ${className}
  `;

  if (multiline) {
    return (
      <div className="relative w-full">
        <textarea
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          value={value}
          onChange={(e) => {
            if (maxLength && e.target.value.length > maxLength) return;
            onChange(e.target.value);
          }}
          placeholder={placeholder}
          rows={3}
          className={`${sharedClasses} resize-none`}
        />
        {maxLength && (
          <span className="absolute bottom-1 right-0 text-xs text-muted-foreground">
            {value.length}/{maxLength}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="relative w-full">
      <input
        ref={inputRef as React.RefObject<HTMLInputElement>}
        type="text"
        value={value}
        onChange={(e) => {
          if (maxLength && e.target.value.length > maxLength) return;
          onChange(e.target.value);
        }}
        placeholder={placeholder}
        className={sharedClasses}
      />
      {maxLength && (
        <span className="absolute bottom-1 right-0 text-xs text-muted-foreground">
          {value.length}/{maxLength}
        </span>
      )}
    </div>
  );
}
