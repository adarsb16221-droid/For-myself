'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { gsap, useGSAP, SplitText } from '@/lib/gsap';
import { getLevel } from '@/lib/profileProgress';

const RING_RADIUS = 46;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function tilt(e) {
  if (prefersReducedMotion()) return;
  const tile = e.currentTarget;
  const rect = tile.getBoundingClientRect();
  const x = (e.clientX - rect.left) / rect.width - 0.5;
  const y = (e.clientY - rect.top) / rect.height - 0.5;
  gsap.to(tile, { rotationY: x * 16, rotationX: -y * 16, transformPerspective: 600, duration: 0.4, ease: 'power2.out' });
}

function resetTilt(e) {
  gsap.to(e.currentTarget, { rotationX: 0, rotationY: 0, duration: 0.8, ease: 'elastic.out(1, 0.5)' });
}

function StatTile({ stat }) {
  const content = (
    <div
      onMouseMove={tilt}
      onMouseLeave={resetTilt}
      className="h-full flex items-center gap-3 rounded-2xl px-4 py-3 bg-surface-container-lowest dark:bg-surface-container border border-outline-variant/60 hover:border-primary/40 transition-colors will-change-transform"
    >
      <div className="w-10 h-10 rounded-xl bg-on-surface/5 flex items-center justify-center shrink-0">
        <span className={`material-symbols-outlined ${stat.iconClass}`} style={stat.iconStyle}>{stat.icon}</span>
      </div>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wider text-on-surface-variant font-bold leading-none mb-1">{stat.label}</p>
        <p className="text-xl font-bold text-on-surface leading-none tabular-nums">
          <span data-count={stat.value}>{stat.value}</span>
          {stat.suffix && <span className="text-xs font-medium text-on-surface-variant ml-1">{stat.suffix}</span>}
        </p>
      </div>
    </div>
  );

  return (
    <div className="hero-stat">
      {stat.href ? <Link href={stat.href} className="block h-full">{content}</Link> : content}
    </div>
  );
}

