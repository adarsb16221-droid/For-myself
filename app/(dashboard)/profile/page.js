'use client';

import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/Header';
import Spinner from '@/components/Spinner';
import Link from 'next/link';

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
      
      // We also check the UTC date string in case the server saved it that way
      const utcDateStr = current.toISOString().split('T')[0];
      const count = (activityMap[dateStr] || 0) + (activityMap[utcDateStr] || 0);

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

function ActivityHeatmap({ activityMap, streak }) {
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

  return (
    <div className="bg-surface-container rounded-2xl p-5 border border-outline-variant/30 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-[20px]">local_fire_department</span>
          <h2 className="font-title-md font-bold text-on-surface">Activity</h2>
        </div>
        <div className="flex items-center gap-4 text-sm text-on-surface-variant">
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-orange-500 text-[16px]">local_fire_department</span>
            <span className="font-bold text-on-surface">{streak}</span> day streak
          </span>
          <span className="hidden sm:inline">{totalActivity} activities this year</span>
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
              <div key={wi} className="flex flex-col gap-[3px]">
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
            ? `${tooltip.count} ${tooltip.count === 1 ? 'activity' : 'activities'} on ${tooltip.dateStr}`
            : `No activity on ${tooltip.dateStr}`}
        </div>
      )}
    </div>
  );
}

// ── Profile Page ────────────────────────────────────────────────
export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch('/api/users/profile', { cache: 'no-store' });
        if (res.ok) setProfile(await res.json());
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  return (
    <div className="flex flex-col h-full bg-surface">
      <div className="sticky top-0 z-40 bg-surface/80 backdrop-blur-md">
        <Header title="Profile" />
      </div>

      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="max-w-4xl mx-auto space-y-5">

          {loading ? (
            <div className="flex justify-center py-16"><Spinner /></div>
          ) : !profile ? (
            <div className="text-center py-16 text-on-surface-variant">Failed to load profile.</div>
          ) : (
            <>
              {/* ── Compact Profile Header ── */}
              <div className="bg-surface-container rounded-2xl p-5 border border-outline-variant/30 shadow-sm relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 pointer-events-none" />

                <div className="relative flex items-center gap-4">
                  {/* Avatar */}
                  <div className="w-16 h-16 rounded-2xl bg-primary/15 flex items-center justify-center text-primary font-bold text-2xl uppercase border border-primary/20 shrink-0 shadow-inner">
                    {profile.user.name.charAt(0)}
                  </div>

                  {/* Name / Email */}
                  <div className="flex-1 min-w-0">
                    <h1 className="text-xl font-bold text-on-surface truncate">{profile.user.name}</h1>
                    <p className="text-sm text-on-surface-variant truncate">{profile.user.email}</p>
                  </div>
                </div>

                {/* Stats pills — compact row */}
                <div className="relative mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {/* Orbit Points */}
                  <div className="flex items-center gap-2 bg-surface/70 rounded-xl px-3 py-2 border border-outline-variant/30">
                    <span className="material-symbols-outlined text-tertiary text-[18px]">stars</span>
                    <div>
                      <p className="text-[9px] uppercase tracking-wider text-on-surface-variant font-bold leading-none">Points</p>
                      <p className="text-base font-bold text-on-surface leading-tight">{Math.max(0, profile.user.orbitPoints || 0)}</p>
                    </div>
                  </div>

                  {/* Streak */}
                  <div className="flex items-center gap-2 bg-surface/70 rounded-xl px-3 py-2 border border-outline-variant/30">
                    <span className="material-symbols-outlined text-orange-500 text-[18px]">local_fire_department</span>
                    <div>
                      <p className="text-[9px] uppercase tracking-wider text-on-surface-variant font-bold leading-none">Streak</p>
                      <p className="text-base font-bold text-on-surface leading-tight">{profile.streak ?? 0} <span className="text-xs font-normal text-on-surface-variant">days</span></p>
                    </div>
                  </div>

                  {/* Friends */}
                  <Link href="/community" className="flex items-center gap-2 bg-surface/70 rounded-xl px-3 py-2 border border-outline-variant/30 hover:border-primary/40 transition-colors group">
                    <span className="material-symbols-outlined text-secondary text-[18px] group-hover:scale-110 transition-transform">group</span>
                    <div>
                      <p className="text-[9px] uppercase tracking-wider text-on-surface-variant font-bold leading-none">Friends</p>
                      <p className="text-base font-bold text-on-surface leading-tight">{profile.friendCount ?? 0}</p>
                    </div>
                  </Link>

                  {/* Challenges Won */}
                  <Link href="/challenges" className="flex items-center gap-2 bg-surface/70 rounded-xl px-3 py-2 border border-outline-variant/30 hover:border-primary/40 transition-colors group">
                    <span className="material-symbols-outlined text-primary text-[18px] group-hover:scale-110 transition-transform">emoji_events</span>
                    <div>
                      <p className="text-[9px] uppercase tracking-wider text-on-surface-variant font-bold leading-none">Won</p>
                      <p className="text-base font-bold text-on-surface leading-tight">{profile.completedChallengesCount ?? 0}</p>
                    </div>
                  </Link>
                </div>
              </div>

              {/* ── Activity Heatmap ── */}
              <ActivityHeatmap activityMap={profile.activityMap} streak={profile.streak ?? 0} />

              {/* ── History Timeline ── */}
              <div>
                <h2 className="text-lg font-bold text-on-surface mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[20px]">history</span>
                  Completed History
                </h2>

                {profile.timeline.length === 0 ? (
                  <div className="bg-surface-container rounded-2xl p-8 text-center border border-outline-variant/30">
                    <span className="material-symbols-outlined text-[44px] text-on-surface-variant mb-3 block">hourglass_empty</span>
                    <h3 className="font-bold text-on-surface mb-1">No history yet</h3>
                    <p className="text-sm text-on-surface-variant">Complete tasks, habits, and challenges to earn points!</p>
                  </div>
                ) : (
                  <div className="space-y-3 relative before:absolute before:inset-0 before:ml-5 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-outline-variant/50 before:to-transparent">
                    {profile.timeline.map((item, index) => (
                      <div key={item.id + index} className="relative flex items-start gap-3 group">
                        {/* Dot */}
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-surface-container border-2 border-surface shadow-sm shrink-0 relative z-10 transition-transform group-hover:scale-110 mt-0.5">
                          {item.type === 'challenge' ? (
                            <span className="material-symbols-outlined text-tertiary text-[16px]">emoji_events</span>
                          ) : item.type === 'habit' ? (
                            <span className="material-symbols-outlined text-secondary text-[16px]">cycle</span>
                          ) : (
                            <span className="material-symbols-outlined text-primary text-[16px]">task_alt</span>
                          )}
                        </div>

                        {/* Card */}
                        <div className="flex-1 bg-surface-container rounded-xl px-4 py-3 border border-outline-variant/30 shadow-sm transition-shadow group-hover:shadow-md flex items-center justify-between gap-3">
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant leading-none mb-1">
                              {new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                            </p>
                            <p className="font-semibold text-sm text-on-surface">{item.title}</p>
                            {item.type === 'challenge' && item.with && (
                              <p className="text-xs text-on-surface-variant mt-0.5 flex items-center gap-1">
                                <span className="material-symbols-outlined text-[12px]">group</span>
                                With {item.with}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-primary font-bold text-sm bg-primary/10 px-2 py-1 rounded-lg shrink-0">
                            +{item.points}
                            <span className="material-symbols-outlined text-[13px]">stars</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
