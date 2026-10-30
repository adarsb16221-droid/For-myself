'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { gsap } from '@/lib/gsap';
import { todayStr, offsetDate } from '@/lib/journalDates';
import JournalSheet from './JournalSheet';
import BookCover from './BookCover';
import { playPageTurn } from './pageTurnSound';

const COVER_KEY = 'journal-cover-opened-on';
const SOUND_KEY = 'journal-sound';

function readStorage(key) {
  try { return localStorage.getItem(key); } catch { return null; }
}

function writeStorage(key, value) {
  try { localStorage.setItem(key, value); } catch { /* private mode */ }
}

// The cover only swings open on the first visit of the day
function shouldShowCover() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
  return readStorage(COVER_KEY) !== todayStr();
}

// Stacked page edges: more entries on a side means a thicker stack
function edgeLayers(entryCount) {
  return 3 + Math.min(7, Math.ceil(entryCount / 5));
}

function edgeShadow(layers, dir) {
  const shadows = [];
  for (let i = 1; i <= layers; i++) {
    shadows.push(`${dir * i * 2}px ${i}px 0 ${i % 2 ? 'var(--paper-edge)' : 'var(--paper-edge-line)'}`);
  }
  shadows.push(`${dir * layers}px ${layers + 12}px 30px rgba(0, 0, 0, 0.22)`);
  return shadows.join(', ');
}

function SaveStamp({ state }) {
  if (state === 'saving') return <span className="font-hand text-lg text-on-surface-variant">writing…</span>;
  if (state === 'saved') return <span className="journal-save-stamp">✓ Saved</span>;
  if (state === 'error') return <span className="journal-save-stamp journal-save-stamp-error">Not saved</span>;
  return null;
}

