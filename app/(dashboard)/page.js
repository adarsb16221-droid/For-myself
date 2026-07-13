'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import TaskCard from '@/components/TaskCard';
import Pomodoro from '@/components/Pomodoro';

export default function Home() {
  const [tasks, setTasks] = useState([]);
  const [taskInput, setTaskInput] = useState('');
  const [taskCategory, setTaskCategory] = useState('Work');


  async function fetchTasks() {
    try {
      const res = await fetch('/api/tasks');
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
      }
    } catch (e) {
      console.error('Failed to fetch tasks', e);
    }
  }

  const addTask = async (e) => {
    e.preventDefault();
    if (!taskInput.trim()) return;
    
    const newTask = {
      text: taskInput,
      category: taskCategory,
      priority: 'medium',
      isRegular: false
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
        setTaskInput('');
      }
    } catch(e) {
      console.error(e);
    }
  };

  const toggleTask = async (task) => {
    const updated = { ...task, completed: !task.completed, completedAt: !task.completed ? new Date().toISOString() : null };
    try {
      await fetch('/api/tasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
      setTasks(tasks.map(t => t._id === task._id ? updated : t));
    } catch(e) { console.error(e); }
  };

  const deleteTask = async (id) => {
    try {
      await fetch(`/api/tasks?id=${id}`, { method: 'DELETE' });
      setTasks(tasks.filter(t => t._id !== id));
    } catch(e) { console.error(e); }
  };

  const dailyTasks = tasks.filter(t => t.isRegular);
  const oneOffTasks = tasks.filter(t => !t.isRegular);
  const tasksCompleted = tasks.filter(t => t.completed).length;

  useEffect(() => {
    fetchTasks();
  }, []);

  return (
    <>
      <Header title="Orbit" subtitle="Greeting" tasksCompleted={tasksCompleted} />
      
      <main className="px-4 py-6 flex flex-col gap-6 max-w-2xl mx-auto w-full flex-1">
        {/* Task Input Section */}
        <section className="glass-panel p-4 rounded-xl flex flex-col gap-3 shadow-md">
          <form onSubmit={addTask} className="flex flex-col gap-3">
            <div className="flex gap-2 items-center">
              <input 
                className="flex-1 bg-surface-container-high/50 border border-white/10 rounded-lg px-4 py-3 text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-body-sm" 
                placeholder="What needs to be done?" 
                type="text"
                value={taskInput}
                onChange={(e) => setTaskInput(e.target.value)}
              />
            </div>
            <div className="flex justify-between items-center">
              <select 
                className="bg-surface-container-high/50 border border-white/10 rounded-lg px-3 py-2 text-on-surface text-sm focus:outline-none focus:border-primary"
                value={taskCategory}
                onChange={(e) => setTaskCategory(e.target.value)}
              >
                <option value="Work">Work</option>
                <option value="Personal">Personal</option>
                <option value="Health">Health</option>
                <option value="General">General</option>
              </select>
              <button 
                type="submit"
                className="bg-primary text-on-primary px-6 py-2 rounded-lg font-title-sm text-[16px] font-semibold hover:scale-105 transition-transform shadow-[0_0_15px_rgba(192,193,255,0.3)]"
              >
                Add Task
              </button>
            </div>
          </form>
        </section>

        {/* Daily Habits */}
        <section>
          <h3 className="font-title-sm text-[18px] font-semibold mb-3 flex items-center gap-2 text-primary-fixed-dim">
            <span className="material-symbols-outlined">routine</span> Daily Habits
          </h3>
          <div className="flex flex-col gap-2">
            {dailyTasks.length === 0 ? (
              <p className="text-on-surface-variant text-sm italic opacity-70">No daily habits yet.</p>
            ) : (
              dailyTasks.map(task => (
                <TaskCard 
                  key={task._id} 
                  task={task} 
                  onToggle={toggleTask} 
                  onDelete={deleteTask} 
                />
              ))
            )}
          </div>
        </section>

        {/* One-off Tasks */}
        <section>
          <h3 className="font-title-sm text-[18px] font-semibold mb-3 flex items-center gap-2 text-primary-fixed-dim">
            <span className="material-symbols-outlined">checklist</span> Focus Tasks
          </h3>
          <div className="flex flex-col gap-3">
            {oneOffTasks.length === 0 ? (
              <p className="text-on-surface-variant text-sm italic opacity-70">No tasks remaining.</p>
            ) : (
              oneOffTasks.map(task => (
                <TaskCard 
                  key={task._id} 
                  task={task} 
                  onToggle={toggleTask} 
                  onDelete={deleteTask} 
                />
              ))
            )}
          </div>
        </section>

        {/* Pomodoro Widget */}
        <Pomodoro />
      </main>
    </>
  );
}
