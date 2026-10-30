'use client';

import { useRef } from 'react';
import { gsap, useGSAP, ScrollTrigger } from '@/lib/gsap';

const TYPE_ICONS = {
  challenge: { icon: 'emoji_events', className: 'text-tertiary' },
  habit: { icon: 'cycle', className: 'text-secondary' },
  task: { icon: 'task_alt', className: 'text-primary' },
};

export default function HistoryTimeline({ timeline, scrollerRef }) {
  const rootRef = useRef(null);

  useGSAP(() => {
    if (timeline.length === 0) return;
    const scroller = scrollerRef?.current || undefined;
    const mm = gsap.matchMedia();

    mm.add('(prefers-reduced-motion: no-preference)', () => {
      // The line draws itself as you scroll through the history
      gsap.from('.tl-line', {
        scaleY: 0,
        transformOrigin: 'top center',
        ease: 'none',
        scrollTrigger: { trigger: '.tl-list', scroller, start: 'top 85%', end: 'bottom 85%', scrub: 0.6 },
      });

      gsap.set('.tl-item', { opacity: 0, x: -28 });
      ScrollTrigger.batch('.tl-item', {
        scroller,
        start: 'top 92%',
        once: true,
        onEnter: (batch) => {
          gsap.to(batch, { opacity: 1, x: 0, duration: 0.5, stagger: 0.06, ease: 'power3.out', overwrite: true });
          gsap.fromTo(
            batch.map(el => el.querySelector('.tl-chip')),
            { scale: 0 },
            { scale: 1, duration: 0.5, stagger: 0.06, delay: 0.2, ease: 'back.out(3)' },
          );
        },
      });
    });
  }, { scope: rootRef, dependencies: [timeline] });

  return (
    <section ref={rootRef}>
      <h2 className="font-headline-md text-lg font-bold text-on-surface mb-4 flex items-center gap-2">
        <span className="material-symbols-outlined text-primary text-[20px]">history</span>
        Completed History
      </h2>

      {timeline.length === 0 ? (
        <div className="rounded-3xl p-8 text-center border border-outline-variant/60 bg-surface-container-low">
          <span className="material-symbols-outlined text-[44px] text-on-surface-variant mb-3 block">hourglass_empty</span>
          <h3 className="font-bold text-on-surface mb-1">No history yet</h3>
          <p className="text-sm text-on-surface-variant">Complete tasks, habits, and challenges to earn points!</p>
        </div>
      ) : (
        <div className="tl-list relative space-y-3">
          <div className="absolute left-5 top-2 bottom-2 w-0.5 -translate-x-1/2 bg-on-surface/10 rounded-full" />
          <div className="tl-line absolute left-5 top-2 bottom-2 w-0.5 -translate-x-1/2 rounded-full bg-gradient-to-b from-primary via-primary-container to-primary/20" />

          {timeline.map((item, index) => {
            const type = TYPE_ICONS[item.type] || TYPE_ICONS.task;
            return (
              <div key={item.id + index} className="tl-item relative flex items-start gap-3 group">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-surface-container-lowest dark:bg-surface-container border-2 border-surface shadow-sm shrink-0 relative z-10 transition-transform group-hover:scale-110 mt-0.5">
                  <span className={`material-symbols-outlined text-[16px] ${type.className}`}>{type.icon}</span>
                </div>

                <div className="flex-1 min-w-0 rounded-2xl px-4 py-3 border border-outline-variant/60 bg-surface-container-low transition-all group-hover:border-primary/40 group-hover:translate-x-1 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant leading-none mb-1">
                      {new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                    <p className="font-semibold text-sm text-on-surface truncate">{item.title}</p>
                    {item.type === 'challenge' && item.with && (
                      <p className="text-xs text-on-surface-variant mt-0.5 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[12px]">group</span>
                        With {item.with}
                      </p>
                    )}
                  </div>
                  <div className="tl-chip flex items-center gap-1 text-primary font-bold text-sm bg-primary/10 px-2 py-1 rounded-lg shrink-0">
                    +{item.points}
                    <span className="material-symbols-outlined text-[13px]">stars</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
