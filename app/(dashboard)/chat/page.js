'use client';
import { useState, useEffect, useRef } from 'react';
import Header from '@/components/Header';
import Image from 'next/image';

// FaceAvatar Component
function FaceAvatar({ isThinking, isSpeaking, emotion = 'neutral' }) {
  const isAction = isThinking || isSpeaking || emotion !== 'neutral';

  let leftEyebrow = '';
  let rightEyebrow = '';
  let leftEyeScale = '';
  let rightEyeScale = '';
  let mouthStyle = '';

  if (emotion === 'angry') {
    leftEyebrow = 'rotate-[20deg] translate-y-0 sm:translate-y-1';
    rightEyebrow = 'rotate-[-20deg] translate-y-0 sm:translate-y-1';
    leftEyeScale = 'scale-y-[0.6]';
    rightEyeScale = 'scale-y-[0.6]';
    mouthStyle = 'w-5 sm:w-8 h-1 bg-white dark:bg-white rounded-none shadow-[0_0_20px_rgba(255,255,255,0.8)]';
  } else if (emotion === 'happy') {
    leftEyebrow = 'translate-y-[-4px] sm:translate-y-[-8px]';
    rightEyebrow = 'translate-y-[-4px] sm:translate-y-[-8px]';
    mouthStyle = 'w-8 sm:w-14 h-3 sm:h-6 rounded-b-[2rem] rounded-t-sm bg-cyan-400 dark:bg-white translate-y-1 shadow-[0_0_20px_rgba(34,211,238,0.8)] dark:shadow-[0_0_30px_rgba(255,255,255,1)]';
  } else if (emotion === 'worried') {
    leftEyebrow = 'rotate-[-15deg] translate-y-[-2px] sm:translate-y-[-4px]';
    rightEyebrow = 'rotate-[15deg] translate-y-[-2px] sm:translate-y-[-4px]';
    mouthStyle = 'w-3 sm:w-6 h-1.5 sm:h-3 rounded-full bg-cyan-300 dark:bg-blue-200 shadow-[0_0_10px_rgba(103,232,249,0.5)]';
  } else if (emotion === 'confused') {
    leftEyebrow = 'rotate-[15deg] translate-y-0 sm:translate-y-1';
    rightEyebrow = 'rotate-[10deg] translate-y-[-6px]';
    leftEyeScale = 'scale-y-[0.6]';
    mouthStyle = 'w-5 sm:w-8 h-1.5 sm:h-3 rounded-md rotate-[-15deg] translate-x-2 sm:translate-x-3 bg-cyan-300 dark:bg-blue-200 shadow-[0_0_10px_rgba(103,232,249,0.5)]';
  } else {
    if (isThinking) {
      leftEyebrow = 'rotate-[5deg] translate-y-1';
      rightEyebrow = 'rotate-[-5deg] translate-y-1';
    }
  }

  const finalMouthStyle = isSpeaking && emotion === 'neutral' 
    ? 'mouth-talk bg-cyan-400 dark:bg-white shadow-[0_0_20px_rgba(34,211,238,0.8)] dark:shadow-[0_0_30px_rgba(255,255,255,1)] w-8 sm:w-12 h-1.5 sm:h-3 rounded-sm sm:rounded-lg' 
    : (emotion !== 'neutral' ? mouthStyle : 'w-8 sm:w-12 h-1.5 sm:h-3 rounded-sm sm:rounded-lg bg-cyan-200/40 dark:bg-blue-200/40 shadow-[0_0_10px_rgba(103,232,249,0.3)] dark:shadow-[0_0_10px_rgba(191,219,254,0.3)] opacity-50');

  const eyeBase = isThinking && emotion === 'neutral' 
    ? 'eye-think-left bg-cyan-400 shadow-[0_0_30px_rgba(34,211,238,0.8)] dark:bg-white dark:shadow-[0_0_30px_rgba(255,255,255,1)]' 
    : 'eye-blink bg-cyan-300 shadow-[0_0_20px_rgba(103,232,249,0.6)] dark:bg-blue-50 dark:shadow-[0_0_20px_rgba(239,246,255,0.8)]';

  const rightEyeBase = isThinking && emotion === 'neutral'
    ? 'eye-think-right bg-cyan-400 shadow-[0_0_30px_rgba(34,211,238,0.8)] dark:bg-white dark:shadow-[0_0_30px_rgba(255,255,255,1)]' 
    : 'eye-blink bg-cyan-300 shadow-[0_0_20px_rgba(103,232,249,0.6)] dark:bg-blue-50 dark:shadow-[0_0_20px_rgba(239,246,255,0.8)]';

  return (
    <div className={`relative flex items-center justify-center w-36 h-36 sm:w-56 sm:h-56 md:w-72 md:h-72 rounded-[2rem] sm:rounded-[3.5rem] bg-gradient-to-br from-black/5 via-black/10 to-transparent dark:from-blue-400 dark:via-blue-500 dark:to-blue-600 border border-black/10 dark:border-blue-300 backdrop-blur-2xl transition-all duration-700 ${isAction ? 'face-active' : 'face-float'}`}>
      {/* Inner glow and shadow */}
      <div className={`absolute inset-0 rounded-[2rem] sm:rounded-[3.5rem] shadow-[inset_0_0_60px_rgba(255,255,255,0.5)] dark:shadow-[inset_0_0_60px_rgba(255,255,255,0.3)] pointer-events-none transition-all duration-700 ${isAction ? 'shadow-[0_15px_60px_rgba(0,0,0,0.15)] dark:shadow-[0_0_80px_rgba(59,130,246,0.6)]' : 'shadow-[0_10px_40px_rgba(0,0,0,0.1)] dark:shadow-[0_0_40px_rgba(59,130,246,0.3)]'}`} />

      {/* Eyes Container */}
      <div className={`flex gap-6 sm:gap-14 z-10 transition-transform duration-500 ${isSpeaking ? 'translate-y-[-10px]' : 'mt-[-10%]'}`}>
        
        {/* Left Eye */}
        <div className={`relative flex items-center justify-center w-8 h-10 sm:w-14 sm:h-14 rounded-lg sm:rounded-2xl transition-all duration-300 ${eyeBase}`}>
          <div className={`absolute inset-0 flex items-center justify-center transition-transform duration-300 ${leftEyeScale}`}>
            {/* Eyebrow */}
            <div className={`absolute -top-5 sm:-top-10 w-10 h-3 sm:w-16 sm:h-6 bg-slate-800 dark:bg-blue-950 rounded-full z-20 transition-transform duration-300 ${leftEyebrow}`} />
          </div>
        </div>
        
        {/* Right Eye */}
        <div className={`relative flex items-center justify-center w-8 h-10 sm:w-14 sm:h-14 rounded-lg sm:rounded-2xl transition-all duration-300 ${rightEyeBase}`}>
          <div className={`absolute inset-0 flex items-center justify-center transition-transform duration-300 ${rightEyeScale}`}>
            {/* Eyebrow */}
            <div className={`absolute -top-5 sm:-top-10 w-10 h-3 sm:w-16 sm:h-6 bg-slate-800 dark:bg-blue-950 rounded-full z-20 transition-transform duration-300 ${rightEyebrow}`} />
          </div>
        </div>
      </div>

      {/* Mouth */}
      <div className={`absolute bottom-[22%] sm:bottom-[25%] z-10 transition-all duration-300 ${finalMouthStyle}`} />
    </div>
  );
}