export default function JournalBook({ isMobile, ownerName }) {
  const [rightDate, setRightDate] = useState(todayStr);
  const [entries, setEntries] = useState({});
  const [moods, setMoods] = useState({});
  const [saveState, setSaveState] = useState('idle');
  const [flip, setFlip] = useState(null);
  const [showCover, setShowCover] = useState(shouldShowCover);
  const [soundOn, setSoundOn] = useState(() => readStorage(SOUND_KEY) === 'on');

  const bookRef = useRef(null);
  const flipperRef = useRef(null);
  const frontShadeRef = useRef(null);
  const backShadeRef = useRef(null);
  const castShadowRef = useRef(null);
  const flipRef = useRef(null);
  const progressRef = useRef(0);
  const tweenRef = useRef(null);
  const saveTimers = useRef({});
  const savedTimer = useRef(null);
  const touchStart = useRef(null);

  const today = todayStr();
  const step = isMobile ? 1 : 2;
  const leftDate = offsetDate(rightDate, -1);

  // ── Data ──
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [entriesRes, moodsRes] = await Promise.all([
          fetch('/api/journal', { cache: 'no-store' }),
          fetch('/api/journal/mood', { cache: 'no-store' }),
        ]);
        if (!cancelled && entriesRes.ok) setEntries(await entriesRes.json());
        if (!cancelled && moodsRes.ok) setMoods(await moodsRes.json());
      } catch (e) {
        console.error(e);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (showCover) writeStorage(COVER_KEY, todayStr());
  }, [showCover]);

  const postEntry = (date, content) => fetch('/api/journal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ [date]: content }),
    keepalive: true,
  });

  const saveEntry = useCallback(async (date, content) => {
    delete saveTimers.current[date];
    setSaveState('saving');
    try {
      const res = await postEntry(date, content);
      if (!res.ok) throw new Error('Save failed');
      setSaveState('saved');
      clearTimeout(savedTimer.current);
      savedTimer.current = setTimeout(() => setSaveState('idle'), 2500);
    } catch {
      setSaveState('error');
    }
  }, []);

  // Each date debounces on its own timer, so turning the page never drops an unsaved edit
  const handleContentChange = (date, content) => {
    setEntries(prev => ({ ...prev, [date]: content }));
    setSaveState('saving');
    clearTimeout(saveTimers.current[date]?.id);
    saveTimers.current[date] = { id: setTimeout(() => saveEntry(date, content), 1000), content };
  };

  useEffect(() => {
    const timers = saveTimers.current;
    return () => {
      Object.entries(timers).forEach(([date, { id, content }]) => {
        clearTimeout(id);
        postEntry(date, content).catch(() => {});
      });
      clearTimeout(savedTimer.current);
      tweenRef.current?.kill();
    };
  }, []);

  const handleMoodChange = (date, mood) => {
    setMoods(prev => {
      const next = { ...prev };
      if (mood) next[date] = mood; else delete next[date];
      return next;
    });
    fetch('/api/journal/mood', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date, mood }),
    }).catch(console.error);
  };

  // ── Page flip engine ──
  const applyProgress = useCallback((p) => {
    const current = flipRef.current;
    if (!current || !flipperRef.current) return;
    const sign = current.direction === 'next' ? -1 : 1;
    const lift = Math.sin(p * Math.PI);

    gsap.set(flipperRef.current, { rotationY: sign * 180 * p, z: lift * 40 });
    if (frontShadeRef.current) frontShadeRef.current.style.opacity = Math.min(1, p * 1.8) * 0.5;
    if (backShadeRef.current) backShadeRef.current.style.opacity = (1 - p) * 0.5;
    if (castShadowRef.current) castShadowRef.current.style.opacity = lift * 0.7;
  }, []);

  const finishFlip = useCallback((commit) => {
    const current = flipRef.current;
    flipRef.current = null;
    progressRef.current = 0;
    if (castShadowRef.current) castShadowRef.current.style.opacity = 0;
    setFlip(null);
    if (commit && current) setRightDate(current.target);
  }, []);

  const animateTo = useCallback((to) => {
    const state = { p: progressRef.current };
    tweenRef.current?.kill();
    tweenRef.current = gsap.to(state, {
      p: to,
      duration: 0.25 + 0.75 * Math.abs(to - state.p),
      ease: 'power2.inOut',
      onUpdate: () => {
        progressRef.current = state.p;
        applyProgress(state.p);
      },
      onComplete: () => finishFlip(to === 1),
    });
  }, [applyProgress, finishFlip]);

  const startFlip = useCallback((direction, target, manual = false) => {
    if (flipRef.current || showCover) return false;
    const next = { direction, target, manual };
    flipRef.current = next;
    progressRef.current = 0;
    setFlip(next);
    if (soundOn) playPageTurn();
    return true;
  }, [showCover, soundOn]);

  useLayoutEffect(() => {
    if (!flip) return;
    applyProgress(progressRef.current);
    if (!flip.manual) animateTo(1);
  }, [flip, applyProgress, animateTo]);

  const turnPage = useCallback((direction) => {
    startFlip(direction, offsetDate(rightDate, direction === 'next' ? step : -step));
  }, [rightDate, step, startFlip]);

  const goToDate = (target) => {
    if (!target || target === rightDate || (!isMobile && target === leftDate)) return;
    startFlip(target > rightDate ? 'next' : 'prev', target);
  };

  // Drag a page corner: the page follows the pointer, and lets go past 25%
  const beginDrag = (e, direction) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    const pageWidth = bookRef.current.offsetWidth / (isMobile ? 1 : 2);
    if (!startFlip(direction, offsetDate(rightDate, direction === 'next' ? step : -step), true)) return;
    e.preventDefault();

    const startX = e.clientX;
    const span = isMobile ? pageWidth : pageWidth * 2;
    const move = (ev) => {
      const dx = ev.clientX - startX;
      const p = Math.min(1, Math.max(0, (direction === 'next' ? -dx : dx) / span));
      progressRef.current = p;
      applyProgress(p);
    };
    const release = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', release);
      window.removeEventListener('pointercancel', release);
      animateTo(progressRef.current > 0.25 ? 1 : 0);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', release);
    window.addEventListener('pointercancel', release);
  };

  useEffect(() => {
    const onKey = (e) => {
      if (e.target.closest?.('textarea, input, select, [contenteditable="true"]')) return;
      if (e.key === 'ArrowRight') turnPage('next');
      if (e.key === 'ArrowLeft') turnPage('prev');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [turnPage]);

  // Pocket-notebook swipe on phones
  const onTouchStart = (e) => {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
  };
  const onTouchEnd = (e) => {
    if (!touchStart.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStart.current.x;
    const dy = t.clientY - touchStart.current.y;
    touchStart.current = null;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) turnPage(dx < 0 ? 'next' : 'prev');
  };

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    writeStorage(SOUND_KEY, next ? 'on' : 'off');
    if (next) playPageTurn();
  };

  // ── What sits where during a flip ──
  let baseLeft = leftDate;
  let baseRight = rightDate;
  let flipFront = null;
  let flipBack = null;

  if (flip) {
    if (isMobile) {
      baseRight = flip.target;
      flipFront = rightDate;
    } else if (flip.direction === 'next') {
      baseRight = flip.target;
      flipFront = rightDate;
      flipBack = offsetDate(flip.target, -1);
    } else {
      baseLeft = offsetDate(flip.target, -1);
      flipFront = leftDate;
      flipBack = rightDate;
    }
  }

  const writtenDates = Object.keys(entries).filter(date => entries[date]?.trim());
  const firstShown = isMobile ? baseRight : baseLeft;
  const pagesBefore = writtenDates.filter(date => date < firstShown).length;
  const pagesAfter = writtenDates.filter(date => date > baseRight).length;
  const todayVisible = rightDate === today || (!isMobile && leftDate === today);

  const sheet = (date, side, readOnly) => (
    <JournalSheet
      dateStr={date}
      side={side}
      content={entries[date]}
      mood={moods[date] ?? null}
      isToday={date === today}
      readOnly={readOnly}
      onChange={handleContentChange}
      onMoodChange={handleMoodChange}
    />
  );

  const isBusy = Boolean(flip) || showCover;

  return (
    <div className="flex flex-col gap-4 sm:gap-6 w-full">
      {/* Controls */}
      <div className="flex items-center justify-between gap-2 w-full max-w-5xl mx-auto px-1">
        <button
          onClick={() => turnPage('prev')}
          disabled={isBusy}
          className="p-2 rounded-full hover:bg-on-surface/5 text-on-surface-variant hover:text-on-surface transition-colors disabled:opacity-40 flex items-center gap-1"
          title="Previous page (←)"
        >
          <span className="material-symbols-outlined text-3xl">chevron_left</span>
          <span className="hidden sm:inline font-medium text-sm">Previous</span>
        </button>

        <div className="flex items-center gap-2">
          <input
            type="date"
            value={rightDate}
            onChange={(e) => goToDate(e.target.value)}
            disabled={isBusy}
            className="bg-transparent border border-on-surface/20 rounded-lg px-3 py-1.5 text-on-surface text-sm focus:outline-none focus:border-primary font-semibold cursor-pointer hover:bg-on-surface/5 transition-colors"
            title="Jump to date"
          />
          <button
            onClick={toggleSound}
            aria-pressed={soundOn}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-on-surface/5 transition-colors"
            title={soundOn ? 'Page sound on' : 'Page sound off'}
          >
            <span className="material-symbols-outlined text-[20px]">{soundOn ? 'volume_up' : 'volume_off'}</span>
          </button>
          <div className="w-24 h-8 hidden sm:flex items-center justify-center">
            <SaveStamp state={saveState} />
          </div>
        </div>

        <button
          onClick={() => turnPage('next')}
          disabled={isBusy}
          className="p-2 rounded-full hover:bg-on-surface/5 text-on-surface-variant hover:text-on-surface transition-colors disabled:opacity-40 flex items-center gap-1"
          title="Next page (→)"
        >
          <span className="hidden sm:inline font-medium text-sm">Next</span>
          <span className="material-symbols-outlined text-3xl">chevron_right</span>
        </button>
      </div>

      {/* Book */}
      <div
        ref={bookRef}
        onTouchStart={isMobile ? onTouchStart : undefined}
        onTouchEnd={isMobile ? onTouchEnd : undefined}
        className="relative w-full max-w-5xl mx-auto h-[68vh] min-h-[460px] md:h-[min(74vh,700px)] md:min-h-[540px]"
        style={{ perspective: '2500px' }}
      >
        {isMobile ? (
          <div className="absolute inset-0 rounded-xl" style={{ boxShadow: edgeShadow(edgeLayers(pagesAfter), 1) }}>
            {sheet(baseRight, 'single', isBusy)}
            {!isBusy && <div className="journal-corner journal-corner-right" onPointerDown={(e) => beginDrag(e, 'next')} title="Drag to turn" />}
          </div>
        ) : (
          <>
            <div className="absolute inset-y-0 left-0 w-1/2 rounded-l-xl" style={{ boxShadow: edgeShadow(edgeLayers(pagesBefore), -1) }}>
              {sheet(baseLeft, 'left', isBusy)}
              {!isBusy && <div className="journal-corner journal-corner-left" onPointerDown={(e) => beginDrag(e, 'prev')} title="Drag to turn back" />}
            </div>
            <div className="absolute inset-y-0 right-0 w-1/2 rounded-r-xl" style={{ boxShadow: edgeShadow(edgeLayers(pagesAfter), 1) }}>
              {sheet(baseRight, 'right', isBusy)}
              {!isBusy && <div className="journal-corner journal-corner-right" onPointerDown={(e) => beginDrag(e, 'next')} title="Drag to turn" />}
            </div>
            <div className="journal-spine pointer-events-none absolute inset-y-0 left-1/2 -translate-x-1/2 w-16 z-10" />
          </>
        )}

        <div ref={castShadowRef} className="journal-cast-shadow pointer-events-none absolute inset-0 z-20 opacity-0" />

        {/* The turning page */}
        {flip && (
          <div
            ref={flipperRef}
            className={`absolute inset-y-0 z-30 ${isMobile ? 'inset-x-0' : 'w-1/2'} ${!isMobile && flip.direction === 'prev' ? 'left-0' : 'right-0'}`}
            style={{
              transformStyle: 'preserve-3d',
              transformOrigin: flip.direction === 'prev' ? 'right center' : 'left center',
            }}
          >
            <div className="absolute inset-0 [backface-visibility:hidden]">
              {sheet(flipFront, isMobile ? 'single' : flip.direction === 'next' ? 'right' : 'left', true)}
              <div
                ref={frontShadeRef}
                className="pointer-events-none absolute inset-0 opacity-0"
                style={{ background: `linear-gradient(to ${flip.direction === 'next' ? 'left' : 'right'}, rgba(0,0,0,0.35), transparent 70%)` }}
              />
            </div>
            {flipBack && (
              <div className="absolute inset-0 [backface-visibility:hidden]" style={{ transform: 'rotateY(180deg)' }}>
                {sheet(flipBack, flip.direction === 'next' ? 'left' : 'right', true)}
                <div
                  ref={backShadeRef}
                  className="pointer-events-none absolute inset-0 opacity-0"
                  style={{ background: `linear-gradient(to ${flip.direction === 'next' ? 'right' : 'left'}, rgba(0,0,0,0.35), transparent 70%)` }}
                />
              </div>
            )}
          </div>
        )}

        {/* Ribbon bookmark: back to today */}
        <button
          onClick={() => goToDate(today)}
          disabled={isBusy || todayVisible}
          className={`journal-ribbon-wrap absolute -top-2 z-30 ${isMobile ? 'left-3' : 'left-[calc(50%+14px)]'}`}
          title={todayVisible ? 'You are on today' : 'Back to today'}
          aria-label="Back to today"
        >
          <span className={`journal-ribbon block w-6 ${todayVisible ? 'h-16' : 'h-24'}`} />
        </button>

        {showCover && (
          <BookCover
            name={ownerName || 'My Journal'}
            isMobile={isMobile}
            onOpened={() => setShowCover(false)}
          />
        )}
      </div>

      <div className="sm:hidden h-6 flex items-center justify-center">
        <SaveStamp state={saveState} />
      </div>
    </div>
  );
}
