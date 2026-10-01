'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Spinner from '@/components/Spinner';

export default function CommunityPage() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [activeTab, setActiveTab] = useState('friends'); // 'friends' or 'discover'
  const [challengeModalUser, setChallengeModalUser] = useState(null);

  // Challenge Modal State
  const [challengeType, setChallengeType] = useState('mutual');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [tasks, setTasks] = useState([{ title: '' }]);
  const [submittingChallenge, setSubmittingChallenge] = useState(false);
  const [challengeNote, setChallengeNote] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers(searchQuery);
    }, 300); // 300ms debounce
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchUsers = async (search = '') => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/users${search ? `?search=${encodeURIComponent(search)}` : ''}`);
      if (!res.ok) throw new Error('Failed to fetch users');
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = async (friendId, userState) => {
    try {
      setUsers(users.map(u => {
        if (u._id === friendId) {
          if (u.isFriend) return { ...u, isFriend: false, hasRequested: false, isRequesting: false };
          if (u.isRequesting) return { ...u, isFriend: true, isRequesting: false, hasRequested: false };
          if (u.hasRequested) return { ...u, hasRequested: false };
          return { ...u, hasRequested: true };
        }
        return u;
      }));

      const res = await fetch('/api/users/friend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friendId })
      });

      if (!res.ok) throw new Error('Failed to process friend action');
      const data = await res.json();
      
      setUsers(users.map(u => {
        if (u._id === friendId) return { ...u, isFriend: data.isFriend, hasRequested: data.hasRequested || false };
        return u;
      }));
    } catch (err) {
      console.error(err);
      fetchUsers();
    }
  };

  const getButtonProps = (user) => {
    if (user.isFriend) {
      return { text: 'Remove', icon: 'person_remove', className: 'bg-error/10 text-error hover:bg-error/20 border border-error/20' };
    }
    if (user.isRequesting) {
      return { text: 'Accept Request', icon: 'person_add', className: 'bg-primary text-on-primary hover:bg-primary/90 shadow-sm hover:shadow' };
    }
    if (user.hasRequested) {
      return { text: 'Requested', icon: 'pending', className: 'bg-surface-variant text-on-surface-variant border border-outline-variant/50' };
    }
    return { text: 'Add Friend', icon: 'person_add', className: 'bg-primary text-on-primary hover:bg-primary/90 shadow-sm hover:shadow' };
  };

  const handleCreateChallenge = async (e) => {
    e.preventDefault();
    if (!challengeModalUser || !startDate || !endDate || tasks.some(t => !t.title.trim())) return;
    
    setSubmittingChallenge(true);
    try {
      const res = await fetch('/api/challenges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientId: challengeModalUser._id,
          type: challengeType,
          startDate,
          endDate,
          tasks: tasks.filter(t => t.title.trim() !== ''),
          note: challengeNote,
        })
      });
      if (!res.ok) throw new Error('Failed to create challenge');
      setChallengeModalUser(null);
      alert('Challenge sent successfully!');
    } catch (err) {
      console.error(err);
      alert('Error creating challenge');
    } finally {
      setSubmittingChallenge(false);
    }
  };

  const addTaskField = () => setTasks([...tasks, { title: '' }]);
  const updateTaskField = (index, value) => {
    const newTasks = [...tasks];
    newTasks[index].title = value;
    setTasks(newTasks);
  };
  const removeTaskField = (index) => {
    if (tasks.length === 1) return;
    setTasks(tasks.filter((_, i) => i !== index));
  };

  const friendsList = users.filter(u => u.isFriend);
  const discoverList = users.filter(u => !u.isFriend);
  const displayList = activeTab === 'friends' ? friendsList : discoverList;

  return (
    <div className="flex flex-col h-full bg-surface relative">
      <div className="sticky top-0 z-40 bg-surface/80 backdrop-blur-md">
        <Header title="Community" />
      </div>

      <main className="flex-1 overflow-y-auto p-4 pb-24 md:p-8 space-y-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-headline-md font-bold text-on-surface mb-2">Platform Users</h1>
              <p className="text-on-surface-variant font-body-lg">Connect with others and assign challenges.</p>
            </div>
          </div>

          <div className="flex gap-4 mb-6 border-b border-on-surface/10 pb-2">
            <button 
              onClick={() => setActiveTab('friends')}
              className={`pb-2 px-4 font-title-md font-bold transition-colors border-b-2 ${activeTab === 'friends' ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-on-surface'}`}
            >
              My Friends ({friendsList.length})
            </button>
            <button 
              onClick={() => setActiveTab('discover')}
              className={`pb-2 px-4 font-title-md font-bold transition-colors border-b-2 ${activeTab === 'discover' ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-on-surface'}`}
            >
              Discover
            </button>
          </div>

          {activeTab === 'discover' && (
            <div className="mb-6">
              <div className="relative max-w-md">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
                <input 
                  type="text" 
                  placeholder="Search users by name or email..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-surface-container border border-outline/30 rounded-xl pl-10 pr-4 py-3 text-on-surface font-body-lg focus:outline-none focus:border-primary shadow-sm"
                />
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="flex justify-center items-center h-48"><Spinner /></div>
          ) : error ? (
            <div className="bg-error/10 text-error p-4 rounded-xl border border-error/20">{error}</div>
          ) : displayList.length === 0 ? (
            <div className="bg-surface-container rounded-2xl p-8 text-center border border-outline-variant/30">
              <span className="material-symbols-outlined text-[48px] text-on-surface-variant mb-4">group_off</span>
              <h3 className="font-title-lg font-bold text-on-surface mb-2">
                {activeTab === 'discover' && !searchQuery ? 'Search for people' : 'No users found'}
              </h3>
              <p className="text-on-surface-variant">
                {activeTab === 'friends' 
                  ? "You haven't added any friends yet. Check the Discover tab to find people!" 
                  : !searchQuery 
                    ? "Type a name or email in the search bar above to discover new friends." 
                    : "No users matched your search query."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayList.map(user => {
                const btnProps = getButtonProps(user);
                return (
                  <div key={user._id} className="bg-surface-container rounded-2xl p-5 border border-outline-variant/30 flex flex-col gap-4 shadow-sm relative">
                    {user.isFriend && (
                      <button
                        onClick={() => handleAction(user._id, user)}
                        className="absolute top-3 left-3 w-8 h-8 flex items-center justify-center rounded-full bg-error/10 text-error hover:bg-error/20 transition-colors"
                        title="Remove Friend"
                      >
                        <span className="material-symbols-outlined text-[18px]" style={{fontVariationSettings: "'FILL' 1"}}>person_remove</span>
                      </button>
                    )}
                    <div className={`flex items-center gap-4 ${user.isFriend ? 'ml-8' : ''}`}>
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl uppercase border border-primary/20">
                        {user.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-title-md font-bold text-on-surface truncate">{user.name}</h3>
                        <div className="flex items-center gap-1 text-on-surface-variant text-sm mt-0.5">
                          <span className="material-symbols-outlined text-[16px] text-tertiary">stars</span>
                          <span className="font-medium text-tertiary">{Math.max(0, user.orbitPoints || 0)} pts</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-auto flex flex-col gap-2">
                      {user.isFriend && (
                        <button
                          onClick={() => {
                            setChallengeModalUser(user);
                            setTasks([{ title: '' }]);
                            setStartDate(new Date().toISOString().split('T')[0]);
                            const tmr = new Date();
                            tmr.setDate(tmr.getDate() + 7);
                            setEndDate(tmr.toISOString().split('T')[0]);
                            setChallengeNote('');
                          }}
                          className="w-full py-2.5 rounded-xl font-label-lg font-bold flex items-center justify-center gap-2 transition-colors bg-secondary text-on-secondary hover:bg-secondary/90 shadow-sm"
                        >
                          <span className="material-symbols-outlined text-[20px]">flag</span>
                          Give Challenge
                        </button>
                      )}
                      {!user.isFriend && (
                        <button
                          onClick={() => handleAction(user._id, user)}
                          className={`w-full py-2.5 rounded-xl font-label-lg font-bold flex items-center justify-center gap-2 transition-colors ${btnProps.className}`}
                        >
                          <span className="material-symbols-outlined text-[20px]" style={user.isFriend ? {fontVariationSettings: "'FILL' 1"} : {}}>
                            {btnProps.icon}
                          </span>
                          {btnProps.text}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Challenge Modal */}
      {challengeModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-container-highest/80 backdrop-blur-sm">
          <div className="bg-surface rounded-2xl w-full max-w-md shadow-2xl border border-on-surface/10 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-on-surface/10 flex justify-between items-center bg-surface-container">
              <h2 className="font-title-lg font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">flag</span>
                Challenge {challengeModalUser.name.split(' ')[0]}
              </h2>
              <button onClick={() => setChallengeModalUser(null)} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-on-surface/10">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1">
              <form id="challenge-form" onSubmit={handleCreateChallenge} className="space-y-4">
                <div>
                  <label className="block font-label-lg font-bold text-on-surface mb-1">Type</label>
                  <select value={challengeType} onChange={(e) => setChallengeType(e.target.value)} className="w-full bg-surface-container border border-outline/30 rounded-lg px-3 py-2 text-on-surface font-body-md focus:outline-none focus:border-primary">
                    <option value="mutual">Mutual (Both complete tasks)</option>
                    <option value="challenge">Solo Challenge (Only they complete tasks)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-label-lg font-bold text-on-surface mb-1">Note to Friend</label>
                  <textarea value={challengeNote} onChange={(e) => setChallengeNote(e.target.value)} placeholder="Add an encouraging note..." className="w-full bg-surface-container border border-outline/30 rounded-lg px-3 py-2 text-on-surface font-body-md focus:outline-none focus:border-primary min-h-[80px]"></textarea>
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block font-label-lg font-bold text-on-surface mb-1">Start Date</label>
                    <input type="date" required value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full bg-surface-container border border-outline/30 rounded-lg px-3 py-2 text-on-surface font-body-md focus:outline-none focus:border-primary" />
                  </div>
                  <div className="flex-1">
                    <label className="block font-label-lg font-bold text-on-surface mb-1">End Date</label>
                    <input type="date" required value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full bg-surface-container border border-outline/30 rounded-lg px-3 py-2 text-on-surface font-body-md focus:outline-none focus:border-primary" />
                  </div>
                </div>
                <div>
                  <label className="block font-label-lg font-bold text-on-surface mb-1">Tasks</label>
                  <div className="space-y-2">
                    {tasks.map((task, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <input type="text" required placeholder={`Task ${i + 1}`} value={task.title} onChange={(e) => updateTaskField(i, e.target.value)} className="flex-1 bg-surface-container border border-outline/30 rounded-lg px-3 py-2 text-on-surface font-body-md focus:outline-none focus:border-primary" />
                        {tasks.length > 1 && (
                          <button type="button" onClick={() => removeTaskField(i)} className="text-error/70 hover:text-error p-1"><span className="material-symbols-outlined text-[20px]">remove_circle</span></button>
                        )}
                      </div>
                    ))}
                    <button type="button" onClick={addTaskField} className="text-primary font-label-lg font-bold flex items-center gap-1 mt-2 hover:opacity-80">
                      <span className="material-symbols-outlined text-[18px]">add_circle</span> Add Task
                    </button>
                  </div>
                </div>
              </form>
            </div>
            <div className="p-4 border-t border-on-surface/10 bg-surface-container flex justify-end gap-3">
              <button type="button" onClick={() => setChallengeModalUser(null)} className="px-4 py-2 rounded-xl font-label-lg font-bold text-on-surface-variant hover:bg-on-surface/5">Cancel</button>
              <button form="challenge-form" type="submit" disabled={submittingChallenge} className="px-5 py-2 rounded-xl font-label-lg font-bold bg-primary text-on-primary hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2">
                {submittingChallenge ? 'Sending...' : 'Send Challenge'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
