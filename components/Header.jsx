'use client';
import { useState, useEffect } from 'react';

import { useTheme } from '@/components/ThemeProvider';
import { useAuth } from '@/hooks/useAuth';
import NotificationsModal from './NotificationsModal';

export default function Header({ title, subtitle, showDate = true, tasksCompleted = 0, currentScheduleBlock = null, actionButton = null }) {
  const [dateStr, setDateStr] = useState('');
  const [greeting, setGreeting] = useState('Morning');
  const [hasUnread, setHasUnread] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();

  useEffect(() => {
    const d = new Date();
    setDateStr(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }));
    
    const hour = d.getHours();
    if (hour < 12) setGreeting('Morning');
    else if (hour < 17) setGreeting('Afternoon');
    else setGreeting('Evening');

    // Listen for SSE notifications
    const eventSource = new EventSource('/api/notifications/stream');
    eventSource.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        const alertTypes = ['friend_request', 'friend_accepted', 'challenge_received', 'challenge_accepted', 'task_completed'];
        if (alertTypes.includes(data.type)) {
          setHasUnread(true);
        }
      } catch (err) {}
    };
    return () => {
      eventSource.close();
    };
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
    <header className="relative z-40 glass-panel px-4 py-2 md:px-6 md:py-3 flex flex-col gap-1 rounded-b-xl shadow-lg border-b border-on-surface/10">
      <div className="flex justify-between items-center w-full">
        <div>
          <h1 className="font-headline-md text-[18px] md:text-[20px] font-bold tracking-tight text-primary">{title}</h1>
        </div>
        <div className="flex items-center gap-3">
          {actionButton}
          <button 
            onClick={() => {
              setIsModalOpen(true);
              setHasUnread(false);
            }}
            className="relative w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center bg-on-surface/5 hover:bg-on-surface/10 transition-colors border border-on-surface/10"
          >
            <span className="material-symbols-outlined text-[20px] md:text-[24px] text-primary-fixed-dim">notifications</span>
            {hasUnread && (
              <span className="absolute top-1.5 right-1.5 md:top-2 md:right-2 w-2 h-2 md:w-2.5 md:h-2.5 bg-error rounded-full border-2 border-surface"></span>
            )}
          </button>
          <button 
            onClick={toggleTheme}
            className="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center bg-on-surface/5 hover:bg-on-surface/10 transition-colors border border-on-surface/10"
          >
            <span className="material-symbols-outlined text-[20px] md:text-[24px] text-primary-fixed-dim">{theme === 'dark' ? 'light_mode' : 'dark_mode'}</span>
          </button>
        </div>
      </div>

      {(subtitle || showDate) && (
        <div className="flex justify-between items-end flex-wrap gap-2 md:gap-4">
          <div>
            {showDate && <p className="font-body-sm text-[12px] md:text-[14px] text-on-surface-variant">{dateStr}</p>}
            {subtitle ? (
              typeof subtitle === 'string' && subtitle.includes('Greeting') ? (
                <h2 className="font-display-lg-mobile text-[20px] md:text-[24px] font-bold leading-tight mt-0">
                  Good <span className="gradient-text">{greeting}</span>{user ? `, ${user.name.split(' ')[0]}` : ''}
                </h2>
              ) : (
                <h2 className="font-display-lg-mobile text-[20px] md:text-[24px] font-bold leading-tight mt-0">{subtitle}</h2>
              )
            ) : null}
            {tasksCompleted > 0 && (
              <div className="flex gap-2 mt-2">
                <span className="inline-flex items-center px-2 py-0.5 md:px-3 md:py-1 rounded-full text-[10px] md:text-xs font-semibold bg-secondary/10 text-secondary border border-secondary/20">
                  <span className="material-symbols-outlined text-[12px] md:text-[14px] mr-1">check_circle</span>
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
      <NotificationsModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </header>
  );
}
