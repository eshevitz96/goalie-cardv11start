'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

interface FlowScreenProps {
  children: React.ReactNode;
  onBack?: () => void;
  showBack?: boolean;
  backHref?: string;
}

export default function FlowScreen({ children, onBack, showBack = true, backHref }: FlowScreenProps) {
  const router = useRouter();

  function handleBack() {
    if (onBack) {
      onBack();
    } else if (backHref) {
      router.push(backHref);
    } else {
      router.back();
    }
  }

  return (
    <div className="min-h-screen flex flex-col px-6 pt-4 pb-8 relative w-full bg-canvas text-text-primary">
      {/* Back button — fixed position, never overlaps */}
      {showBack && (
        <button
          onClick={handleBack}
          type="button"
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-card transition-colors flex-shrink-0 -ml-1 mb-4 text-text-secondary hover:text-text-primary cursor-pointer"
          aria-label="Go back"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      )}
      {!showBack && <div className="h-14 flex-shrink-0" />}

      {/* Content fills screen */}
      <div className="flex-1 flex flex-col justify-center max-w-lg mx-auto w-full">
        {children}
      </div>
    </div>
  );
}
