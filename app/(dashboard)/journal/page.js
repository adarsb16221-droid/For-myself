'use client';
import { useState, useEffect, useRef } from 'react';
import Header from '@/components/Header';

export default function JournalPage() {
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [content, setContent] = useState('');
  const [status, setStatus] = useState('');
  const [isFlipping, setIsFlipping] = useState(false);
  const timeoutRef = useRef(null);


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

  const saveJournal = async (saveDate = date, saveContent = content) => {
    try {
      setStatus('Saving...');
      const payload = { [saveDate]: saveContent };
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

  const handleContentChange = (e) => {
    const newContent = e.target.value;
    setContent(newContent);
    setStatus('Saving soon...');
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      saveJournal(date, newContent);
    }, 1000);
  };

  const changeDate = (days) => {
    if (isFlipping) return;
    
    const direction = days > 0 ? 'next' : 'prev';
    setIsFlipping(`${direction}-out`);
    
    setTimeout(() => {
      const currDate = new Date(date);
      currDate.setDate(currDate.getDate() + days);
      setDate(currDate.toISOString().split('T')[0]);
      
      setIsFlipping(`${direction}-in`);
      
      setTimeout(() => {
        setIsFlipping(false);
      }, 600);
    }, 600);
  };

  const jumpToDate = (newDateStr) => {
    if (isFlipping || newDateStr === date) return;
    
    const diff = new Date(newDateStr) - new Date(date);
    const direction = diff > 0 ? 'next' : 'prev';
    
    setIsFlipping(`${direction}-out`);
    
    setTimeout(() => {
      setDate(newDateStr);
      setIsFlipping(`${direction}-in`);
      setTimeout(() => setIsFlipping(false), 600);
    }, 600);
  };

  return (
    <>
      <Header title="Orbit" subtitle="Journal & Plan" showDate={false} />
      
      <main className="px-2 py-4 sm:py-6 flex flex-col gap-4 sm:gap-6 max-w-4xl mx-auto w-full flex-1 overflow-x-hidden sm:overflow-visible">
        
        <div className="flex items-center justify-between sm:justify-center w-full gap-1 sm:gap-4" style={{ perspective: '2000px' }}>
          
          <button 
            onClick={() => changeDate(-1)}
            disabled={isFlipping}
            className="p-1 sm:p-3 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-on-surface-variant hover:text-on-surface transition-colors disabled:opacity-50 shrink-0"
          >
            <span className="material-symbols-outlined text-3xl sm:text-5xl">chevron_left</span>
          </button>

          <section 
            className="glass-panel p-4 sm:p-8 rounded-r-2xl sm:rounded-r-3xl rounded-l-sm flex flex-col gap-4 sm:gap-6 shadow-[-5px_10px_20px_rgba(0,0,0,0.15)] sm:shadow-[-10px_10px_30px_rgba(0,0,0,0.2)] flex-1 w-full max-w-full sm:max-w-2xl relative bg-[#f9f7f1] dark:bg-[#202020] border-l-[8px] sm:border-l-[16px] border-l-black/30 dark:border-l-black/50"
            style={{
              transition: 'transform 600ms ease-in-out, opacity 600ms ease-in-out',
              transform: isFlipping === 'next-out' ? 'rotateY(-90deg)' :
                         isFlipping === 'next-in' ? 'rotateY(90deg)' :
                         isFlipping === 'prev-out' ? 'rotateY(90deg)' :
                         isFlipping === 'prev-in' ? 'rotateY(-90deg)' : 'rotateY(0deg)',
              opacity: isFlipping && isFlipping.includes('-out') ? 0 : 1,
              transformStyle: 'preserve-3d',
              transformOrigin: 'left center'
            }}
          >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4 border-b border-black/10 dark:border-white/10 pb-3 sm:pb-4">
              <div className="flex flex-col gap-1 w-full sm:w-auto">
                <h3 className="font-title-sm text-[16px] sm:text-[18px] font-semibold flex items-center gap-2 text-primary-fixed-dim">
                  <span className="material-symbols-outlined">menu_book</span> Date
                </h3>
                <input 
                  type="date" 
                  value={date} 
                  onChange={e => jumpToDate(e.target.value)} 
                  className="bg-transparent border border-black/20 dark:border-white/20 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-on-surface text-sm focus:outline-none focus:border-primary font-bold cursor-pointer w-full sm:w-auto"
                />
              </div>
              
              <div className="text-left sm:text-right mt-2 sm:mt-0">
                <h3 className="font-headline-md text-[20px] sm:text-[24px] font-bold text-gray-800 dark:text-gray-100">
                  {date === new Date().toISOString().split('T')[0] ? 'Today' : new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </h3>
                <div className="h-4 sm:h-5">
                  {status && <span className="text-xs sm:text-sm text-primary animate-pulse font-medium">{status}</span>}
                </div>
              </div>
            </div>
            
            <textarea 
              className="w-full min-h-[400px] sm:min-h-[500px] bg-transparent border-none p-1 text-gray-800 dark:text-gray-200 placeholder:text-gray-400 focus:outline-none focus:ring-0 transition-all font-body-lg resize-y leading-relaxed"
              style={{
                backgroundImage: 'repeating-linear-gradient(transparent, transparent 31px, rgba(0,0,0,0.1) 31px, rgba(0,0,0,0.1) 32px)',
                lineHeight: '32px',
                backgroundAttachment: 'local'
              }}
              value={content} 
              onChange={handleContentChange} 
              placeholder="Write your thoughts here..."
            ></textarea>
          </section>

          <button 
            onClick={() => changeDate(1)}
            disabled={isFlipping}
            className="p-1 sm:p-3 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-on-surface-variant hover:text-on-surface transition-colors disabled:opacity-50 shrink-0"
          >
            <span className="material-symbols-outlined text-3xl sm:text-5xl">chevron_right</span>
          </button>
        </div>

      </main>
    </>
  );
}
