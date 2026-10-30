'use client';

import { useRef } from 'react';
import { gsap, useGSAP } from '@/lib/gsap';
import { getBadges } from '@/lib/profileProgress';

export default function BadgeShelf({ profile }) {
  const rootRef = useRef(null);
  const badges = getBadges(profile);
  const unlockedCount = badges.filter(badge => badge.unlocked).length;

  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.from('.badge-tile', { opacity: 0, scale: 0.6, y: 12, duration: 0.5, stagger: 0.05, ease: 'back.out(2)', delay: 0.4 });
    });
  }, { scope: rootRef });

  return (
    <section ref={rootRef} className="rounded-3xl p-5 border border-outline-variant/60 bg-surface-container-low">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-headline-md text-lg font-bold text-on-surface flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-[20px]">workspace_premium</span>
          Badges
        </h2>
        <span className="text-xs font-semibold text-on-surface-variant bg-on-surface/5 px-2 py-1 rounded-full tabular-nums">
          {unlockedCount} / {badges.length}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {badges.map(badge => (
          <div
            key={badge.id}
            title={`${badge.name}: ${badge.desc}${badge.unlocked ? '' : ` (${Math.min(badge.value, badge.goal)}/${badge.goal})`}`}
            className="badge-tile group flex flex-col items-center text-center gap-1.5"
          >
            <div
              className={`relative w-14 h-14 rounded-2xl flex items-center justify-center overflow-hidden transition-transform duration-300 group-hover:-translate-y-1 group-hover:rotate-3 ${
                badge.unlocked
                  ? 'badge-shine bg-gradient-to-br from-primary to-primary-container text-on-primary shadow-[0_6px_18px_rgba(70,72,212,0.35)]'
                  : 'bg-on-surface/5 text-on-surface-variant/50 border border-dashed border-outline-variant'
              }`}
            >
              <span className="material-symbols-outlined text-[26px]" style={badge.unlocked ? { fontVariationSettings: "'FILL' 1" } : undefined}>
                {badge.icon}
              </span>
              {!badge.unlocked && (
                <span className="material-symbols-outlined absolute bottom-0.5 right-0.5 text-[12px] text-on-surface-variant/70">lock</span>
              )}
            </div>
            <p className={`text-[11px] font-semibold leading-tight ${badge.unlocked ? 'text-on-surface' : 'text-on-surface-variant/70'}`}>
              {badge.name}
            </p>
            {!badge.unlocked && (
              <div className="w-10 h-1 rounded-full bg-on-surface/10 overflow-hidden">
                <div className="h-full bg-primary/60 rounded-full" style={{ width: `${Math.min(badge.value / badge.goal, 1) * 100}%` }} />
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
