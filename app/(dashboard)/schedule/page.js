'use client';
import { useState, useEffect } from 'react';
import Header from '@/components/Header';

export default function SchedulePage() {
  const [schedule, setSchedule] = useState([]);
  const [title, setTitle] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');


  async function fetchSchedule() {
    try {
      const res = await fetch('/api/schedule');
      if (res.ok) {
        const data = await res.json();
        setSchedule(data);
      }
    } catch (e) {
      console.error(e);
    }
  }

  const addBlock = async (e) => {
    e.preventDefault();
    if (!title || !startTime || !endTime) return;
    
    try {
      const res = await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, startTime, endTime })
      });
      if (res.ok) {
        const newBlock = await res.json();
        // Insert and sort
        const newSchedule = [...schedule, newBlock].sort((a, b) => a.startTime.localeCompare(b.startTime));
        setSchedule(newSchedule);
        setTitle('');
        setStartTime('');
        setEndTime('');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const deleteBlock = async (id) => {
    try {
      await fetch(`/api/schedule?id=${id}`, { method: 'DELETE' });
      setSchedule(schedule.filter(b => b._id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  // Utility to format 24h time to 12h time
  const formatTime = (time24) => {
    const [h, m] = time24.split(':');
    let hours = parseInt(h);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${hours}:${m} ${ampm}`;
  };

  useEffect(() => {
    fetchSchedule();
  }, []);

  return (
    <>
      <Header title="Orbit" subtitle="Schedule" showDate={false} />
      
      <main className="px-4 py-6 flex flex-col gap-6 max-w-2xl mx-auto w-full flex-1">
        <section className="glass-panel p-6 rounded-xl flex flex-col gap-4 shadow-md">
          <h2 className="font-headline-md text-[24px] font-bold mb-2 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">calendar_month</span>
            Schedule Builder
          </h2>
          
          <form onSubmit={addBlock} className="flex flex-col gap-3">
            <div className="flex gap-2 items-center">
              <span className="material-symbols-outlined text-primary">title</span>
              <input 
                type="text" 
                value={title} 
                onChange={e => setTitle(e.target.value)} 
                placeholder="Block Title (e.g. Deep Work)" 
                required 
                className="flex-1 bg-surface-container-high/50 border border-white/10 rounded-lg px-4 py-3 text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-body-sm"
              />
            </div>
            <div className="flex flex-col md:flex-row gap-3 md:gap-2 md:items-center mt-1">
              <div className="flex-1 flex gap-2 items-center w-full">
                <span className="material-symbols-outlined text-primary">schedule</span>
                <input 
                  type="time" 
                  value={startTime} 
                  onChange={e => setStartTime(e.target.value)} 
                  required 
                  className="flex-1 w-full bg-surface-container-high/50 border border-white/10 rounded-lg px-4 py-3 text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-body-sm"
                />
              </div>
              <span className="text-on-surface-variant px-2 hidden md:block">to</span>
              <div className="flex-1 flex gap-2 items-center w-full">
                <span className="material-symbols-outlined text-transparent md:hidden select-none">schedule</span>
                <input 
                  type="time" 
                  value={endTime} 
                  onChange={e => setEndTime(e.target.value)} 
                  required 
                  className="flex-1 w-full bg-surface-container-high/50 border border-white/10 rounded-lg px-4 py-3 text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-body-sm"
                />
              </div>
            </div>
            <button 
              type="submit" 
              className="mt-2 w-full bg-primary text-on-primary px-6 py-3 rounded-lg font-title-sm text-[16px] font-semibold hover:scale-105 transition-transform shadow-[0_0_15px_rgba(192,193,255,0.3)]"
            >
              Add Schedule Block
            </button>
          </form>

          <div className="space-y-4 mt-6">
            {schedule.map((block, index) => {
              const borderColors = ['border-primary', 'border-secondary', 'border-tertiary'];
              const bgColors = ['bg-primary', 'bg-secondary', 'bg-tertiary'];
              const colorIdx = index % 3;

              return (
                <div key={block._id} className={`pl-4 border-l-2 ${borderColors[colorIdx]} relative flex justify-between items-start group`}>
                  <div className={`absolute w-2 h-2 rounded-full ${bgColors[colorIdx]} -left-[5px] top-1.5`}></div>
                  <div>
                    <p className="font-body-sm text-[14px] text-on-surface font-medium">{block.title}</p>
                    <p className="font-label-caps text-[11px] text-outline mt-1 tracking-widest">
                      {formatTime(block.startTime)} - {formatTime(block.endTime)}
                    </p>
                  </div>
                  <button 
                    onClick={() => deleteBlock(block._id)} 
                    className="text-outline-variant hover:text-error transition-colors p-1 opacity-0 group-hover:opacity-100"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </div>
              );
            })}
            
            {schedule.length === 0 && (
              <p className="text-on-surface-variant text-sm italic opacity-70 text-center mt-4">Your schedule is empty. Add a block to plan your day!</p>
            )}
          </div>
        </section>
      </main>
    </>
  );
}
