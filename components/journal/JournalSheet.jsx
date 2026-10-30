'use client';

import MoodStamp from './MoodStamp';
import { parseDate } from '@/lib/journalDates';

const ROUNDING = {
  left: 'rounded-l-xl',
  right: 'rounded-r-xl',
  single: 'rounded-xl',
};

export default function JournalSheet({ dateStr, side, content, mood, isToday, readOnly, onChange, onMoodChange }) {
  const date = parseDate(dateStr);
  const weekday = date.toLocaleDateString(undefined, { weekday: 'long' });
  const monthDay = date.toLocaleDateString(undefined, { month: 'long', day: 'numeric' });

  return (
    <div className={`journal-paper journal-paper-${side} ${ROUNDING[side]} h-full w-full flex flex-col`}>
      <header className="journal-indent flex items-start justify-between gap-3 pt-5 pb-1">
        <div className="min-w-0">
          <p className="font-journal-serif text-[11px] uppercase tracking-[0.25em] journal-ink-soft flex items-center gap-2">
            {weekday}
            {isToday && <span className="font-hand normal-case tracking-normal text-[17px] text-primary">· today</span>}
          </p>
          <h3 className="font-journal-serif text-[26px] md:text-[30px] font-semibold leading-tight journal-ink truncate">{monthDay}</h3>
          <p className="font-journal-serif text-xs journal-ink-soft">{date.getFullYear()}</p>
        </div>
        <MoodStamp mood={mood} readOnly={readOnly} onChange={(value) => onMoodChange?.(dateStr, value)} />
      </header>

      <textarea
        className="journal-lines journal-indent flex-1 w-full pb-6 resize-none border-none bg-transparent focus:outline-none focus:ring-0"
        value={content || ''}
        onChange={(e) => onChange?.(dateStr, e.target.value)}
        placeholder={isToday ? 'Dear diary…' : 'Nothing written here yet…'}
        readOnly={readOnly}
        tabIndex={readOnly ? -1 : 0}
        aria-label={`Journal entry for ${weekday}, ${monthDay}`}
      />
    </div>
  );
}
