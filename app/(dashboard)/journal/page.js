'use client';
import { useState, useEffect, useRef } from 'react';
import Header from '@/components/Header';

function getOffsetDate(baseDateStr, offsetDays) {
  const d = new Date(baseDateStr);
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
}

function PageContent({ dateStr, content, onChange, readOnly }) {
  const isToday = dateStr === new Date().toISOString().split('T')[0];
  const displayDate = isToday ? 'Today' : new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex justify-between items-center gap-2 border-b border-on-surface/10 pb-3 mb-4">
        <h3 className="font-title-sm text-[16px] font-semibold flex items-center gap-2 text-primary">
          <span className="material-symbols-outlined text-[20px]">menu_book</span> 
          <span className="hidden sm:inline">{dateStr}</span>
        </h3>
        <h3 className="font-headline-md text-[18px] sm:text-[20px] font-bold text-on-surface">
          {displayDate}
        </h3>
      </div>
      
      <textarea 
        className="w-full flex-1 bg-transparent border-none p-1 text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-0 transition-all font-body-lg resize-none leading-relaxed"
        style={{
          backgroundImage: 'repeating-linear-gradient(transparent, transparent 31px, var(--color-on-surface-variant) 31px, var(--color-on-surface-variant) 32px)',
          lineHeight: '32px',
          backgroundAttachment: 'local'
        }}
        value={content || ''} 
        onChange={(e) => onChange && onChange(dateStr, e.target.value)} 
        placeholder="Write your thoughts here..."
        readOnly={readOnly}
      ></textarea>
    </div>
  );
}

