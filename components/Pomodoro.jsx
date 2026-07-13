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
    <div className="glass-panel rounded-2xl p-6 flex flex-col items-center justify-center relative overflow-hidden border-t-2 border-primary/30">
      <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-full"></div>
      
      <div className="z-10 flex w-full justify-between items-center mb-2">
        <h4 className="font-label-caps text-[12px] text-on-surface-variant tracking-widest uppercase">
          {timerMode === 25 ? 'Deep Focus' : 'Short Break'}
        </h4>
        <button onClick={toggleMode} className="text-xs text-primary hover:underline">
          Switch to {timerMode === 25 ? 'Break' : 'Focus'}
        </button>
      </div>

      <div 
        className="font-display-lg text-[48px] font-bold text-primary z-10 my-2 tracking-tighter" 
        style={{ fontVariantNumeric: 'tabular-nums' }}
      >
        {formatTime(timerSeconds)}
      </div>

      <div className="flex gap-4 z-10 mt-4">
        <button 
          onClick={resetTimer}
          className="w-12 h-12 rounded-full glass-panel flex items-center justify-center hover:bg-white/10 transition-colors border-white/20 hover:scale-105 active:scale-95"
        >
          <span className="material-symbols-outlined text-on-surface">replay</span>
        </button>
        <button 
          onClick={() => setIsTimerRunning(!isTimerRunning)}
          className="w-14 h-14 rounded-full bg-primary flex items-center justify-center shadow-[0_0_20px_rgba(192,193,255,0.4)] hover:scale-105 active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined text-on-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
            {isTimerRunning ? 'pause' : 'play_arrow'}
          </span>
        </button>
        <button 
          className="w-12 h-12 rounded-full glass-panel flex items-center justify-center hover:bg-white/10 transition-colors border-white/20 hover:scale-105 active:scale-95 opacity-50 cursor-not-allowed"
        >
          <span className="material-symbols-outlined text-on-surface">skip_next</span>
        </button>
      </div>
    </div>
  );
}