export default function ProfileHero({ profile }) {
  const rootRef = useRef(null);
  const points = Math.max(0, profile.user.orbitPoints || 0);
  const streak = profile.streak ?? 0;
  const level = getLevel(points);

  // Flame grows with the streak, capped at 30 days
  const flameSize = 20 + Math.min(streak, 30) / 30 * 10;

  const stats = [
    { label: 'Points', value: points, icon: 'stars', iconClass: 'text-tertiary' },
    { label: 'Streak', value: streak, suffix: streak === 1 ? 'day' : 'days', icon: 'local_fire_department', iconClass: `text-orange-500 ${streak > 0 ? 'hero-flame' : ''}`, iconStyle: { fontSize: flameSize } },
    { label: 'Friends', value: profile.friendCount ?? 0, icon: 'group', iconClass: 'text-secondary', href: '/community' },
    { label: 'Won', value: profile.completedChallengesCount ?? 0, icon: 'emoji_events', iconClass: 'text-primary', href: '/challenges' },
  ];

  useGSAP(() => {
    const mm = gsap.matchMedia();

    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const split = SplitText.create('.hero-name', { type: 'chars' });
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      tl.from('.hero-card', { opacity: 0, y: 24, duration: 0.6 })
        .from('.hero-avatar', { scale: 0.5, opacity: 0, duration: 0.8, ease: 'back.out(1.8)' }, '-=0.3')
        .from(split.chars, { opacity: 0, y: 16, rotationX: -90, duration: 0.45, stagger: 0.035 }, '-=0.4')
        .from('.hero-sub', { opacity: 0, y: 8, duration: 0.4, stagger: 0.08 }, '-=0.2')
        .from('.hero-ring', { strokeDashoffset: RING_CIRCUMFERENCE, duration: 1.4, ease: 'power2.out' }, '<')
        .from('.hero-level-bar', { scaleX: 0, transformOrigin: 'left center', duration: 1.2, ease: 'power2.out' }, '<')
        .from('.hero-stat', { opacity: 0, y: 20, duration: 0.5, stagger: 0.08 }, '-=1.1');

      rootRef.current.querySelectorAll('[data-count]').forEach((el) => {
        const target = Number(el.dataset.count);
        const counter = { value: 0 };
        el.textContent = '0';
        tl.to(counter, {
          value: target,
          duration: 1.4,
          ease: 'power2.out',
          onUpdate: () => { el.textContent = Math.round(counter.value); },
        }, 0.6);
      });

      gsap.to('.hero-orb', {
        x: 'random(-60, 60)',
        y: 'random(-30, 30)',
        duration: 'random(5, 9)',
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });
    });
  }, { scope: rootRef });

  return (
    <section ref={rootRef}>
      <div className="hero-card rounded-3xl overflow-hidden border border-outline-variant/60 bg-surface-container-low">
        {/* Banner */}
        <div className="hero-banner relative h-28 md:h-36 overflow-hidden">
          <div className="hero-orb absolute -top-10 left-[10%] w-48 h-48 rounded-full bg-white/20 blur-3xl" />
          <div className="hero-orb absolute top-4 right-[15%] w-40 h-40 rounded-full bg-[#8792fe]/50 blur-3xl" />
          <div className="hero-orb absolute -bottom-16 left-[45%] w-56 h-56 rounded-full bg-[#2f2ebe]/40 blur-3xl" />
          <span className="material-symbols-outlined absolute right-6 bottom-3 text-white/15 text-[96px] md:text-[120px] select-none pointer-events-none">raven</span>
        </div>

        <div className="px-5 md:px-8 pb-6">
          <div className="flex flex-col md:flex-row md:items-start gap-4 md:gap-6">
            {/* Avatar with level ring */}
            <div className="hero-avatar relative w-[104px] h-[104px] shrink-0 -mt-12 md:-mt-14">
              <svg viewBox="0 0 104 104" className="absolute inset-0 -rotate-90 drop-shadow-[0_0_10px_rgba(96,99,238,0.45)]">
                <circle cx="52" cy="52" r={RING_RADIUS} fill="none" strokeWidth="6" className="stroke-surface-container-lowest" />
                <circle
                  className="hero-ring stroke-primary"
                  cx="52" cy="52" r={RING_RADIUS}
                  fill="none" strokeWidth="6" strokeLinecap="round"
                  style={{ strokeDasharray: RING_CIRCUMFERENCE, strokeDashoffset: RING_CIRCUMFERENCE * (1 - level.progress) }}
                />
              </svg>
              <div className="absolute inset-[11px] rounded-full bg-surface-container-lowest flex items-center justify-center border border-outline-variant/60">
                <span className="text-4xl font-bold uppercase font-headline-md text-primary">{profile.user.name.charAt(0)}</span>
              </div>
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-primary text-on-primary text-[11px] font-bold shadow-md whitespace-nowrap">
                Lv {level.level}
              </span>
            </div>

            {/* Name + level */}
            <div className="flex-1 min-w-0 md:pt-4">
              <h1 className="hero-name font-headline-md text-2xl md:text-3xl font-bold text-on-surface truncate [perspective:400px]">
                {profile.user.name}
              </h1>
              <p className="hero-sub text-sm text-on-surface-variant truncate">{profile.user.email}</p>
              <p className="hero-sub mt-1 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                <span className="material-symbols-outlined text-[16px]">military_tech</span>
                {level.title}
              </p>
            </div>

            {/* Level progress */}
            <div className="hero-sub w-full md:w-64 md:pt-5">
              <div className="flex justify-between text-xs mb-1.5">
                <span className="font-semibold text-on-surface">Level {level.level}</span>
                <span className="text-on-surface-variant">
                  {level.next ? `${points - level.min} / ${level.next.min - level.min} to ${level.next.title}` : 'Top of the sky'}
                </span>
              </div>
              <div className="h-2.5 rounded-full bg-on-surface/10 overflow-hidden">
                <div
                  className="hero-level-bar h-full rounded-full bg-gradient-to-r from-primary to-primary-container"
                  style={{ width: `${Math.max(level.progress * 100, 2)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
            {stats.map(stat => <StatTile key={stat.label} stat={stat} />)}
          </div>
        </div>
      </div>
    </section>
  );
}