// Typewriter Hook
function useTypewriter(text, speed = 15) {
  const [displayedText, setDisplayedText] = useState('');
  const [currentText, setCurrentText] = useState(text);

  if (text !== currentText) {
    setCurrentText(text);
    setDisplayedText('');
  }
  
  useEffect(() => {
    if (!text) return;
    
    let i = 0;
    const interval = setInterval(() => {
      setDisplayedText(text.substring(0, i + 1));
      i++;
      if (i >= text.length) clearInterval(interval);
    }, speed);
    
    return () => clearInterval(interval);
  }, [text, speed]);
  
  return displayedText;
}

export default function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showLog, setShowLog] = useState(false);
  const [emotion, setEmotion] = useState('neutral');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const savedMessages = localStorage.getItem('orbit_chat_history');
    if (savedMessages) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMessages(JSON.parse(savedMessages));
    } else {
      setMessages([
        {
          role: 'assistant',
          content: "Hello! I'm Orbit, your personal coach. I'm here to help you accelerate your growth in Health, Wealth, and Knowledge. How can we level up today?"
        }
      ]);
    }
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('orbit_chat_history', JSON.stringify(messages));
    }
    if (showLog) {
      logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, showLog]);

  const sendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = { role: 'user', content: input.trim() };
    const updatedMessages = [...messages, userMessage];
    
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);

    try {
      // Limit history to the last 10 messages to avoid token rate limits
      let recentMessages = updatedMessages;
      if (recentMessages.length > 10) {
        recentMessages = recentMessages.slice(-10);
        // Ensure we don't start with an orphaned tool response
        while (recentMessages.length > 0 && recentMessages[0].role === 'tool') {
          recentMessages.shift();
        }
        // Also ensure if the first message has tool_calls, that we have its tool responses,
        // but it's less critical for the API (usually it just ignores un-responded tool calls if it's the last turn).
      }

      const apiMessages = recentMessages.map(({ role, content, tool_calls, tool_call_id }) => {
        const msg = { role, content: content || (tool_calls ? null : "") };
        if (tool_calls) msg.tool_calls = tool_calls;
        if (tool_call_id) msg.tool_call_id = tool_call_id;
        return msg;
      });
      
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages })
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error('API Error:', errText);
        throw new Error('Failed to fetch response: ' + errText);
      }

      const data = await res.json();
      if (data.messages) {
        const lastMsg = data.messages.slice().reverse().find(m => m.role === 'assistant' && m.content);
        if (lastMsg) {
          const match = lastMsg.content.match(/\[EMOTION:\s*(angry|happy|neutral|worried|confused)\]/i);
          if (match) {
            setEmotion(match[1].toLowerCase());
          }
          data.messages = data.messages.map(m => {
            if (m.role === 'assistant' && m.content) {
              return { ...m, content: m.content.replace(/\[EMOTION:\s*(angry|happy|neutral|worried|confused)\]/gi, '').trim() };
            }
            return m;
          });
        }
        setMessages(prev => [...prev, ...data.messages]);
      } else if (data.choices) {
        setMessages(prev => [...prev, data.choices[0].message]);
      }
    } catch (error) {
      console.error(error);
      const errorMessage = error.message.toLowerCase();
      if (errorMessage.includes('rate limit') || errorMessage.includes('rate_limit_exceeded') || errorMessage.includes('tokens per minute')) {
        setMessages(prev => [...prev, { role: 'assistant', content: 'No more tokens are present.' }]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: 'Oops! I lost connection to the network. Please try again.' }]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    if (confirm('Are you sure you want to clear your conversation with Orbit?')) {
      const resetState = [{
        role: 'assistant',
        content: "Hello! I'm Orbit, your personal coach. I'm here to help you accelerate your growth in Health, Wealth, and Knowledge. How can we level up today?"
      }];
      setMessages(resetState);
      localStorage.setItem('orbit_chat_history', JSON.stringify(resetState));
      setShowLog(false);
    }
  };

  const lastAssistantMessage = messages.slice().reverse().find(m => m.role === 'assistant' && m.content);
  const typedMessage = useTypewriter(lastAssistantMessage?.content || '', 15);

  return (
    <>
      <main className="relative flex flex-col w-full h-full min-h-[calc(100vh-80px)] flex-1 overflow-hidden bg-background text-on-background">
        <Header title="Chat with Orbit" />
        
        {/* 1. Global Background Image (Adapts to light/dark mode) */}
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

        {/* Main Content Area (Split Screen) */}
        <div className="relative z-10 flex flex-col md:flex-row w-full flex-1 min-h-0 overflow-hidden">
          
          {/* 2. Character on Left */}
          <div className="relative w-full h-[40%] md:h-full md:w-[45%] lg:w-1/2 flex items-center justify-center pointer-events-none flex-shrink-0 md:flex-shrink">
            <FaceAvatar 
              isThinking={isLoading} 
              isSpeaking={!isLoading && !!lastAssistantMessage?.content && typedMessage !== lastAssistantMessage.content} 
              emotion={emotion}
            />
          </div>

          {/* 3. Speech Bubble & Controls on Right */}
          <div className="relative w-full h-[60%] md:h-full md:w-[55%] lg:w-1/2 flex flex-col p-4 sm:p-8 z-20 overflow-hidden">
            
            {/* Top Controls */}
            <div className="flex justify-end gap-3 mb-auto flex-shrink-0">
              <button 
                onClick={() => setShowLog(true)} 
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-surface/50 hover:bg-surface/80 text-on-surface transition-all backdrop-blur-md shadow-lg border border-on-surface/10 text-sm font-medium"
              >
                <span className="material-symbols-outlined text-[18px]">history</span>
                Chat Log
              </button>
              <button 
                onClick={clearChat} 
                className="flex items-center justify-center w-10 h-10 rounded-full bg-surface/50 hover:bg-error/80 hover:text-error-container text-on-surface transition-all backdrop-blur-md shadow-lg border border-on-surface/10"
                title="Clear Chat"
              >
                <span className="material-symbols-outlined text-[20px]">delete</span>
              </button>
            </div>
            
            {/* Dialogue Speech Bubble */}
            <div className="relative w-full max-w-xl mx-auto md:ml-4 lg:ml-8 mt-4 mb-4 flex-shrink min-h-0 flex flex-col">
              {/* Desktop Tail */}
              <div className="absolute top-[60%] -translate-y-1/2 -left-5 w-0 h-0 border-t-[15px] border-t-transparent border-b-[15px] border-b-transparent border-r-[20px] border-r-surface-container-highest/95 hidden md:block drop-shadow-2xl"></div>
              {/* Mobile Tail */}
              <div className="absolute -top-5 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-b-[20px] border-b-surface-container-highest/95 md:hidden drop-shadow-2xl"></div>
              
              {/* Glassmorphism Bubble */}
              <div className="w-full min-h-[140px] flex flex-col p-6 sm:p-8 rounded-[2rem] border border-on-surface/10 shadow-2xl relative bg-surface-container-highest/90 backdrop-blur-2xl">
                {/* Name Badge */}
                <div className="absolute -top-4 left-6 sm:left-8 bg-primary text-on-primary px-6 py-1.5 rounded-full font-black shadow-lg text-xs sm:text-sm tracking-widest uppercase border border-surface-container-highest">
                  Orbit
                </div>
                
                <div className="text-[16px] sm:text-[18px] text-on-surface leading-relaxed overflow-y-auto pt-2 pr-2 custom-scrollbar flex-1">
                  {isLoading ? (
                    <span className="flex items-center gap-2 text-primary animate-pulse font-medium">
                      <span className="material-symbols-outlined animate-spin text-[20px]">sync</span>
                      Thinking...
                    </span>
                  ) : (
                    <span className="whitespace-pre-wrap">{typedMessage}</span>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* 4. User Input at Bottom (Flex child, no absolute positioning needed) */}
        <div className="relative z-30 w-full p-4 sm:p-6 bg-surface-container-lowest/80 backdrop-blur-xl border-t border-on-surface/10 shadow-[0_-10px_40px_rgba(0,0,0,0.3)] flex-shrink-0">
          <form onSubmit={sendMessage} className="relative flex items-center w-full max-w-5xl mx-auto">
            <input 
              type="text"
              className="w-full bg-surface-container/80 rounded-full pl-6 pr-14 py-4 sm:py-5 focus:ring-2 focus:ring-primary focus:outline-none text-on-surface font-medium shadow-inner border border-on-surface/20 placeholder:text-on-surface-variant/70"
              placeholder="Type your response to Orbit..."
              value={input}
              onChange={e => setInput(e.target.value)}
              disabled={isLoading}
              autoComplete="off"
            />
            <button 
              type="submit" 
              disabled={!input.trim() || isLoading}
              className="absolute right-2 w-10 h-10 sm:w-12 sm:h-12 bg-primary text-on-primary rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed shadow-lg"
            >
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>send</span>
            </button>
          </form>
        </div>

        {/* Sliding Chat Log Modal */}
        {showLog && (
          <>
            <div 
              className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm z-40"
              onClick={() => setShowLog(false)}
            />
            <div className="absolute inset-y-0 right-0 w-full sm:w-[450px] bg-surface-container border-l border-on-surface/10 shadow-2xl z-50 flex flex-col animate-[slideIn_0.3s_ease-out]">
              <div className="flex justify-between items-center p-6 border-b border-on-surface/10 bg-surface/50 backdrop-blur-md">
                <h3 className="font-headline-sm font-bold text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">history</span>
                  Conversation Log
                </h3>
                <button 
                  onClick={() => setShowLog(false)}
                  className="p-2 rounded-full hover:bg-on-surface/10 text-on-surface-variant transition-colors"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col gap-6">
                {messages.filter(m => m.role !== 'tool' && m.content).map((msg, idx) => (
                  <div key={idx} className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-2xl p-4 shadow-sm ${
                      msg.role === 'user' 
                        ? 'bg-primary text-on-primary rounded-br-sm' 
                        : 'bg-surface-container-highest text-on-surface rounded-bl-sm border border-on-surface/5'
                    }`}>
                      <p className="text-xs opacity-70 mb-1 font-bold tracking-wide uppercase">
                        {msg.role === 'user' ? 'You' : 'Orbit'}
                      </p>
                      <div className="font-body-lg text-[14px] sm:text-[15px] leading-relaxed whitespace-pre-wrap">
                        {msg.content}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={logEndRef} className="h-4" />
              </div>
            </div>
          </>
        )}
      </main>
      
      <style jsx global>{`
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .face-float {
          animation: float 6s ease-in-out infinite;
        }
        .face-active {
          transform: scale(1.03);
        }
        .eye-blink {
          animation: blink 4.5s infinite;
        }
        .eye-think-left {
          animation: thinkLeft 3s infinite ease-in-out;
        }
        .eye-think-right {
          animation: thinkRight 3s infinite ease-in-out;
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
        @keyframes blink {
          0%, 92%, 98%, 100% { transform: scaleY(1); }
          95% { transform: scaleY(0.1); }
        }
        @keyframes thinkLeft {
          0%, 10% { transform: scaleY(1); }
          15%, 45% { transform: scaleY(0.7); }
          50%, 100% { transform: scaleY(1); }
        }
        @keyframes thinkRight {
          0%, 50% { transform: scaleY(1); }
          55%, 85% { transform: scaleY(0.7); }
          90%, 100% { transform: scaleY(1); }
        }
        .mouth-talk {
          animation: talk 0.12s infinite alternate ease-in-out;
        }
        @keyframes talk {
          0% { transform: scale(0.95, 0.3); }
          100% { transform: scale(0.75, 2.2); }
        }
      `}</style>
    </>
  );
}
