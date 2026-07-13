'use client';
import { useState, useEffect } from 'react';

import { useTheme } from '@/components/ThemeProvider';
import { useAuth } from '@/hooks/useAuth';

export default function Header({ title, subtitle, showDate = true, tasksCompleted = 0 }) {
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

  return (
    <header className="relative z-40 glass-panel px-6 py-4 flex flex-col gap-2 rounded-b-xl shadow-lg border-b border-white/10">
      <div className="flex justify-between items-center w-full">
        <div>
          <h1 className="font-headline-md text-[24px] font-bold tracking-tight text-primary">{title}</h1>
        </div>
        <button 
          onClick={toggleTheme}
          className="w-10 h-10 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 transition-colors border border-white/10"
        >
          <span className="material-symbols-outlined text-primary-fixed-dim">{theme === 'dark' ? 'light_mode' : 'dark_mode'}</span>
        </button>
      </div>

      {(subtitle || showDate) && (
        <div className="mt-2 flex justify-between items-end">
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
          </div>
        </div>
      )}

      {tasksCompleted > 0 && (
        <div className="flex gap-2 mt-2">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-secondary/10 text-secondary border border-secondary/20">
            <span className="material-symbols-outlined text-[14px] mr-1">check_circle</span>
            {tasksCompleted} Tasks Completed
          </span>
        </div>
      )}
    </header>
  );
}
