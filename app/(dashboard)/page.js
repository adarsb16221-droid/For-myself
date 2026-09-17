'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import TaskCard from '@/components/TaskCard';
import Pomodoro from '@/components/Pomodoro';
import Spinner from '@/components/Spinner';
import { useAuth } from '@/hooks/useAuth';

export default function Home() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);
  const [processingTasks, setProcessingTasks] = useState(new Set());
  
  const [schedule, setSchedule] = useState([]);
  
  // Habit Add State
  const [showAddHabit, setShowAddHabit] = useState(false);
  const [habitInput, setHabitInput] = useState('');
  const [habitCategory, setHabitCategory] = useState('Health');

  // Focus Task Add State
  const [showAddFocus, setShowAddFocus] = useState(false);
  const [focusInput, setFocusInput] = useState('');
  const [focusCategory, setFocusCategory] = useState('Work');
  const [focusLinkedGoal, setFocusLinkedGoal] = useState('');

  // Goal Add State
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [goalInput, setGoalInput] = useState('');
  const [goalCategory, setGoalCategory] = useState('Personal');

  const [currentBlock, setCurrentBlock] = useState(null);
  
  // Done Tasks Modal State
  const [showDoneTasks, setShowDoneTasks] = useState(false);

  // Drag and Drop State
  const [draggedTaskId, setDraggedTaskId] = useState(null);

  useEffect(() => {
    async function fetchTasks() {
      try {
        const res = await fetch('/api/tasks', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          setTasks(data);
        }
      } catch (e) {
        console.error('Failed to fetch tasks', e);
      } finally {
        setIsLoadingTasks(false);
      }
    }

    async function fetchSchedule() {
      try {
        const res = await fetch('/api/schedule', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          setSchedule(data);
        }
      } catch (e) {
        console.error('Failed to fetch schedule', e);
      }
    }

    async function fetchChallenges() {
      try {
        const res = await fetch('/api/challenges', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          setChallenges(data);
        }
      } catch (e) {
        console.error('Failed to fetch challenges', e);
      }
    }

    fetchTasks();
    fetchSchedule();
    fetchChallenges();

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
  }, []);

  useEffect(() => {
    // Determine current block
    const updateCurrentBlock = () => {
      const now = new Date();
      const h = now.getHours().toString().padStart(2, '0');
      const m = now.getMinutes().toString().padStart(2, '0');
      const currentTime = `${h}:${m}`;
      
      const active = schedule.find(b => currentTime >= b.startTime && currentTime <= b.endTime);
      setCurrentBlock(active || null);
    };
    
    if (schedule.length > 0) {
      updateCurrentBlock();
      const interval = setInterval(updateCurrentBlock, 60000); // Check every minute
      return () => clearInterval(interval);
    }
  }, [schedule]);

  // Daily Rollover Check (resets habits if tab is left open overnight)
  useEffect(() => {
    const checkRollover = () => {
      const todayDateStr = new Date().toISOString().split('T')[0];
      setTasks(prevTasks => {
        let hasChanges = false;
        const newTasks = prevTasks.map(task => {
          let updatedTask = { ...task };
          let changed = false;

          if (task.isRegular && task.completed && task.completedAt) {
            const completedDateStr = task.completedAt.split('T')[0];
            if (completedDateStr !== todayDateStr) {
              changed = true;
              updatedTask.completed = false;
              updatedTask.completedAt = null;
            }
          }
          
          if (task.isGoal && !task.completed) {
            if (task.subtasksResetAt !== todayDateStr) {
              changed = true;
              updatedTask.subtasks = (task.subtasks || []).map(st => ({ ...st, completed: false }));
              updatedTask.subtasksResetAt = todayDateStr;
            }
          }

          if (changed) {
            hasChanges = true;
            return updatedTask;
          }
          return task;
        });
        return hasChanges ? newTasks : prevTasks;
      });
    };

    const interval = setInterval(checkRollover, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);



  const addTask = async (e, type) => {
    e.preventDefault();
    let input = focusInput;
    let category = focusCategory;
    let isRegular = false;
    let isGoal = false;
    
    if (type === 'habit') {
      input = habitInput;
      category = habitCategory;
      isRegular = true;
    } else if (type === 'goal') {
      input = goalInput;
      category = goalCategory;
      isGoal = true;
    }
    
    if (!input.trim()) return;
    
    const newTask = {
      text: input,
      category: category,
      priority: 'medium',
      isRegular: isRegular,
      isGoal: isGoal,
      linkedGoalId: type === 'focus' && focusLinkedGoal ? focusLinkedGoal : null
    };

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTask)
      });
      if (res.ok) {
        const createdTask = await res.json();
        setTasks([createdTask, ...tasks]);
        if (type === 'habit') {
          setHabitInput('');
          setShowAddHabit(false);
        } else if (type === 'goal') {
          setGoalInput('');
          setShowAddGoal(false);
        } else {
          setFocusInput('');
          setFocusLinkedGoal('');
          setShowAddFocus(false);
        }
      }
    } catch(e) {
      console.error(e);
    }
  };

  const toggleTask = async (task) => {
    setProcessingTasks(prev => new Set(prev).add(task._id));
    const isNowCompleted = !task.completed;
    
    const updatedSubtasks = task.isGoal 
      ? task.subtasks 
      : (task.subtasks || []).map(st => ({ ...st, completed: isNowCompleted }));
    
    const updated = { 
      ...task, 
      completed: isNowCompleted, 
      completedAt: isNowCompleted ? new Date().toISOString() : null,
      subtasks: updatedSubtasks
    };
    
    try {
      await fetch('/api/tasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
      setTasks(tasks.map(t => t._id === task._id ? updated : t));
    } catch(e) { 
      console.error(e); 
    } finally {
      setProcessingTasks(prev => {
        const next = new Set(prev);
        next.delete(task._id);
        return next;
      });
    }
  };

  const deleteTask = async (id) => {
    setProcessingTasks(prev => new Set(prev).add(id));
    try {
      await fetch(`/api/tasks?id=${id}`, { method: 'DELETE' });
      setTasks(tasks.filter(t => t._id !== id));
    } catch(e) { 
      console.error(e); 
    } finally {
      setProcessingTasks(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const updateTask = async (task, updates) => {
    setProcessingTasks(prev => new Set(prev).add(task._id));
    
    const updated = { ...task, ...updates };
    
    if (updates.subtasks && updates.subtasks.length > 0) {
      if (!task.isGoal) {
        const allCompleted = updates.subtasks.every(st => st.completed);
        updated.completed = allCompleted;
        if (allCompleted && !task.completed) {
          updated.completedAt = new Date().toISOString();
        } else if (!allCompleted) {
          updated.completedAt = null;
        }
      }
    }

    try {
      await fetch('/api/tasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
      setTasks(tasks.map(t => t._id === task._id ? updated : t));
    } catch(e) {
      console.error(e);
    } finally {
      setProcessingTasks(prev => {
        const next = new Set(prev);
        next.delete(task._id);
        return next;
      });
    }
  };

  const handleDragStart = (e, task) => {
    setDraggedTaskId(task._id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e, targetTask) => {
    e.preventDefault();
    if (!draggedTaskId || draggedTaskId === targetTask._id) return;
    
    const taskToMove = tasks.find(t => t._id === draggedTaskId);
    if (!taskToMove) return;

    const isSameContext = (taskToMove.isRegular === targetTask.isRegular) && (taskToMove.isGoal === targetTask.isGoal);
    if (!isSameContext) return; 
    
    let contextTasks = oneOffTasks;
    if (taskToMove.isRegular) contextTasks = dailyTasks;
    else if (taskToMove.isGoal) contextTasks = goalTasks;
    
    const targetIndex = contextTasks.findIndex(t => t._id === targetTask._id);
    if (targetIndex === -1) return;
    
    const nowTime = new Date().getTime();
    let newOrder;
    if (targetIndex === 0) {
      newOrder = (contextTasks[0]?.order || nowTime) - 1000;
    } else {
      const prevTask = contextTasks[targetIndex - 1];
      newOrder = ((prevTask.order || nowTime) + (targetTask.order || nowTime)) / 2;
    }
    
    const updated = { ...taskToMove, order: newOrder };
    
    const newTasks = tasks.map(t => t._id === taskToMove._id ? updated : t)
      .sort((a, b) => {
        const orderA = a.order || nowTime;
        const orderB = b.order || nowTime;
        if (orderA !== orderB) return orderA - orderB;
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
    setTasks(newTasks);
    setDraggedTaskId(null);

    try {
      await fetch('/api/tasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
    } catch(err) {
      console.error(err);
    }
  };

  const moveTask = async (taskToMove, direction) => {
    let contextTasks = oneOffTasks;
    if (taskToMove.isRegular) contextTasks = dailyTasks;
    else if (taskToMove.isGoal) contextTasks = goalTasks;
    
    const currentIndex = contextTasks.findIndex(t => t._id === taskToMove._id);
    if (currentIndex === -1) return;

    const nowTime = new Date().getTime();
    let newOrder;
    if (direction === 'first') {
      newOrder = (contextTasks[0]?.order || nowTime) - 1000;
    } else if (direction === 'last') {
      newOrder = (contextTasks[contextTasks.length - 1]?.order || nowTime) + 1000;
    } else if (direction === 'up' && currentIndex > 0) {
      const prevTask = contextTasks[currentIndex - 1];
      const prevPrevTask = contextTasks[currentIndex - 2];
      if (prevPrevTask) {
        newOrder = ((prevTask.order || nowTime) + (prevPrevTask.order || nowTime)) / 2;
      } else {
        newOrder = (prevTask.order || nowTime) - 1000;
      }
    } else if (direction === 'down' && currentIndex < contextTasks.length - 1) {
      const nextTask = contextTasks[currentIndex + 1];
      const nextNextTask = contextTasks[currentIndex + 2];
      if (nextNextTask) {
        newOrder = ((nextTask.order || nowTime) + (nextNextTask.order || nowTime)) / 2;
      } else {
        newOrder = (nextTask.order || nowTime) + 1000;
      }
    } else {
      return; 
    }

    const updated = { ...taskToMove, order: newOrder };
    
    // Optimistic update
    const newTasks = tasks.map(t => t._id === taskToMove._id ? updated : t)
      .sort((a, b) => {
        const orderA = a.order || nowTime;
        const orderB = b.order || nowTime;
        if (orderA !== orderB) return orderA - orderB;
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
    setTasks(newTasks);

    try {
      await fetch('/api/tasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
    } catch(e) {
      console.error(e);
    }
  };

  // Utility to format 24h time to 12h time for current block display
  const formatTime = (time24) => {
    const [h, m] = time24.split(':');
    let hours = parseInt(h, 10);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${hours}:${m} ${ampm}`;
  };

  const dailyTasks = tasks.filter(t => t.isRegular && !t.completed);
  const oneOffTasks = tasks.filter(t => !t.isRegular && !t.isGoal && !t.completed);
  const goalTasks = tasks.filter(t => t.isGoal && !t.completed);
  const completedTasks = tasks.filter(t => t.completed);
  
  const activeChallenges = challenges.filter(c => c.status === 'accepted');
  const challengeTasks = [];
  const todayStr = new Date().toISOString().split('T')[0];

  activeChallenges.forEach(c => {
    const isCreator = c.creator._id === user?.userId;
    const isSelf = c.creator._id === c.recipient._id;
    const isMutual = c.type === 'mutual';

    c.tasks.forEach(t => {
      let isCompleted = false;
      if (isMutual && !isSelf) {
        if (t.isDaily) {
          isCompleted = isCreator ? t.creatorHistory?.includes(todayStr) : t.recipientHistory?.includes(todayStr);
        } else {
          isCompleted = isCreator ? t.creatorCompleted : t.recipientCompleted;
        }
      } else {
        if (!isMutual && isCreator && !isSelf) return; // sent solo to someone else
        if (t.isDaily) {
          isCompleted = t.recipientHistory?.includes(todayStr);
        } else {
          isCompleted = t.recipientCompleted;
        }
      }

      if (!isCompleted) {
        challengeTasks.push({
          _id: t._id,
          challengeId: c._id,
          text: t.title,
          category: 'Challenge',
          isRegular: !!t.isDaily,
          challengeName: isSelf ? 'My Challenge' : (isMutual ? `Mutual Challenge` : 'Solo Challenge'),
        });
      }
    });
  });

  const toggleChallengeTask = async (task) => {
    try {
      const res = await fetch(`/api/challenges/${task.challengeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId: task._id, completed: true })
      });
      if (res.ok) {
        // Refetch challenges to sync state
        const cRes = await fetch('/api/challenges', { cache: 'no-store' });
        if (cRes.ok) setChallenges(await cRes.json());
      }
    } catch (e) {
      console.error('Failed to toggle challenge task', e);
    }
  };

  const tasksCompleted = completedTasks.length;

  const actionButton = (
    <button 
      onClick={() => setShowDoneTasks(true)}
      className="px-4 py-2 rounded-full flex items-center justify-center bg-primary text-on-primary hover:bg-primary/90 transition-all text-xs font-semibold shadow-[0_0_15px_rgba(70,72,212,0.3)] hover:scale-105 gap-1.5"
    >
      <span className="material-symbols-outlined text-[16px]">task_alt</span>
      Done Tasks
    </button>
  );

  return (
    <>
      <Header title="Dashboard" subtitle="Greeting" tasksCompleted={tasksCompleted} currentScheduleBlock={currentBlock} actionButton={actionButton} />
      
      <main className="px-4 py-6 flex flex-col gap-6 max-w-[1200px] mx-auto w-full flex-1">

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Challenge Tasks */}
          <section className="col-span-1 flex flex-col">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-title-sm text-[16px] font-semibold flex items-center gap-2 text-primary-fixed-dim">
                <span className="material-symbols-outlined text-[18px]">social_leaderboard</span> Challenge Tasks
              </h3>
            </div>

            <div className="flex flex-col gap-2 mt-[10px]">
              {isLoadingTasks ? (
                <div className="py-4 col-span-full flex justify-center"><Spinner size="md" /></div>
              ) : challengeTasks.length === 0 ? (
                <p className="text-on-surface-variant text-sm italic opacity-70 col-span-full">No pending challenge tasks.</p>
              ) : (
                challengeTasks.map(task => (
                  <TaskCard 
                    key={task._id} 
                    task={task} 
                    onToggle={() => toggleChallengeTask(task)} 
                    onDelete={() => {}} 
                    onUpdate={() => {}}
                    onMove={() => {}}
                    isLoading={false}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                  />
                ))
              )}
            </div>
          </section>

          {/* Daily Habits (Smaller Area) */}
          <section className="col-span-1 flex flex-col">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-title-sm text-[16px] font-semibold flex items-center gap-2 text-primary-fixed-dim">
                <span className="material-symbols-outlined text-[18px]">routine</span> Daily Habits
              </h3>
              <button 
                onClick={() => setShowAddHabit(!showAddHabit)}
                className="text-primary text-xs font-medium hover:underline flex items-center gap-1 transition-all"
              >
                <span className="material-symbols-outlined text-[16px]">{showAddHabit ? 'close' : 'add'}</span> 
                {showAddHabit ? 'Cancel' : 'Add'}
              </button>
            </div>
            
            {showAddHabit && (
              <form onSubmit={(e) => addTask(e, 'habit')} className="mb-3 glass-panel p-2.5 rounded-lg flex flex-col gap-2 shadow-md animate-in slide-in-from-top-2">
                <input 
                  className="w-full bg-surface-container-high/50 border border-white/10 rounded-lg px-2.5 py-1.5 text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary text-xs transition-all" 
                  placeholder="New habit..." 
                  type="text"
                  autoFocus
                  value={habitInput}
                  onChange={(e) => setHabitInput(e.target.value)}
                />
                <div className="flex justify-between items-center">
                  <select 
                    className="bg-surface-container-high/50 border border-white/10 rounded-lg px-1.5 py-1 text-on-surface text-[11px] focus:outline-none focus:border-primary cursor-pointer transition-all"
                    value={habitCategory}
                    onChange={(e) => setHabitCategory(e.target.value)}
                  >
                    <option value="Health">Health</option>
                    <option value="Wealth">Wealth</option>
                    <option value="Knowledge">Knowledge</option>
                  </select>
                  <button type="submit" className="bg-primary text-on-primary px-3 py-1 rounded-lg text-xs font-semibold hover:scale-105 transition-transform">
                    Add
                  </button>
                </div>
              </form>
            )}

            <div className="flex flex-col gap-2 mt-[10px]">
              {isLoadingTasks ? (
                <div className="py-4 col-span-full flex justify-center"><Spinner size="md" /></div>
              ) : dailyTasks.length === 0 ? (
                <p className="text-on-surface-variant text-sm italic opacity-70 col-span-full">No daily habits yet.</p>
              ) : (
                dailyTasks.map(task => (
                  <TaskCard 
                    key={task._id} 
                    task={task} 
                    onToggle={toggleTask} 
                    onDelete={deleteTask} 
                    onUpdate={updateTask}
                    onMove={moveTask}
                    isLoading={processingTasks.has(task._id)}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                  />
                ))
              )}
            </div>
          </section>

          {/* One-off Tasks (Focus Tasks) */}
          <section className="col-span-1 flex flex-col">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-title-sm text-[16px] font-semibold flex items-center gap-2 text-primary-fixed-dim">
                <span className="material-symbols-outlined text-[18px]">checklist</span> Focus Tasks
              </h3>
              <button 
                onClick={() => setShowAddFocus(!showAddFocus)}
                className="text-primary text-xs font-medium hover:underline flex items-center gap-1 transition-all"
              >
                <span className="material-symbols-outlined text-[16px]">{showAddFocus ? 'close' : 'add'}</span> 
                {showAddFocus ? 'Cancel' : 'Add'}
              </button>
            </div>

            {showAddFocus && (
              <form onSubmit={(e) => addTask(e, 'focus')} className="mb-3 glass-panel p-2.5 rounded-lg flex flex-col gap-2 shadow-md animate-in slide-in-from-top-2">
                <input 
                  className="w-full bg-surface-container-high/50 border border-white/10 rounded-lg px-2.5 py-1.5 text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary text-xs transition-all" 
                  placeholder="New focus task..." 
                  type="text"
                  autoFocus
                  value={focusInput}
                  onChange={(e) => setFocusInput(e.target.value)}
                />
                <div className="flex justify-between items-center flex-wrap gap-2">
                  <div className="flex gap-2">
                    <select 
                      className="bg-surface-container-high/50 border border-white/10 rounded-lg px-1.5 py-1 text-on-surface text-[11px] focus:outline-none focus:border-primary cursor-pointer transition-all"
                      value={focusCategory}
                      onChange={(e) => setFocusCategory(e.target.value)}
                    >
                      <option value="Work">Work</option>
                      <option value="Personal">Personal</option>
                      <option value="General">General</option>
                      <option value="Health">Health</option>
                      <option value="Wealth">Wealth</option>
                      <option value="Knowledge">Knowledge</option>
                    </select>
                    <select
                      className="bg-surface-container-high/50 border border-white/10 rounded-lg px-1.5 py-1 text-on-surface text-[11px] focus:outline-none focus:border-primary cursor-pointer transition-all max-w-[90px] truncate"
                      value={focusLinkedGoal}
                      onChange={(e) => setFocusLinkedGoal(e.target.value)}
                    >
                      <option value="">No Goal</option>
                      {goalTasks.map(g => (
                        <option key={g._id} value={g._id}>{g.text}</option>
                      ))}
                    </select>
                  </div>
                  <button type="submit" className="bg-primary text-on-primary px-3 py-1 rounded-lg text-xs font-semibold hover:scale-105 transition-transform">
                    Add
                  </button>
                </div>
              </form>
            )}

            <div className="flex flex-col gap-2 mt-[10px]">
              {isLoadingTasks ? (
                <div className="py-4 col-span-full flex justify-center"><Spinner size="md" /></div>
              ) : oneOffTasks.length === 0 ? (
                <p className="text-on-surface-variant text-sm italic opacity-70 col-span-full">No tasks remaining.</p>
              ) : (
                oneOffTasks.map(task => (
                  <TaskCard 
                    key={task._id} 
                    task={task} 
                    onToggle={toggleTask} 
                    onDelete={deleteTask} 
                    onUpdate={updateTask}
                    onMove={moveTask}
                    isLoading={processingTasks.has(task._id)}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                  />
                ))
              )}
            </div>
          </section>

          {/* Long Term Goals */}
          <section className="col-span-1 flex flex-col">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-title-sm text-[16px] font-semibold flex items-center gap-2 text-primary-fixed-dim">
                <span className="material-symbols-outlined text-[18px]">flag</span> Long Term Goals
              </h3>
              <button 
                onClick={() => setShowAddGoal(!showAddGoal)}
                className="text-primary text-xs font-medium hover:underline flex items-center gap-1 transition-all"
              >
                <span className="material-symbols-outlined text-[16px]">{showAddGoal ? 'close' : 'add'}</span> 
                {showAddGoal ? 'Cancel' : 'Add'}
              </button>
            </div>

            {showAddGoal && (
              <form onSubmit={(e) => addTask(e, 'goal')} className="mb-3 glass-panel p-2.5 rounded-lg flex flex-col gap-2 shadow-md animate-in slide-in-from-top-2">
                <input 
                  className="w-full bg-surface-container-high/50 border border-white/10 rounded-lg px-2.5 py-1.5 text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary text-xs transition-all" 
                  placeholder="New goal..." 
                  type="text"
                  autoFocus
                  value={goalInput}
                  onChange={(e) => setGoalInput(e.target.value)}
                />
                <div className="flex justify-between items-center">
                  <select 
                    className="bg-surface-container-high/50 border border-white/10 rounded-lg px-1.5 py-1 text-on-surface text-[11px] focus:outline-none focus:border-primary cursor-pointer transition-all"
                    value={goalCategory}
                    onChange={(e) => setGoalCategory(e.target.value)}
                  >
                    <option value="Personal">Personal</option>
                    <option value="Work">Work</option>
                    <option value="Health">Health</option>
                    <option value="Wealth">Wealth</option>
                    <option value="Knowledge">Knowledge</option>
                  </select>
                  <button type="submit" className="bg-primary text-on-primary px-3 py-1 rounded-lg text-xs font-semibold hover:scale-105 transition-transform">
                    Add
                  </button>
                </div>
              </form>
            )}

            <div className="flex flex-col gap-2 mt-[10px]">
              {isLoadingTasks ? (
                <div className="py-4 col-span-full flex justify-center"><Spinner size="md" /></div>
              ) : goalTasks.length === 0 ? (
                <p className="text-on-surface-variant text-sm italic opacity-70 col-span-full">No goals yet.</p>
              ) : (
                goalTasks.map(task => (
                  <TaskCard 
                    key={task._id} 
                    task={task} 
                    onToggle={toggleTask} 
                    onDelete={deleteTask} 
                    onUpdate={updateTask}
                    onMove={moveTask}
                    isLoading={processingTasks.has(task._id)}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                  />
                ))
              )}
            </div>
          </section>
        </div>

        {/* Pomodoro Widget */}
        <Pomodoro />
      </main>

      {/* Done Tasks Modal */}
      {showDoneTasks && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-surface-container rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[80vh] overflow-hidden border border-white/10 animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-white/5 flex justify-between items-center bg-surface/50 backdrop-blur-md">
              <h2 className="text-xl font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[24px]">task_alt</span> Done Tasks
              </h2>
              <button onClick={() => setShowDoneTasks(false)} className="p-2 rounded-full hover:bg-white/10 text-on-surface-variant transition-colors flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <div className="p-5 overflow-y-auto flex-1 flex flex-col gap-3 custom-scrollbar">
              {completedTasks.length === 0 ? (
                <div className="text-center py-12 opacity-70">
                  <span className="material-symbols-outlined text-5xl mb-3 block text-on-surface-variant">inbox</span>
                  <p className="text-on-surface-variant">No completed tasks yet.</p>
                </div>
              ) : (
                completedTasks.map(task => (
                  <div key={task._id} className="p-3 bg-surface/80 rounded-xl border border-white/5 flex justify-between items-center opacity-80 hover:opacity-100 hover:border-white/20 transition-all group">
                    <div className="flex flex-col gap-0.5">
                      <span className="line-through text-sm font-medium text-on-surface-variant">{task.text}</span>
                      <span className="text-[10px] uppercase tracking-wider text-primary/70">{task.category}</span>
                    </div>
                    <button 
                      onClick={() => toggleTask(task)} 
                      disabled={processingTasks.has(task._id)}
                      className="text-xs font-semibold text-primary hover:text-on-primary hover:bg-primary px-3 py-1.5 rounded-lg bg-primary/10 transition-colors disabled:opacity-50"
                    >
                      {processingTasks.has(task._id) ? '...' : 'Undo'}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
