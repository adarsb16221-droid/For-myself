'use client';

import { useEffect, useRef, useState } from 'react';
import { gsap, useGSAP } from '@/lib/gsap';

export const MOODS = [
  { id: 'great', emoji: '🤩', label: 'Great', ink: '#2f8f5b' },
  { id: 'good', emoji: '🙂', label: 'Good', ink: '#4648d4' },
  { id: 'okay', emoji: '😐', label: 'Okay', ink: '#9a7413' },
  { id: 'low', emoji: '😔', label: 'Low', ink: '#6b4fa0' },
  { id: 'rough', emoji: '😣', label: 'Rough', ink: '#b3261e' },
];

export default function MoodStamp({ mood, onChange, readOnly }) {
  const rootRef = useRef(null);
  const justStamped = useRef(false);
  const [open, setOpen] = useState(false);
  const current = MOODS.find(m => m.id === mood);

  useEffect(() => {
    if (!open) return;
    const close = (e) => {
      if (!rootRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [open]);

  // Thunk the stamp down only when the user picks a mood, not on every render
  useGSAP(() => {
    if (!justStamped.current || !current) return;
    justStamped.current = false;
    gsap.fromTo('.journal-mood-stamp',
      { scale: 1.9, opacity: 0, rotation: -30 },
      { scale: 1, opacity: 0.88, rotation: -12, duration: 0.45, ease: 'back.out(3)' });
  }, { scope: rootRef, dependencies: [mood] });

  const pick = (id) => {
    justStamped.current = id !== null;
    setOpen(false);
    onChange(id);
  };

  if (readOnly && !current) return <div className="w-16 h-16 shrink-0" />;

  return (
    <div ref={rootRef} className="relative shrink-0">
      {current ? (
        <button
          type="button"
          disabled={readOnly}
          onClick={() => setOpen(o => !o)}
          className="journal-mood-stamp"
          style={{ '--ink': current.ink }}
          title={readOnly ? `Mood: ${current.label}` : 'Change mood'}
        >
          <span className="text-[22px] leading-none">{current.emoji}</span>
          <span>{current.label}</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          className="journal-mood-empty"
          title="Stamp today's mood"
        >
          mood?
        </button>
      )}

      {open && (
        <div className="absolute right-0 top-[72px] z-40 flex items-center gap-1 rounded-xl border border-outline-variant bg-surface-container-lowest p-1.5 shadow-xl">
          {MOODS.map(m => (
            <button
              key={m.id}
              type="button"
              onClick={() => pick(m.id)}
              title={m.label}
              className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-transform hover:scale-125 hover:bg-on-surface/5 ${m.id === mood ? 'bg-primary/10' : ''}`}
            >
              {m.emoji}
            </button>
          ))}
          {current && (
            <button
              type="button"
              onClick={() => pick(null)}
              title="Remove stamp"
              className="w-10 h-10 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-on-surface/5"
            >
              <span className="material-symbols-outlined text-[18px]">ink_eraser</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
