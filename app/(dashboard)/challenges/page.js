'use client';
import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/Header';
import Spinner from '@/components/Spinner';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';

export default function ChallengesPage() {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedChallenges, setExpandedChallenges] = useState({});
  const { user } = useAuth();

  const fetchChallenges = useCallback(async () => {
    try {
      const res = await fetch('/api/challenges');
      if (res.ok) {
        setChallenges(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchChallenges();
  }, [fetchChallenges]);

  useEffect(() => {
    // SSE: Listen for real-time challenge updates
    const eventSource = new EventSource('/api/notifications/stream');
    eventSource.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        const challengeEvents = ['challenge_accepted', 'challenge_received', 'task_completed'];
        if (challengeEvents.includes(data.type)) {
          fetchChallenges();
        }
      } catch (err) {}
    };
    return () => eventSource.close();
  }, [fetchChallenges]);

  const toggleTask = async (challengeId, taskId, completed) => {
    try {
      // Optimistic
      setChallenges(challenges.map(c => {
        if (c._id === challengeId) {
          const newTasks = c.tasks.map(t => {
            if (t._id === taskId) {
              const isCreator = c.creator?._id === user?.userId;
              const isSelf = c.creator?._id === c.recipient?._id;
              
              if (t.isDaily) {
                const todayStr = new Date().toISOString().split('T')[0];
                if (isSelf || !isCreator) {
                  let newHistory = t.recipientHistory || [];
                  if (completed && !newHistory.includes(todayStr)) newHistory = [...newHistory, todayStr];
                  if (!completed) newHistory = newHistory.filter(d => d !== todayStr);
                  return { ...t, recipientHistory: newHistory };
                }
                if (isCreator && c.type === 'mutual') {
                  let newHistory = t.creatorHistory || [];
                  if (completed && !newHistory.includes(todayStr)) newHistory = [...newHistory, todayStr];
                  if (!completed) newHistory = newHistory.filter(d => d !== todayStr);
                  return { ...t, creatorHistory: newHistory };
                }
                return t;
              } else {
                if (isSelf || !isCreator) return { ...t, recipientCompleted: completed };
                if (isCreator && c.type === 'mutual') return { ...t, creatorCompleted: completed };
              }
            }
            return t;
          });
          return { ...c, tasks: newTasks };
        }
        return c;
      }));

      const res = await fetch(`/api/challenges/${challengeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, completed })
      });
      if (!res.ok) {
        console.error('API Error:', await res.text());
        fetchChallenges();
      } else {
        fetchChallenges(); // Always fetch to ensure UI is consistent
      }
    } catch (err) {
      console.error(err);
      fetchChallenges();
    }
  };

  const handleChallengeAction = async (challengeId, action) => {
    try {
      // Optimistic UI update
      setChallenges(challenges.map(c => {
        if (c._id === challengeId) {
          return { ...c, status: action === 'accept' ? 'accepted' : 'rejected' };
        }
        return c;
      }));

      const res = await fetch(`/api/challenges/${challengeId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      if (!res.ok) fetchChallenges();
    } catch (err) {
      console.error(err);
      fetchChallenges();
    }
  };

  const CHALLENGE_TEMPLATES = [
    {
      id: 'get_in_shape',
      title: 'Get in Shape',
      icon: 'fitness_center',
      desc: 'Daily exercise challenge',
      durationDays: 30,
      tasks: [
        { title: 'Exercise for 45 minutes', isDaily: true }
      ]
    },
    {
      id: 'read_book',
      title: 'Read a Book',
      icon: 'menu_book',
      desc: 'Buy a book and read it daily',
      durationDays: 14,
      tasks: [
        { title: 'Buy the book', isDaily: false },
        { title: 'Read 10 pages', isDaily: true }
      ]
    },
    {
      id: '75_hard',
      title: '75 Hard',
      icon: 'local_fire_department',
      desc: 'The ultimate mental toughness program',
      durationDays: 75,
      tasks: [
        { title: 'Two 45-min workouts (one outside)', isDaily: true },
        { title: 'Drink 1 gallon of water', isDaily: true },
        { title: 'Read 10 pages of nonfiction', isDaily: true },
        { title: 'Stick to a diet', isDaily: true },
        { title: 'No cheat meals or alcohol', isDaily: true },
        { title: 'Take a progress picture', isDaily: true }
      ]
    }
  ];

  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [friends, setFriends] = useState([]);
  const [selectedFriend, setSelectedFriend] = useState('');
  const [challengeType, setChallengeType] = useState('mutual');
  const [submittingTemplate, setSubmittingTemplate] = useState(false);

  const openTemplateModal = async (template) => {
    setSelectedTemplate(template);
    setShowTemplateModal(true);
    // Fetch friends
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const users = await res.json();
        setFriends(users.filter(u => u.isFriend));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleStartTemplate = async (e) => {
    e.preventDefault();
    if (!selectedFriend || !selectedTemplate) return;

    setSubmittingTemplate(true);
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + selectedTemplate.durationDays);

    const isSelf = selectedFriend === user?.userId;

    try {
      const res = await fetch('/api/challenges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientId: selectedFriend,
          type: isSelf ? 'challenge' : challengeType,
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
          tasks: selectedTemplate.tasks
        })
      });
      if (res.ok) {
        setShowTemplateModal(false);
        setSelectedTemplate(null);
        setSelectedFriend('');
        fetchChallenges();
        alert('Challenge started successfully!');
      } else {
        alert('Failed to start challenge');
      }
    } catch (err) {
      console.error(err);
      alert('Error starting challenge');
    } finally {
      setSubmittingTemplate(false);
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const activeChallenges = challenges.filter(c => c.status !== 'completed' && c.status !== 'rejected');

  return (
    <div className="flex flex-col h-full bg-surface relative">
      <Header title="Challenges" />

      <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-headline-md font-bold text-on-surface mb-2">Challenge Templates</h1>
            <p className="text-on-surface-variant font-body-lg mb-6">Start a standard challenge with your friends.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {CHALLENGE_TEMPLATES.map(template => (
                <div key={template.id} onClick={() => openTemplateModal(template)} className="bg-surface-container rounded-2xl p-5 border border-outline-variant/30 shadow-sm hover:shadow-md transition-all cursor-pointer hover:-translate-y-1 group">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-[24px]">{template.icon}</span>
                  </div>
                  <h3 className="font-title-lg font-bold text-on-surface mb-1">{template.title}</h3>
                  <p className="text-sm text-on-surface-variant mb-3">{template.desc}</p>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-primary">
                    {template.durationDays} Days • {template.tasks.length} Tasks
                  </div>
                </div>
              ))}
            </div>
          </div>

          <h2 className="text-2xl font-headline-md font-bold text-on-surface mb-6">Active Challenges</h2>

          {loading ? (
            <div className="flex justify-center py-12"><Spinner /></div>
          ) : activeChallenges.length === 0 ? (
            <div className="bg-surface-container rounded-2xl p-8 text-center border border-outline-variant/30 flex flex-col items-center">
              <span className="material-symbols-outlined text-[48px] text-on-surface-variant mb-4">flag</span>
              <h3 className="font-title-lg font-bold text-on-surface mb-2">No Active Challenges</h3>
              <p className="text-on-surface-variant mb-6">You don&apos;t have any ongoing challenges right now.</p>
              <Link 
                href="/community" 
                className="inline-flex items-center gap-2 bg-primary text-on-primary px-6 py-3 rounded-xl font-label-lg font-bold hover:bg-primary/90 transition-colors shadow-sm"
              >
                <span className="material-symbols-outlined text-[20px]">group_add</span>
                Challenge a Friend
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {activeChallenges.map(c => {
                const isSelf = c.creator?._id === c.recipient?._id;
                const isCreator = c.creator?._id === user?.userId;
                const otherUser = isSelf ? c.creator : (isCreator ? c.recipient : c.creator);
                
                const isMutual = c.type === 'mutual';
                
                // Calculate progress
                const totalTasks = c.tasks.length;
                let completedTasks = 0;
                c.tasks.forEach(t => {
                  if (isMutual && !isSelf) {
                    if (isCreator && (t.isDaily ? t.creatorHistory?.includes(todayStr) : t.creatorCompleted)) completedTasks++;
                    if (!isCreator && (t.isDaily ? t.recipientHistory?.includes(todayStr) : t.recipientCompleted)) completedTasks++;
                  } else {
                    // For self challenges, recipient/creator is the same, so we just use recipient completion logic
                    if ((t.isDaily ? t.recipientHistory?.includes(todayStr) : t.recipientCompleted)) completedTasks++;
                  }
                });
                
                const progressPercent = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
                const isExpanded = expandedChallenges[c._id] || !isCreator || isSelf;

                return (
                  <div key={c._id} className="bg-surface-container rounded-2xl p-5 border border-outline-variant/30 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                            {isSelf ? 'Personal Challenge' : (isMutual ? 'Mutual Challenge' : 'Solo Challenge')}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${
                            c.status === 'pending' ? 'bg-outline-variant/20 text-on-surface-variant' : 
                            c.status === 'completed' ? 'bg-secondary/10 text-secondary border border-secondary/20' : 
                            'bg-tertiary/10 text-tertiary'
                          }`}>
                            {c.status}
                          </span>
                        </div>
                        <h3 className="font-title-lg font-bold text-on-surface">
                          {isSelf ? 'My Challenge' : (isCreator ? `Sent to ${otherUser?.name}` : `Received from ${otherUser?.name}`)}
                        </h3>
                        <p className="font-body-sm text-on-surface-variant">
                          {new Date(c.startDate).toLocaleDateString()} - {new Date(c.endDate).toLocaleDateString()}
                        </p>
                        {c.note && (
                          <div className="mt-3 p-3 bg-tertiary/10 border border-tertiary/20 rounded-xl relative overflow-hidden">
                            <span className="material-symbols-outlined absolute right-2 bottom-2 text-tertiary/20 text-[48px] pointer-events-none">format_quote</span>
                            <p className="font-body-sm italic text-on-surface relative z-10">"{c.note}"</p>
                            <p className="font-label-sm font-bold text-tertiary mt-1 relative z-10">— {c.creator?.name}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {isCreator && (
                      <div className="mt-4 border-t border-on-surface/10 pt-4">
                        <div 
                          className="flex items-center justify-between cursor-pointer group"
                          onClick={() => setExpandedChallenges(prev => ({ ...prev, [c._id]: !prev[c._id] }))}
                        >
                          <div className="flex-1 mr-4">
                            <div className="flex justify-between items-center mb-1 text-sm font-medium">
                              <span className="text-on-surface">Today&apos;s Progress</span>
                              <span className="text-primary">{completedTasks} / {totalTasks} Tasks</span>
                            </div>
                            <div className="h-2 w-full bg-outline-variant/30 rounded-full overflow-hidden">
                              <div className="h-full bg-primary transition-all duration-500 ease-out" style={{ width: `${progressPercent}%` }} />
                            </div>
                          </div>
                          <button className="w-8 h-8 rounded-full bg-surface flex items-center justify-center border border-outline-variant/30 text-on-surface-variant group-hover:bg-on-surface/5 transition-colors">
                            <span className="material-symbols-outlined text-[20px] transition-transform duration-300" style={{ transform: isExpanded ? 'rotate(180deg)' : 'none' }}>
                              expand_more
                            </span>
                          </button>
                        </div>
                      </div>
                    )}

                    {isExpanded && (
                      <div className={`space-y-3 mt-4 ${!isCreator ? 'border-t border-on-surface/10 pt-4' : 'pt-2'}`}>
                        {!isCreator && <h4 className="font-label-lg font-bold text-on-surface">Tasks</h4>}
                        {c.tasks.map(t => {
                          const iCanEdit = c.status === 'accepted' && (isMutual || !isCreator || isSelf);
                          
                          let mainChecked = false;
                          let partnerChecked = false;

                          if (isMutual && !isSelf) {
                            if (t.isDaily) {
                              mainChecked = isCreator ? t.creatorHistory?.includes(todayStr) : t.recipientHistory?.includes(todayStr);
                              partnerChecked = isCreator ? t.recipientHistory?.includes(todayStr) : t.creatorHistory?.includes(todayStr);
                            } else {
                              mainChecked = isCreator ? t.creatorCompleted : t.recipientCompleted;
                              partnerChecked = isCreator ? t.recipientCompleted : t.creatorCompleted;
                            }
                          } else {
                            if (t.isDaily) {
                              mainChecked = t.recipientHistory?.includes(todayStr);
                            } else {
                              mainChecked = t.recipientCompleted;
                            }
                          }

                          return (
                            <div key={t._id} className="flex items-center justify-between bg-surface p-3 rounded-xl border border-outline-variant/20">
                              <div className="flex items-center gap-3">
                                {iCanEdit ? (
                                  <input 
                                    type="checkbox" 
                                    checked={mainChecked || false} 
                                    onChange={(e) => toggleTask(c._id, t._id, e.target.checked)}
                                    className="w-5 h-5 rounded border-outline text-primary focus:ring-primary accent-primary cursor-pointer"
                                  />
                                ) : (
                                  <div className={`w-5 h-5 flex items-center justify-center rounded ${mainChecked ? 'bg-primary text-on-primary' : 'bg-surface-container border border-outline/50'}`}>
                                    {mainChecked && <span className="material-symbols-outlined text-[14px] font-bold">check</span>}
                                  </div>
                                )}
                                <span className={`font-body-md ${mainChecked ? 'text-on-surface-variant line-through' : 'text-on-surface font-medium'}`}>
                                  {t.title} {t.isDaily && <span className="text-[10px] uppercase bg-secondary/10 text-secondary px-1.5 py-0.5 rounded ml-2">Daily</span>}
                                </span>
                              </div>
                              
                              {isMutual && !isSelf && (
                                <div className="flex items-center gap-2 text-sm">
                                  <span className="text-on-surface-variant text-[11px] uppercase tracking-wide">{otherUser.name.split(' ')[0]}:</span>
                                  <div className={`w-5 h-5 flex items-center justify-center rounded-full ${partnerChecked ? 'bg-secondary/20 text-secondary' : 'bg-surface-container border border-outline/30 text-transparent'}`}>
                                    <span className="material-symbols-outlined text-[12px] font-bold">check</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {!isCreator && c.status === 'pending' && (
                      <div className="flex gap-3 mt-5 pt-4 border-t border-on-surface/10">
                        <button 
                          onClick={() => handleChallengeAction(c._id, 'accept')}
                          className="flex-1 bg-primary text-on-primary py-2.5 rounded-xl font-label-lg font-bold hover:bg-primary/90 transition-colors shadow-sm"
                        >
                          Accept Challenge
                        </button>
                        <button 
                          onClick={() => handleChallengeAction(c._id, 'reject')}
                          className="flex-1 bg-error/10 text-error py-2.5 rounded-xl font-label-lg font-bold hover:bg-error/20 transition-colors"
                        >
                          Decline
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Template Modal */}
      {showTemplateModal && selectedTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-container-highest/80 backdrop-blur-sm">
          <div className="bg-surface rounded-2xl w-full max-w-md shadow-2xl border border-on-surface/10 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-on-surface/10 flex justify-between items-center bg-surface-container">
              <h2 className="font-title-lg font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">{selectedTemplate.icon}</span>
                Start {selectedTemplate.title}
              </h2>
              <button onClick={() => setShowTemplateModal(false)} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-on-surface/10">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1">
              <form id="template-form" onSubmit={handleStartTemplate} className="space-y-4">
                <div>
                  <label className="block font-label-lg font-bold text-on-surface mb-1">Assign To</label>
                  <select required value={selectedFriend} onChange={(e) => setSelectedFriend(e.target.value)} className="w-full bg-surface-container border border-outline/30 rounded-lg px-3 py-2 text-on-surface font-body-md focus:outline-none focus:border-primary">
                    <option value="" disabled>Choose someone...</option>
                    <option value={user?.userId}>Myself (Personal Challenge)</option>
                    {friends.map(f => (
                      <option key={f._id} value={f._id}>{f.name}</option>
                    ))}
                  </select>
                </div>
                {selectedFriend !== user?.userId && (
                  <div>
                    <label className="block font-label-lg font-bold text-on-surface mb-1">Challenge Mode</label>
                    <select value={challengeType} onChange={(e) => setChallengeType(e.target.value)} className="w-full bg-surface-container border border-outline/30 rounded-lg px-3 py-2 text-on-surface font-body-md focus:outline-none focus:border-primary">
                      <option value="mutual">Mutual (Both of you do it)</option>
                      <option value="challenge">Solo Challenge (Only they do it)</option>
                    </select>
                  </div>
                )}
                <div className="bg-surface-container-lowest p-3 rounded-lg border border-outline-variant/30 mt-4">
                  <h4 className="font-label-lg font-bold text-on-surface mb-2">Challenge Details</h4>
                  <p className="text-sm text-on-surface-variant mb-1">Duration: {selectedTemplate.durationDays} Days</p>
                  <ul className="text-sm text-on-surface-variant space-y-1 pl-4 list-disc">
                    {selectedTemplate.tasks.map((t, i) => (
                      <li key={i}>{t.title} {t.isDaily && <span className="font-bold text-secondary text-[10px] uppercase ml-1">Daily</span>}</li>
                    ))}
                  </ul>
                </div>
              </form>
            </div>
            <div className="p-4 border-t border-on-surface/10 bg-surface-container flex justify-end gap-3">
              <button type="button" onClick={() => setShowTemplateModal(false)} className="px-4 py-2 rounded-xl font-label-lg font-bold text-on-surface-variant hover:bg-on-surface/5">Cancel</button>
              <button form="template-form" type="submit" disabled={submittingTemplate || !selectedFriend} className="px-5 py-2 rounded-xl font-label-lg font-bold bg-primary text-on-primary hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2">
                {submittingTemplate ? 'Starting...' : 'Start Challenge'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
