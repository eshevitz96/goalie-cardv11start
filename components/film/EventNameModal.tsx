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
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--surface-glass-border)',
                borderRadius: '24px',
                padding: '32px',
                width: '100%',
                maxWidth: '400px',
                pointerEvents: 'auto',
                boxShadow: '0 24px 48px rgba(0,0,0,0.5)'
              }}
            >
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '8px', color: '#FFFFFF' }}>New Game Session</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '24px' }}>
                Enter event details before attaching clips.
              </p>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Event Name</label>
                  <input
                    type="text"
                    value={eventName}
                    onChange={e => setEventName(e.target.value)}
                    placeholder="e.g., vs Avalanche"
                    autoFocus
                    required
                    style={{
                      width: '100%',
                      background: 'var(--bg-tertiary)',
                      border: '1px solid var(--surface-glass-border)',
                      borderRadius: '12px',
                      padding: '16px',
                      fontSize: '1rem',
                      color: '#FFFFFF',
                      outline: 'none',
                      transition: 'border-color 0.2s'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Date & Time</label>
                  <input
                    type="datetime-local"
                    value={eventDate}
                    onChange={e => setEventDate(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      background: 'var(--bg-tertiary)',
                      border: '1px solid var(--surface-glass-border)',
                      borderRadius: '12px',
                      padding: '16px',
                      fontSize: '1rem',
                      color: '#FFFFFF',
                      outline: 'none',
                      transition: 'border-color 0.2s'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={onClose}
                    style={{
                      flex: 1,
                      padding: '14px',
                      background: 'transparent',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--surface-glass-border)',
                      borderRadius: '12px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!eventName.trim()}
                    style={{
                      flex: 1,
                      padding: '14px',
                      background: '#FFFFFF',
                      color: '#000000',
                      border: 'none',
                      borderRadius: '12px',
                      fontWeight: 700,
                      cursor: eventName.trim() ? 'pointer' : 'not-allowed',
                      opacity: eventName.trim() ? 1 : 0.5
                    }}
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
