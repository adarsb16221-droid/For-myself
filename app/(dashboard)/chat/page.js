'use client';
import { useState, useEffect, useRef } from 'react';
import Header from '@/components/Header';
import Image from 'next/image';

import FaceAvatar from '@/components/FaceAvatar';

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
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState('');
  const messagesEndRef = useRef(null);
  const logEndRef = useRef(null);
  const speechRef = useRef(null);

  useEffect(() => {
    import('speak-tts').then(module => {
      const Speech = module.default;
      const speech = new Speech();
      if (speech.hasBrowserSupport()) {
        speech.init({
          'volume': 1,
          'lang': 'en-US',
          'rate': 2,
          'pitch': 1,
          'splitSentences': true,
        }).then((data) => {
          speechRef.current = speech;
          const engVoices = data.voices.filter(v => v.lang.startsWith('en'));
          setVoices(engVoices);
          if (engVoices.length > 0) {
            setSelectedVoice(engVoices[0].name);
            speech.setVoice(engVoices[0].name);
          }
        }).catch(e => {
          console.error("An error occured while initializing : ", e);
        });
      }
    });
  }, []);

  useEffect(() => {
    if (speechRef.current && selectedVoice) {
      speechRef.current.setVoice(selectedVoice);
    }
  }, [selectedVoice]);

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
          
          const cleanLastMsg = data.messages.slice().reverse().find(m => m.role === 'assistant' && m.content);
          if (cleanLastMsg && speechRef.current && isVoiceEnabled) {
            speechRef.current.speak({ text: cleanLastMsg.content }).catch(e => console.error("An error occurred while speaking: ", e));
          }
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
            <div className="flex justify-end gap-3 mb-auto flex-shrink-0 items-center">
              {isVoiceEnabled && voices.length > 0 && (
                <select 
                  value={selectedVoice} 
                  onChange={(e) => setSelectedVoice(e.target.value)}
                  className="bg-surface/50 text-on-surface text-sm rounded-lg px-2 py-1.5 border border-on-surface/10 outline-none backdrop-blur-md shadow-lg max-w-[120px] sm:max-w-[180px] truncate"
                  title="Select Voice"
                >
                  {voices.map(v => (
                    <option key={v.name} value={v.name} className="bg-surface text-on-surface">{v.name}</option>
                  ))}
                </select>
              )}
              <button 
                onClick={() => {
                  const newState = !isVoiceEnabled;
                  setIsVoiceEnabled(newState);
                  if (!newState && speechRef.current) {
                    speechRef.current.cancel();
                  }
                }}
                className={`flex items-center justify-center w-10 h-10 rounded-full transition-all backdrop-blur-md shadow-lg border ${
                  isVoiceEnabled 
                    ? 'bg-primary/20 text-primary border-primary/30 shadow-[0_0_15px_rgba(70,72,212,0.3)]' 
                    : 'bg-surface/50 text-on-surface-variant hover:text-on-surface border-on-surface/10 hover:bg-surface/80'
                }`}
                title={isVoiceEnabled ? "Disable Voice" : "Enable Voice"}
              >
                <span className="material-symbols-outlined text-[20px]">{isVoiceEnabled ? 'volume_up' : 'volume_off'}</span>
              </button>
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
                
                <div className="text-[14px] sm:text-[16px] text-on-surface leading-relaxed overflow-y-auto pt-2 pr-2 custom-scrollbar flex-1">
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
          <form onSubmit={sendMessage} className="relative flex items-end w-full max-w-5xl mx-auto">
            <textarea 
              className="w-full bg-surface-container/80 rounded-3xl pl-6 pr-16 py-4 sm:py-5 focus:ring-2 focus:ring-primary focus:outline-none text-on-surface font-medium shadow-inner border border-on-surface/20 placeholder:text-on-surface-variant/70 resize-none min-h-[56px] max-h-[150px] custom-scrollbar overflow-y-auto block"
              placeholder="Type your response to Orbit... (Shift+Enter for new line)"
              value={input}
              onChange={e => setInput(e.target.value)}
              onInput={(e) => {
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 150) + 'px';
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (input.trim() && !isLoading) {
                    sendMessage(e);
                    e.target.style.height = 'auto';
                  }
                }
              }}
              disabled={isLoading}
              rows={1}
            />
            <button 
              type="submit" 
              disabled={!input.trim() || isLoading}
              className="absolute right-2 bottom-2 w-10 h-10 sm:w-12 sm:h-12 bg-primary text-on-primary rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed shadow-lg"
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
                    <div className={`relative max-w-[85%] rounded-2xl p-4 shadow-sm ${
                      msg.role === 'user' 
                        ? 'bg-primary text-on-primary rounded-br-sm' 
                        : 'bg-surface-container-highest text-on-surface rounded-bl-sm border border-on-surface/5'
                    }`}>
                      <div className="flex justify-between items-center mb-1 gap-4">
                        <p className="text-xs opacity-70 font-bold tracking-wide uppercase">
                          {msg.role === 'user' ? 'You' : 'Orbit'}
                        </p>
                        {msg.role === 'assistant' && (
                          <button 
                            onClick={() => {
                              if (speechRef.current) {
                                speechRef.current.speak({ 
                                  text: msg.content.replace(/\[EMOTION:\s*(angry|happy|neutral|worried|confused)\]/gi, '').trim(),
                                  voice: selectedVoice 
                                }).catch(e => console.error(e));
                              }
                            }}
                            className="p-1 -mt-1 -mr-1 rounded-full hover:bg-on-surface/10 text-on-surface-variant transition-colors"
                            title="Speak Again"
                          >
                            <span className="material-symbols-outlined text-[14px]">volume_up</span>
                          </button>
                        )}
                      </div>
                      <div className="font-body-lg text-[13px] sm:text-[14px] leading-relaxed whitespace-pre-wrap">
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
