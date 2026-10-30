'use client';

import { useRef, useState } from 'react';
import { gsap, useGSAP } from '@/lib/gsap';

// ── Heatmap helpers ──────────────────────────────────────────────
function getIntensity(count) {
  if (!count || count === 0) return 0;
  if (count === 1) return 1;
  if (count <= 3) return 2;
  if (count <= 6) return 3;
  return 4;
}

const INTENSITY_CLASSES = [
  'bg-on-surface/5 border border-on-surface/10',           // 0 - empty
  'bg-primary/20 border border-primary/20',                // 1 - low
  'bg-primary/40 border border-primary/30',                // 2 - medium-low
  'bg-primary/65 border border-primary/50',                // 3 - medium-high
  'bg-primary border border-primary/80',                   // 4 - high
];

function buildWeeks(activityMap) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Start from 52 weeks ago, aligned to Sunday
  const start = new Date(today);
  start.setDate(start.getDate() - 364);
  start.setDate(start.getDate() - start.getDay());

  const weeks = [];
  let current = new Date(start);

  while (current <= today) {
    const week = [];
    for (let d = 0; d < 7; d++) {
      // Format as YYYY-MM-DD using local time to match what the user sees
      const yyyy = current.getFullYear();
      const mm = String(current.getMonth() + 1).padStart(2, '0');
      const dd = String(current.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;
      
      const count = (activityMap[dateStr] || 0);

      week.push({
        date: new Date(current),
        dateStr,
        count: count,
        isFuture: current > today,
      });
      current.setDate(current.getDate() + 1);
    }
    weeks.push(week);
  }
  return weeks;
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function formatDay(dateStr) {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function ActivityHeatmap({ activityMap, streak }) {
  const rootRef = useRef(null);
  const [tooltip, setTooltip] = useState(null);
  const weeks = buildWeeks(activityMap || {});

  // Find month label positions
  const monthLabels = [];
  weeks.forEach((week, wi) => {
    const firstNonFuture = week.find(d => !d.isFuture);
    if (!firstNonFuture) return;
    const day = firstNonFuture.date;
    if (day.getDate() <= 7) {
      monthLabels.push({ wi, label: MONTHS[day.getMonth()] });
    }
  });

  const totalActivity = Object.values(activityMap || {}).reduce((a, b) => a + b, 0);

  // Squares pop in column by column, like a wave across the year
  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.from('.heat-col', { opacity: 0, scale: 0.4, y: 6, duration: 0.4, stagger: 0.012, ease: 'back.out(2)', delay: 0.3 });
    });
  }, { scope: rootRef });

  return (
    <section ref={rootRef} className="rounded-3xl p-5 border border-outline-variant/60 bg-surface-container-low">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-[20px]">local_fire_department</span>
          <h2 className="font-headline-md text-lg font-bold text-on-surface">Activity</h2>
        </div>
        <div className="flex items-center gap-4 text-sm text-on-surface-variant">
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-orange-500 text-[16px]">local_fire_department</span>
            <span className="font-bold text-on-surface">{streak}</span> day streak
          </span>
          <span className="hidden sm:inline">{totalActivity} activities the last year</span>
        </div>
      </div>

      <div className="overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <div className="min-w-max">
          {/* Month labels */}
          <div className="flex gap-[3px] mb-1 ml-6">
            {weeks.map((_, wi) => {
              const label = monthLabels.find(m => m.wi === wi);
              return (
                <div key={wi} className="w-[11px] text-[9px] text-on-surface-variant font-medium">
                  {label ? label.label : ''}
                </div>
              );
            })}
          </div>

          {/* Day rows */}
          <div className="flex gap-[3px]">
            {/* Day labels */}
            <div className="flex flex-col gap-[3px] mr-1">
              {['S','M','T','W','T','F','S'].map((d, i) => (
                <div key={i} className="h-[11px] w-4 text-[9px] text-on-surface-variant flex items-center justify-end pr-0.5">
                  {i % 2 === 1 ? d : ''}
                </div>
              ))}
            </div>

            {/* Weeks */}
            {weeks.map((week, wi) => (
              <div key={wi} className="heat-col flex flex-col gap-[3px]">
                {week.map((day) => (
                  <div
                    key={day.dateStr}
                    className={`w-[11px] h-[11px] rounded-[2px] cursor-default transition-transform hover:scale-125 ${
                      day.isFuture ? 'opacity-0 pointer-events-none' : INTENSITY_CLASSES[getIntensity(day.count)]
                    }`}
                    onMouseEnter={(e) => {
                      if (!day.isFuture) {
                        setTooltip({
                          dateStr: day.dateStr,
                          count: day.count,
                          x: e.clientX,
                          y: e.clientY,
                        });
                      }
                    }}
                    onMouseLeave={() => setTooltip(null)}
                  />
                ))}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-1.5 mt-2 justify-end">
            <span className="text-[9px] text-on-surface-variant">Less</span>
            {INTENSITY_CLASSES.map((cls, i) => (
              <div key={i} className={`w-[11px] h-[11px] rounded-[2px] ${cls}`} />
            ))}
            <span className="text-[9px] text-on-surface-variant">More</span>
          </div>
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-[200] pointer-events-none bg-surface-container-highest text-on-surface text-[11px] font-medium px-2.5 py-1.5 rounded-lg shadow-lg border border-on-surface/10"
          style={{ left: tooltip.x + 12, top: tooltip.y - 36 }}
        >
          {tooltip.count > 0
            ? `${tooltip.count} ${tooltip.count === 1 ? 'activity' : 'activities'} · ${formatDay(tooltip.dateStr)}`
            : `No activity · ${formatDay(tooltip.dateStr)}`}
        </div>
      )}
    </section>
  );
}
