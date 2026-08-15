import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface EventNameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string, date: string) => void;
}

export function EventNameModal({ isOpen, onClose, onSubmit }: EventNameModalProps) {
  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState(new Date().toISOString().slice(0, 16));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (eventName.trim()) {
      onSubmit(eventName.trim(), eventDate);
      setEventName('');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0, 0, 0, 0.8)',
              backdropFilter: 'blur(10px)',
              zIndex: 999
            }}
          />
          
          <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000,
            pointerEvents: 'none'
          }}>
            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-card border border-border rounded-3xl p-8 w-full max-w-[400px] pointer-events-auto shadow-2xl font-sans"
            >
              <h2 className="text-2xl font-bold mb-2 text-foreground font-sans tracking-tight">New Game Session</h2>
              <p className="text-muted-foreground text-sm mb-6">
                Enter event details before attaching clips.
              </p>

              <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-muted-foreground">Event Name</label>
                  <input
                    type="text"
                    value={eventName}
                    onChange={e => setEventName(e.target.value)}
                    placeholder="e.g., vs Avalanche"
                    autoFocus
                    required
                    className="w-full bg-muted border border-border rounded-xl p-4 text-base text-foreground outline-none transition-colors focus:border-foreground/30 placeholder:text-muted-foreground/50"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-muted-foreground">Date & Time</label>
                  <input
                    type="datetime-local"
                    value={eventDate}
                    onChange={e => setEventDate(e.target.value)}
                    required
                    className="w-full bg-muted border border-border rounded-xl p-4 text-base text-foreground outline-none transition-colors focus:border-foreground/30 placeholder:text-muted-foreground/50"
                  />
                </div>

                <div className="flex gap-3 mt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-3.5 bg-transparent text-foreground border border-border rounded-xl font-semibold cursor-pointer hover:bg-muted transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!eventName.trim()}
                    className="flex-1 py-3.5 bg-foreground text-background border-none rounded-xl font-bold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:bg-foreground/90 transition-colors"
                  >
                    Continue
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
