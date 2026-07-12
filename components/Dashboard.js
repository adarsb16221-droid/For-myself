"use client";
import { useState, useEffect } from 'react';

export default function Dashboard({ tasks, setTasks, fetchTasks, theme, toggleTheme }) {
  const [taskInput, setTaskInput] = useState('');
  const [taskCategory, setTaskCategory] = useState('General');
  const [taskPriority, setTaskPriority] = useState('medium');
  const [taskRegular, setTaskRegular] = useState(false);
  const [filter, setFilter] = useState('all');

  const [timerSeconds, setTimerSeconds] = useState(25 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerMode, setTimerMode] = useState(25);
  
  useEffect(() => {
    let interval;
    if (isTimerRunning && timerSeconds > 0) {
      interval = setInterval(() => setTimerSeconds(s => s - 1), 1000);
    } else if (timerSeconds <= 0 && isTimerRunning) {
      setIsTimerRunning(false);
      playBeep();
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerSeconds]);

  const playBeep = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } catch(e) {}
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const addTask = async (e) => {
    e.preventDefault();
    if (!taskInput.trim()) return;
    
    const newTask = {
      text: taskInput,
      category: taskCategory,
      priority: taskPriority,
      isRegular: taskRegular
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
        setTaskRegular(false);
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

  const filteredTasks = tasks.filter(t => {
    if (filter === 'active') return !t.completed;
    if (filter === 'completed') return t.completed;
    return true;
  });

  const dailyTasks = filteredTasks.filter(t => t.isRegular);
  const oneOffTasks = filteredTasks.filter(t => !t.isRegular);

  const renderTaskList = (list, emptyMessage) => (
    list.length === 0 ? (
      <div className="empty-state">
        <i className="ph ph-list-dashes"></i>
        <p>{emptyMessage}</p>
      </div>
    ) : (
      list.map(task => (
        <div key={task._id} className={`task-item ${task.completed ? 'completed' : ''}`}>
          <div className="task-content">
            <div className="checkbox" onClick={() => toggleTask(task)}>
              <i className="ph ph-check"></i>
            </div>
            <div className="task-text">
              <span className="task-name">{task.text}</span>
              <div className="task-meta">
                {task.isRegular && <span className="badge cat-general"><i className="ph ph-arrows-clockwise" style={{marginRight:'2px'}}></i>Daily</span>}
                <span className={`badge cat-${task.category.toLowerCase()}`}>{task.category}</span>
                <span className={`badge priority-${task.priority}`}>{task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}</span>
              </div>
            </div>
          </div>
          <div className="task-item-actions">
            <button className="task-delete" onClick={() => deleteTask(task._id)}>
              <i className="ph ph-trash"></i>
            </button>
          </div>
        </div>
      ))
    )
  );

  return (
    <div className="dashboard-container page-view active">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>Good <span>{new Date().getHours() < 12 ? 'Morning' : (new Date().getHours() < 17 ? 'Afternoon' : 'Evening')}</span>, User</h1>
          <p>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
        </div>
        <div className="header-stats">
          <div className="stat-badge">
            <i className="ph ph-check-circle"></i>
            <span>{tasks.filter(t => t.completed).length}</span> Completed
          </div>
          <button className="icon-btn" onClick={toggleTheme}>
            <i className={`ph ${theme === 'dark' ? 'ph-sun' : 'ph-moon'}`}></i>
          </button>
        </div>
      </header>

      <main className="dashboard-main">
        <section className="task-section">
          <div className="input-glass-panel">
            <form onSubmit={addTask} className="task-form">
              <div className="input-group">
                <i className="ph ph-plus"></i>
                <input type="text" value={taskInput} onChange={e => setTaskInput(e.target.value)} placeholder="What needs to be done?" required />
              </div>
              <div className="task-actions">
                <label className="custom-checkbox" title="Daily Regular Task">
                  <input type="checkbox" checked={taskRegular} onChange={e => setTaskRegular(e.target.checked)} />
                  <span className="checkbox-box"><i className="ph ph-arrows-clockwise"></i></span>
                </label>
                <select className="custom-select" value={taskCategory} onChange={e => setTaskCategory(e.target.value)}>
                  <option value="General">General</option>
                  <option value="Work">Work</option>
                  <option value="Personal">Personal</option>
                  <option value="Health">Health</option>
                </select>
                <select className="custom-select" value={taskPriority} onChange={e => setTaskPriority(e.target.value)}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
                <button type="submit" className="btn-primary">Add Task</button>
              </div>
            </form>
          </div>

          <div className="task-global-header glass-panel">
            <h2 style={{fontFamily: 'var(--font-heading)', fontSize: '1.2rem'}}>All Tasks</h2>
            <div className="filters">
              <button className={`filter-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>All</button>
              <button className={`filter-btn ${filter === 'active' ? 'active' : ''}`} onClick={() => setFilter('active')}>Active</button>
              <button className={`filter-btn ${filter === 'completed' ? 'active' : ''}`} onClick={() => setFilter('completed')}>Completed</button>
            </div>
          </div>

          <div className="task-list-container glass-panel">
            <div className="list-header">
              <h2>Daily Habits</h2>
              <i className="ph ph-arrows-clockwise" style={{color: 'var(--primary)', fontSize: '1.5rem'}}></i>
            </div>
            <div className="task-list">{renderTaskList(dailyTasks, "No daily habits added yet.")}</div>
          </div>

          <div className="task-list-container glass-panel">
            <div className="list-header">
              <h2>One-Time Tasks</h2>
              <i className="ph ph-calendar-blank" style={{color: 'var(--primary)', fontSize: '1.5rem'}}></i>
            </div>
            <div className="task-list">{renderTaskList(oneOffTasks, "No one-off tasks here.")}</div>
          </div>
        </section>

        <aside className="productivity-section">
          <div className="pomodoro-panel glass-panel">
            <h2>Focus Timer</h2>
            <div className="timer-display">
              <svg className="progress-ring" width="160" height="160">
                <circle className="progress-ring__circle" strokeWidth="6" fill="transparent" r="74" cx="80" cy="80" 
                  style={{ strokeDasharray: `${74 * 2 * Math.PI}`, strokeDashoffset: `${(74 * 2 * Math.PI) - ((timerSeconds / (timerMode * 60)) * (74 * 2 * Math.PI))}` }}/>
              </svg>
              <span id="timerDisplay">{formatTime(timerSeconds)}</span>
            </div>
            <div className="timer-controls">
              <button className="btn-icon primary" onClick={() => setIsTimerRunning(!isTimerRunning)}>
                <i className={`ph-fill ${isTimerRunning ? 'ph-pause' : 'ph-play'}`}></i>
              </button>
              <button className="btn-icon secondary" onClick={() => { setIsTimerRunning(false); setTimerSeconds(timerMode * 60); }}>
                <i className="ph ph-arrow-counter-clockwise"></i>
              </button>
            </div>
            <div className="timer-modes">
              <button className={`mode-btn ${timerMode === 25 ? 'active' : ''}`} onClick={() => {setTimerMode(25); setTimerSeconds(25*60); setIsTimerRunning(false);}}>Pomodoro</button>
              <button className={`mode-btn ${timerMode === 5 ? 'active' : ''}`} onClick={() => {setTimerMode(5); setTimerSeconds(5*60); setIsTimerRunning(false);}}>Break</button>
            </div>
          </div>

          <div className="stats-panel glass-panel">
            <h2>Productivity</h2>
            <div className="stats-grid">
              <div className="stat-card">
                <i className="ph ph-target"></i>
                <div className="stat-info">
                  <h3>Active</h3>
                  <p>{tasks.filter(t => !t.completed).length}</p>
                </div>
              </div>
              <div className="stat-card">
                <i className="ph ph-fire"></i>
                <div className="stat-info">
                  <h3>Total Done</h3>
                  <p>{tasks.filter(t => t.completed).length}</p>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}
