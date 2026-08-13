'use client';
import { useState, useEffect, useRef } from 'react';
import Header from '@/components/Header';
import FaceAvatar from '@/components/FaceAvatar';
import Image from 'next/image';

const MOTIVATIONAL_PHRASES = [
  "You're doing great, keep your focus sharp!",
  "Block out the noise, let's get this done.",
  "Every minute you focus is a step towards your goals.",
  "I'm right here with you. Let's conquer this task.",
  "Deep work brings deep rewards.",
  "Stay on track! You've got this.",
  "Your future self will thank you for this focus session."
];

export default function FocusPage() {
  const [timerMinutes, setTimerMinutes] = useState(25);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isFocusing, setIsFocusing] = useState(false);
  const [emotion, setEmotion] = useState('neutral');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [earnedPoints, setEarnedPoints] = useState(null);
  
  const speechRef = useRef(null);
  const initialMinutesRef = useRef(25);
  
  useEffect(() => {
    import('speak-tts').then(module => {
      const Speech = module.default;
      const speech = new Speech();
      if (speech.hasBrowserSupport()) {
        speech.init({
          'volume': 1,
          'lang': 'en-US',
          'rate': 1.25,
          'pitch': 1,
          'splitSentences': false,
        }).then((data) => {
          speechRef.current = speech;
          const engVoices = data.voices.filter(v => v.lang.startsWith('en'));
          if (engVoices.length > 0) {
            const emilyVoice = engVoices.find(v => v.name.includes('Emily') || v.name.includes('Ireland'));
            const defaultVoice = emilyVoice ? emilyVoice.name : engVoices[0].name;
            speech.setVoice(defaultVoice);
          }
        }).catch(e => console.error("Speech init error:", e));
      }
    });
  }, []);
  
  const speakMotivation = () => {
    if (!speechRef.current) return;
    const phrase = MOTIVATIONAL_PHRASES[Math.floor(Math.random() * MOTIVATIONAL_PHRASES.length)];
    setIsSpeaking(true);
    const emotions = ['happy', 'neutral'];
    setEmotion(emotions[Math.floor(Math.random() * emotions.length)]);
    
    speechRef.current.speak({ text: phrase }).then(() => {
      setIsSpeaking(false);
      setEmotion('neutral');
    }).catch(e => {
      console.error(e);
      setIsSpeaking(false);
      setEmotion('neutral');
    });
  };

  useEffect(() => {
    let interval;
    if (isFocusing) {
      interval = setInterval(() => {
        // 10% chance every minute to speak motivation (to not be too annoying)
        if (Math.random() > 0.9 && timerMinutes > 0) {
          speakMotivation();
        }
      }, 60 * 1000);
    }
    return () => clearInterval(interval);
  }, [isFocusing, timerMinutes]);

  // Randomly change emotions while focusing
  useEffect(() => {
    let emotionInterval;
    if (isFocusing) {
      emotionInterval = setInterval(() => {
        if (!isSpeaking) {
          const emotions = ['neutral', 'happy', 'worried', 'confused', 'neutral', 'neutral', 'neutral'];
          setEmotion(emotions[Math.floor(Math.random() * emotions.length)]);
        }
      }, 4000); // Change emotion every 4 seconds
    } else {
      if (!isSpeaking) setEmotion('neutral');
    }
    return () => clearInterval(emotionInterval);
  }, [isFocusing, isSpeaking]);

  useEffect(() => {
    let interval;
    if (isFocusing) {
      interval = setInterval(() => {
        setTimerSeconds(prevSeconds => {
          if (prevSeconds === 0) {
            if (timerMinutes === 0) {
              clearInterval(interval);
              handleFinish();
              return 0;
            } else {
              setTimerMinutes(m => m - 1);
              return 59;
            }
          }
          return prevSeconds - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isFocusing, timerMinutes]);

  const handleStart = () => {
    if (timerMinutes <= 0 && timerSeconds <= 0) return;
    initialMinutesRef.current = timerMinutes;
    setIsFocusing(true);
    setEarnedPoints(null);
    speakMotivation();
    try { 
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(e => console.log(e)); 
      }
    } catch (e) {}
  };

  const handleCancel = () => {
    setIsFocusing(false);
    try { 
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(e => console.log(e)); 
      }
    } catch (e) {}
    // Reset timer
    setTimerMinutes(initialMinutesRef.current);
    setTimerSeconds(0);
    if (speechRef.current) {
      speechRef.current.cancel();
      setIsSpeaking(false);
      setEmotion('neutral');
    }
  };

  const handleFinish = async () => {
    setIsFocusing(false);
    try { 
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(e => console.log(e)); 
      }
    } catch (e) {}
    
    const pointsToAward = initialMinutesRef.current > 0 ? initialMinutesRef.current : 1; 
    
    try {
      const res = await fetch('/api/user/points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ points: pointsToAward })
      });
      if (res.ok) {
        setEarnedPoints(pointsToAward);
        if (speechRef.current) {
          setIsSpeaking(true);
          setEmotion('happy');
          speechRef.current.speak({ text: `Awesome job! You just earned ${pointsToAward} Orbit points for completing your focus session.` }).then(() => {
            setIsSpeaking(false);
            setEmotion('neutral');
          });
        }
      }
    } catch(e) {
      console.error(e);
    }
  };

  const formatTime = (m, s) => {
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <>
      <main className="relative flex flex-col w-full h-full flex-1 overflow-hidden bg-background text-on-background">
        <Header title="Deep Focus" />
        
        {/* Global Background Image */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <Image 
            src="/orbit-bg.png" 
            alt="Background" 
            fill
            className="object-cover opacity-10 dark:opacity-30 blur-xl"
            unoptimized={true}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-background/90 to-background/80" />
        </div>

        <div className="relative z-10 flex flex-col items-center justify-center w-full h-full flex-1 p-4 sm:p-6 pt-10 sm:pt-12 pb-24 md:pb-12 overflow-hidden">
          
          <div className="glass-card max-w-xl w-full rounded-[2rem] p-6 md:p-8 flex flex-col items-center shadow-2xl relative my-auto">
            <h2 className="font-headline-lg text-[24px] md:text-[28px] font-bold text-on-surface mb-2">Focus Mode</h2>
            <p className="text-on-surface-variant font-body-lg text-center text-sm md:text-base mb-4 md:mb-6">Eliminate distractions and get things done.</p>

            <div className="flex justify-center items-center w-full mb-6 md:mb-8 h-[120px] sm:h-[160px] md:h-[180px]">
              <div className="transform scale-[0.8] sm:scale-[0.7] md:scale-[0.6] origin-center">
                <FaceAvatar isThinking={false} isSpeaking={false} emotion={emotion} />
              </div>
            </div>

            {earnedPoints && !isFocusing && (
              <div className="mb-8 bg-secondary-container/50 border border-secondary/20 px-6 py-4 rounded-2xl flex flex-col items-center animate-[slideIn_0.3s_ease-out]">
                <span className="material-symbols-outlined text-secondary text-[40px] mb-2" style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>
                <p className="text-on-secondary-container font-bold text-lg text-center">Session Complete!</p>
                <p className="text-on-secondary-container/80 text-sm">You earned +{earnedPoints} Orbit Points</p>
              </div>
            )}

            {!isFocusing && (
              <div className="flex flex-col items-center w-full">
                <label className="text-sm font-bold text-on-surface-variant mb-4 uppercase tracking-widest">Set Timer (Minutes)</label>
                <div className="flex items-center gap-2 sm:gap-4 mb-8 md:mb-10">
                  <button onClick={() => setTimerMinutes(m => Math.max(1, m - 5))} className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-surface-container hover:bg-surface-variant flex items-center justify-center text-on-surface transition-all text-xl sm:text-2xl font-bold shadow-sm">-</button>
                  <input 
                    type="number" 
                    value={timerMinutes}
                    onChange={(e) => setTimerMinutes(Math.max(1, parseInt(e.target.value) || 1))}
                    className="bg-transparent text-center text-4xl sm:text-5xl font-black text-primary w-20 sm:w-24 outline-none font-display-lg"
                  />
                  <button onClick={() => setTimerMinutes(m => m + 5)} className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-surface-container hover:bg-surface-variant flex items-center justify-center text-on-surface transition-all text-xl sm:text-2xl font-bold shadow-sm">+</button>
                </div>

                <button 
                  onClick={handleStart}
                  className="w-full py-4 rounded-full bg-primary text-on-primary font-bold text-lg hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg flex items-center justify-center gap-3"
                >
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
                  Start Focus
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Full Screen Active Timer Overlay */}
      {isFocusing && (
        <div className="fixed inset-0 z-[9999] bg-background/95 backdrop-blur-3xl flex flex-col items-center justify-center animate-[fadeIn_0.5s_ease-out]">
          <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 via-background to-secondary/10 opacity-50" />
          
          <div className="relative z-10 flex flex-col items-center">
            <div className="mb-4 sm:mb-8 md:mb-10 flex justify-center items-center h-[140px] sm:h-[224px] md:h-[288px]">
              <div className="transform scale-[1] sm:scale-[1] md:scale-[1] origin-center">
                <FaceAvatar isThinking={false} isSpeaking={false} emotion={emotion} />
              </div>
            </div>

            <div className="text-[60px] sm:text-[100px] md:text-[140px] leading-none font-black text-on-surface font-display-lg tracking-tighter drop-shadow-xl" style={{ fontVariantNumeric: 'tabular-nums' }}>
              {formatTime(timerMinutes, timerSeconds)}
            </div>

            <p className="text-xs sm:text-lg md:text-xl text-on-surface-variant font-medium mt-2 sm:mt-4 tracking-widest uppercase mb-6 sm:mb-10 md:mb-12 animate-pulse text-center">Deep Work In Progress</p>

            <button 
              onClick={handleCancel}
              className="px-8 py-4 rounded-full bg-error/10 hover:bg-error/20 text-error font-bold text-lg transition-all border border-error/20 flex items-center gap-2"
            >
              <span className="material-symbols-outlined">close</span>
              Give Up
            </button>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes slideIn {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </>
  );
}
