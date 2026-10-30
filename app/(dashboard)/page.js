'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import TaskCard from '@/components/TaskCard';
import TaskSection from '@/components/TaskSection';
import Pomodoro from '@/components/Pomodoro';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { useAuth } from '@/hooks/useAuth';

const HABIT_CATEGORIES = ['Health', 'Wealth', 'Knowledge'];
const FOCUS_CATEGORIES = ['Work', 'Personal', 'General', 'Health', 'Wealth', 'Knowledge'];
const GOAL_CATEGORIES = ['Personal', 'Work', 'Health', 'Wealth', 'Knowledge'];

export default function Home() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);
  const [processingTasks, setProcessingTasks] = useState(new Set());
  
  const [schedule, setSchedule] = useState([]);
  
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

          if (task.isRegular && task.subtasksResetAt !== todayDateStr) {
            const completedToday = updatedTask.completed && updatedTask.completedAt?.split('T')[0] === todayDateStr;
            if (!completedToday) {
              updatedTask.subtasks = (task.subtasks || []).map(st => ({ ...st, completed: false }));
            }
            updatedTask.subtasksResetAt = todayDateStr;
            changed = true;
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



  const addTask = async (type, { text, category, linkedGoalId }) => {
    const newTask = {
      text,
      category,
      priority: 'medium',
      isRegular: type === 'habit',
      isGoal: type === 'goal',
      linkedGoalId: type === 'focus' ? linkedGoalId : null
    };

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTask)
      });
      if (res.ok) {
        const createdTask = await res.json();
        setTasks(prevTasks => [createdTask, ...prevTasks]);
        return true;
      }
    } catch(e) {
      console.error(e);
    }
    return false;
  };

  const toggleTask = async (task) => {
    if (!task.isGoal && task.subtasks?.length > 0) return;

    setProcessingTasks(prev => new Set(prev).add(task._id));
    const isNowCompleted = !task.completed;
    
    const updated = { 
      ...task, 
      completed: isNowCompleted, 
      completedAt: isNowCompleted ? new Date().toISOString() : null
    };
    
    try {
      const res = await fetch('/api/tasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
      if (!res.ok) return false;
      setTasks(prevTasks => prevTasks.map(t => t._id === task._id ? updated : t));
      return true;
    } catch(e) { 
      console.error(e); 
      return false;
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
      return res.ok;
    } catch (e) {
      console.error('Failed to toggle challenge task', e);
      return false;
    }
  };

  const tasksCompleted = completedTasks.length;
  const habitsTotal = tasks.filter(t => t.isRegular).length;
  const habitsDone = habitsTotal - dailyTasks.length;

  const renderTask = (task) => (
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
  );

  const renderChallengeTask = (task) => (
    <TaskCard
      key={task._id}
      task={task}
      onToggle={() => toggleChallengeTask(task)}
      onDelete={() => {}}
      onUpdate={() => {}}
      onMove={() => {}}
      isLoading={false}
    />
  );

  const actionButton = (
    <Button variant="secondary" size="sm" onClick={() => setShowDoneTasks(true)}>
      Done{tasksCompleted > 0 ? ` (${tasksCompleted})` : ''}
    </Button>
  );

  return (
    <>
      <Header title="Dashboard" subtitle="Greeting" currentScheduleBlock={currentBlock} actionButton={actionButton} />

      <main className="mx-auto flex w-full max-w-[1200px] flex-1 flex-col gap-8 px-4 py-6 md:px-6">

        {!isLoadingTasks && habitsTotal > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-sm text-on-surface-variant">
              {habitsDone === habitsTotal
                ? `All ${habitsTotal} habits done today. Nice work.`
                : `${habitsDone} of ${habitsTotal} habits done today`}
            </p>
            <div className="h-1.5 w-full max-w-sm overflow-hidden rounded-full bg-surface-container-high">
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-500"
                style={{ width: `${Math.round((habitsDone / habitsTotal) * 100)}%` }}
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          <TaskSection
            title="Challenges"
            tasks={challengeTasks}
            isLoading={isLoadingTasks}
            emptyText="No open challenges. Challenge a friend from the Challenges page."
            renderTask={renderChallengeTask}
          />
          <TaskSection
            title="Daily habits"
            tasks={dailyTasks}
            isLoading={isLoadingTasks}
            emptyText={habitsTotal > 0 ? 'Every habit is done for today.' : 'Add a habit you want to do every day.'}
            renderTask={renderTask}
            addForm={{ placeholder: 'e.g. Read 20 pages', categories: HABIT_CATEGORIES, onAdd: values => addTask('habit', values) }}
          />
          <TaskSection
            title="Focus tasks"
            tasks={oneOffTasks}
            isLoading={isLoadingTasks}
            emptyText="Nothing left to do. Add what matters most today."
            renderTask={renderTask}
            addForm={{ placeholder: 'e.g. Finish the project report', categories: FOCUS_CATEGORIES, goals: goalTasks, onAdd: values => addTask('focus', values) }}
          />
          <TaskSection
            title="Long-term goals"
            tasks={goalTasks}
            isLoading={isLoadingTasks}
            emptyText="Set a goal to work towards over the next few months."
            renderTask={renderTask}
            addForm={{ placeholder: 'e.g. Run a half marathon', categories: GOAL_CATEGORIES, onAdd: values => addTask('goal', values) }}
          />
        </div>

        <Pomodoro />
      </main>

      {showDoneTasks && (
        <Modal title="Done tasks" onClose={() => setShowDoneTasks(false)}>
          {completedTasks.length === 0 ? (
            <p className="py-10 text-center text-sm text-on-surface-variant">Tasks you finish will show up here.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-outline-variant">
              {completedTasks.map(task => (
                <li key={task._id} className="flex items-center justify-between gap-3 py-3">
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <span className="truncate text-sm text-on-surface-variant line-through">{task.text}</span>
                    <span className="text-xs text-on-surface-variant/80">{task.category}</span>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => toggleTask(task)}
                    disabled={processingTasks.has(task._id)}
                  >
                    {processingTasks.has(task._id) ? 'Undoing…' : 'Undo'}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </Modal>
      )}
    </>
  );
}
