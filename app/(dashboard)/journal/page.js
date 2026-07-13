'use client';
import { useState, useEffect } from 'react';
import Header from '@/components/Header';

export default function JournalPage() {
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [content, setContent] = useState('');
  const [status, setStatus] = useState('');


  async function fetchJournalEntry() {
    try {
      const res = await fetch('/api/journal');
      if (res.ok) {
        const data = await res.json();
        setContent(data[date] || '');
      }
    } catch(e) {
      console.error(e);
    }
  }

  const saveJournal = async () => {
    try {
      setStatus('Saving...');
      const payload = { [date]: content };
      const res = await fetch('/api/journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setStatus('Saved');
        setTimeout(() => setStatus(''), 3000);
      }
    } catch (e) {
      setStatus('Error saving');
    }
  };

  useEffect(() => {
    fetchJournalEntry();
  }, [date]);

  return (
    <>
      <Header title="Orbit" subtitle="Journal & Plan" showDate={false} />
      
      <main className="px-4 py-6 flex flex-col gap-6 max-w-2xl mx-auto w-full flex-1">
        <section className="glass-panel p-6 rounded-xl flex flex-col gap-4 shadow-md">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex flex-col gap-1">
              <h3 className="font-title-sm text-[18px] font-semibold flex items-center gap-2 text-primary-fixed-dim">
                <span className="material-symbols-outlined">edit_note</span> Select Date
              </h3>
              <input 
                type="date" 
                value={date} 
                onChange={e => setDate(e.target.value)} 
                className="bg-surface-container-high/50 border border-white/10 rounded-lg px-3 py-2 text-on-surface text-sm focus:outline-none focus:border-primary"
              />
            </div>
            
            <div className="text-right">
              <h3 className="font-headline-md text-[20px] font-bold">
                {date === new Date().toISOString().split('T')[0] ? 'Today' : new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </h3>
              {status && <span className="text-sm text-primary-fixed-dim animate-pulse">{status}</span>}
            </div>
          </div>
          
          <textarea 
            className="w-full min-h-[300px] bg-surface-container-high/30 border border-white/10 rounded-xl p-4 text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-body-lg resize-y"
            value={content} 
            onChange={e => { setContent(e.target.value); setStatus('Unsaved changes...'); }} 
            placeholder="Write your daily plan or thoughts here..."
          ></textarea>
          
          <div className="flex justify-end mt-2">
            <button 
              onClick={saveJournal} 
              className="bg-primary text-on-primary px-8 py-3 rounded-xl font-title-sm text-[16px] font-semibold hover:scale-105 transition-transform shadow-[0_0_15px_rgba(192,193,255,0.3)]"
            >
              Save Journal
            </button>
          </div>
        </section>
      </main>
    </>
  );
}
