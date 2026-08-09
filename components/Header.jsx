'use client';
import { useState, useEffect } from 'react';

import { useTheme } from '@/components/ThemeProvider';
import { useAuth } from '@/hooks/useAuth';

export default function Header({ title, subtitle, showDate = true, tasksCompleted = 0, currentScheduleBlock = null }) {
  const [dateStr, setDateStr] = useState('');
  const [greeting, setGreeting] = useState('Morning');
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();

  useEffect(() => {
    const d = new Date();
    setDateStr(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }));
    
    const hour = d.getHours();
    if (hour < 12) setGreeting('Morning');
    else if (hour < 17) setGreeting('Afternoon');
    else setGreeting('Evening');
  }, []);

  const formatTime = (time24) => {
    if (!time24) return '';
    const [h, m] = time24.split(':');
    let hours = parseInt(h, 10);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${hours}:${m} ${ampm}`;
  };

  return (
    <header className="relative z-40 glass-panel px-6 py-4 flex flex-col gap-2 rounded-b-xl shadow-lg border-b border-on-surface/10">
      <div className="flex justify-between items-center w-full">
        <div>
          <h1 className="font-headline-md text-[24px] font-bold tracking-tight text-primary">{title}</h1>
        </div>
        <button 
          onClick={toggleTheme}
          className="w-10 h-10 rounded-full flex items-center justify-center bg-on-surface/5 hover:bg-on-surface/5 transition-colors border border-on-surface/10"
        >
          <span className="material-symbols-outlined text-primary-fixed-dim">{theme === 'dark' ? 'light_mode' : 'dark_mode'}</span>
        </button>
      </div>

      {(subtitle || showDate) && (
        <div className="mt-2 flex justify-between items-end flex-wrap gap-4">
          <div>
            {showDate && <p className="font-body-sm text-[14px] text-on-surface-variant">{dateStr}</p>}
            {subtitle ? (
              typeof subtitle === 'string' && subtitle.includes('Greeting') ? (
                <h2 className="font-display-lg-mobile text-[32px] font-bold leading-tight mt-1">
                  Good <span className="gradient-text">{greeting}</span>{user ? `, ${user.name.split(' ')[0]}` : ''}
                </h2>
              ) : (
                <h2 className="font-display-lg-mobile text-[32px] font-bold leading-tight mt-1">{subtitle}</h2>
              )
            ) : null}
            {tasksCompleted > 0 && (
              <div className="flex gap-2 mt-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-secondary/10 text-secondary border border-secondary/20">
                  <span className="material-symbols-outlined text-[14px] mr-1">check_circle</span>
                  {tasksCompleted} Tasks Completed
                </span>
              </div>
            )}
          </div>

          {currentScheduleBlock && (
            <div className="bg-primary/10 border border-primary/20 rounded-xl p-3 flex flex-col min-w-[200px] shadow-sm ml-auto">
              <div className="flex items-center gap-2 mb-1">
                <span className="material-symbols-outlined text-primary text-[16px]">schedule</span>
                <p className="text-[10px] font-bold uppercase tracking-wider text-primary">Current Schedule</p>
              </div>
              <p className="font-body-lg text-on-surface font-medium leading-tight">{currentScheduleBlock.title}</p>
              <p className="font-label-caps text-[11px] text-outline tracking-widest mt-1">
                {formatTime(currentScheduleBlock.startTime)} - {formatTime(currentScheduleBlock.endTime)}
              </p>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