export default function JournalPage() {
  // The right page date. Left page is always rightDate - 1.
  const [rightDate, setRightDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [entries, setEntries] = useState({});
  const [status, setStatus] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  
  const timeoutRef = useRef(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Flip Animation State
  const [flipState, setFlipState] = useState({
    isFlipping: false,
    direction: null, // 'next' or 'prev'
    progress: 'idle', // 'idle' | 'start' | 'animating'
    animatingToRightDate: null
  });

  async function fetchJournalEntry() {
    try {
      const res = await fetch('/api/journal');
      if (res.ok) {
        const data = await res.json();
        setEntries(data);
      }
    } catch(e) {
      console.error(e);
    }
  }

  useEffect(() => {
    fetchJournalEntry();
  }, []);

  const saveJournal = async (saveDate, saveContent) => {
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

  const handleContentChange = (dateStr, newContent) => {
    setEntries(prev => ({ ...prev, [dateStr]: newContent }));
    setStatus('Saving soon...');
    
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => saveJournal(dateStr, newContent), 1000);
  };

  const turnPage = (direction) => {
    if (flipState.isFlipping) return;
    
    const offset = direction === 'next' ? (isMobile ? 1 : 2) : (isMobile ? -1 : -2);
    const newRightDate = getOffsetDate(rightDate, offset);
    
    setFlipState({
      isFlipping: true,
      direction,
      progress: 'start',
      animatingToRightDate: newRightDate
    });

    // Trigger animation in next frame
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setFlipState(prev => ({ ...prev, progress: 'animating' }));
        
        // After animation completes
        setTimeout(() => {
          setRightDate(newRightDate);
          setFlipState({ isFlipping: false, direction: null, progress: 'idle', animatingToRightDate: null });
        }, 800); // match transition duration
      });
    });
  };

  const jumpToDate = (e) => {
    if (flipState.isFlipping) return;
    setRightDate(e.target.value);
  };

  // Calculate dates to render
  const currentRight = rightDate;
  const currentLeft = getOffsetDate(rightDate, -1);
  
  let baseLeft = currentLeft;
  let baseRight = currentRight;
  
  if (flipState.isFlipping) {
    baseLeft = getOffsetDate(flipState.animatingToRightDate, -1);
    baseRight = flipState.animatingToRightDate;
  }

  const getFadeStyle = (isTarget) => {
    if (!isTarget) return { opacity: 1 };
    if (flipState.progress === 'start') return { opacity: 0, transition: 'none' };
    if (flipState.progress === 'animating') return { opacity: 1, transition: 'opacity 500ms ease-out 300ms' };
    return { opacity: 1 };
  };

  return (
    <>
      <Header title="Orbit" subtitle="Journal & Plan" showDate={false} />
      
      <main className="px-2 py-4 sm:py-6 flex flex-col gap-4 sm:gap-6 max-w-6xl mx-auto w-full flex-1 overflow-x-hidden sm:overflow-visible">
        
        {/* Controls */}
        <div className="flex justify-between items-center w-full px-2 sm:px-12 z-10">
          <button 
            onClick={() => turnPage('prev')}
            disabled={flipState.isFlipping}
            className="p-2 sm:p-3 rounded-full hover:bg-on-surface/5 text-on-surface-variant hover:text-on-surface transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-3xl">chevron_left</span>
            <span className="hidden sm:inline font-medium">Previous Page</span>
          </button>

          <div className="flex flex-col items-center">
            <input 
              type="date" 
              value={rightDate} 
              onChange={jumpToDate} 
              className="bg-transparent border border-on-surface/20 rounded-lg px-3 py-1.5 text-on-surface text-sm focus:outline-none focus:border-primary font-bold cursor-pointer hover:bg-on-surface/5 transition-colors"
              title="Jump to date"
            />
            <div className="h-4 mt-1">
              {status && <span className="text-xs text-primary animate-pulse font-medium">{status}</span>}
            </div>
          </div>

          <button 
            onClick={() => turnPage('next')}
            disabled={flipState.isFlipping}
            className="p-2 sm:p-3 rounded-full hover:bg-on-surface/5 text-on-surface-variant hover:text-on-surface transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <span className="hidden sm:inline font-medium">Next Page</span>
            <span className="material-symbols-outlined text-3xl">chevron_right</span>
          </button>
        </div>

        {/* Book Container */}
        <div className="w-full flex-1 min-h-[500px] sm:min-h-[600px] relative" style={{ perspective: '2500px' }}>
          
          {/* Mobile View - Single Page */}
          <div 
            className="md:hidden glass-panel w-full h-full rounded-2xl p-4 sm:p-6 shadow-xl relative border-l-[8px] border-l-on-surface/30 origin-left"
            style={{
              transition: flipState.progress === 'animating' ? 'transform 800ms cubic-bezier(0.4, 0.0, 0.2, 1)' : 'none',
              transformStyle: 'preserve-3d',
              transform: flipState.progress === 'start' ? (flipState.direction === 'next' ? 'rotateY(90deg)' : 'rotateY(-90deg)') : 'rotateY(0deg)'
            }}
          >
            <div className="w-full h-full" style={getFadeStyle(true)}>
              <PageContent 
                dateStr={baseRight} 
                content={entries[baseRight]} 
                onChange={handleContentChange} 
                readOnly={flipState.isFlipping}
              />
            </div>
          </div>

          {/* Desktop View - Open Book */}
          <div className="hidden md:flex w-full h-full relative shadow-2xl rounded-2xl">
            
            {/* Left Page (Base) */}
            <div className="w-1/2 h-full glass-panel rounded-l-2xl rounded-r-none border-r border-black/10 dark:border-black/50 p-8 shadow-[inset_-10px_0_20px_rgba(0,0,0,0.05)] relative z-0">
              <div className="w-full h-full" style={getFadeStyle(flipState.direction === 'prev')}>
                <PageContent 
                  dateStr={baseLeft} 
                  content={entries[baseLeft]} 
                  onChange={handleContentChange}
                  readOnly={flipState.isFlipping}
                />
              </div>
            </div>
            
            {/* Right Page (Base) */}
            <div className="w-1/2 h-full glass-panel rounded-r-2xl rounded-l-none border-l border-white/20 dark:border-white/5 p-8 shadow-[inset_10px_0_20px_rgba(0,0,0,0.05)] relative z-0">
              <div className="w-full h-full" style={getFadeStyle(flipState.direction === 'next')}>
                <PageContent 
                  dateStr={baseRight} 
                  content={entries[baseRight]} 
                  onChange={handleContentChange}
                  readOnly={flipState.isFlipping}
                />
              </div>
            </div>

            {/* Central Spine Shadow */}
            <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-8 bg-gradient-to-r from-transparent via-black/10 to-transparent pointer-events-none z-10"></div>

            {/* Flipper - Next (Flips Right to Left) */}
            {flipState.isFlipping && flipState.direction === 'next' && (
              <div 
                className="absolute right-0 w-1/2 h-full z-20 origin-left"
                style={{
                  transition: 'transform 800ms cubic-bezier(0.4, 0.0, 0.2, 1)',
                  transformStyle: 'preserve-3d',
                  transform: flipState.progress === 'animating' ? 'rotateY(-180deg)' : 'rotateY(0deg)'
                }}
              >
                {/* Front (Old Right) */}
                <div className="absolute inset-0 glass-panel rounded-r-2xl rounded-l-none p-8 shadow-[-5px_0_15px_rgba(0,0,0,0.1)]" style={{ backfaceVisibility: 'hidden' }}>
                  <PageContent dateStr={currentRight} content={entries[currentRight]} readOnly />
                </div>
                {/* Back (New Left) */}
                <div className="absolute inset-0 glass-panel rounded-l-2xl rounded-r-none p-8 shadow-[5px_0_15px_rgba(0,0,0,0.1)]" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                  <PageContent dateStr={baseLeft} content={entries[baseLeft]} readOnly />
                </div>
              </div>
            )}

            {/* Flipper - Prev (Flips Left to Right) */}
            {flipState.isFlipping && flipState.direction === 'prev' && (
              <div 
                className="absolute left-0 w-1/2 h-full z-20 origin-right"
                style={{
                  transition: 'transform 800ms cubic-bezier(0.4, 0.0, 0.2, 1)',
                  transformStyle: 'preserve-3d',
                  transform: flipState.progress === 'animating' ? 'rotateY(180deg)' : 'rotateY(0deg)'
                }}
              >
                {/* Front (Old Left) */}
                <div className="absolute inset-0 glass-panel rounded-l-2xl rounded-r-none p-8 shadow-[5px_0_15px_rgba(0,0,0,0.1)]" style={{ backfaceVisibility: 'hidden' }}>
                  <PageContent dateStr={currentLeft} content={entries[currentLeft]} readOnly />
                </div>
                {/* Back (New Right) */}
                <div className="absolute inset-0 glass-panel rounded-r-2xl rounded-l-none p-8 shadow-[-5px_0_15px_rgba(0,0,0,0.1)]" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(-180deg)' }}>
                  <PageContent dateStr={baseRight} content={entries[baseRight]} readOnly />
                </div>
              </div>
            )}

          </div>
        </div>
      </main>
    </>
  );
}
