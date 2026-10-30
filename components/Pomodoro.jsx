'use client';
import { useState, useEffect } from 'react';

export default function Pomodoro() {
  const [timerSeconds, setTimerSeconds] = useState(25 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerMode, setTimerMode] = useState(25); // 25 or 5

  useEffect(() => {
    let interval;
    if (isTimerRunning && timerSeconds > 0) {
      interval = setInterval(() => setTimerSeconds(s => s - 1), 1000);
    } else if (timerSeconds <= 0 && isTimerRunning) {
      setIsTimerRunning(false);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerSeconds]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const resetTimer = () => {
    setIsTimerRunning(false);
    setTimerSeconds(timerMode * 60);
  };

  const toggleMode = () => {
    const newMode = timerMode === 25 ? 5 : 25;
    setTimerMode(newMode);
    setTimerSeconds(newMode * 60);
    setIsTimerRunning(false);
  };

  return (
    <div className="glass-panel rounded-xl p-6 flex flex-col items-center justify-center">
      
      <div className="z-10 flex w-full justify-between items-center mb-2">
        <h4 className="font-title-sm text-[15px] font-semibold text-on-surface">
          {timerMode === 25 ? 'Deep Focus' : 'Short Break'}
        </h4>
        <button onClick={toggleMode} className="text-xs text-primary hover:underline">
          Switch to {timerMode === 25 ? 'Break' : 'Focus'}
        </button>
      </div>

      <div 
        className="font-display-lg text-[56px] font-semibold text-on-surface z-10 my-2 tracking-tight" 
        style={{ fontVariantNumeric: 'tabular-nums' }}
      >
        {formatTime(timerSeconds)}
      </div>

      <div className="flex gap-4 z-10 mt-4">
        <button 
          onClick={resetTimer}
          className="w-12 h-12 rounded-full border border-outline-variant flex items-center justify-center hover:bg-on-surface/5 transition-colors"
        >
          <span className="material-symbols-outlined text-on-surface">replay</span>
        </button>
        <button 
          onClick={() => setIsTimerRunning(!isTimerRunning)}
          className="w-14 h-14 rounded-full bg-primary flex items-center justify-center hover:bg-primary/90 transition-colors"
        >
          <span className="material-symbols-outlined text-on-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
            {isTimerRunning ? 'pause' : 'play_arrow'}
          </span>
        </button>
        <button 
          className="w-12 h-12 rounded-full border border-outline-variant flex items-center justify-center opacity-40 cursor-not-allowed"
        >
          <span className="material-symbols-outlined text-on-surface">skip_next</span>
        </button>
      </div>
    </div>
  );
}
