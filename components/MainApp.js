"use client";

import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Dashboard from './Dashboard';
import Journal from './Journal';
import Gate from './Gate';
import Schedule from './Schedule';

export default function MainApp() {
  const [currentView, setCurrentView] = useState('view-dashboard');
  const [theme, setTheme] = useState('dark');
  const [tasks, setTasks] = useState([]);
  
  useEffect(() => {
    // Load theme from localStorage if possible
    const savedTheme = localStorage.getItem('orbit_theme') || 'dark';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    // Fetch initial tasks from MongoDB
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await fetch('/api/tasks');
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
      }
    } catch (e) {
      console.error('Failed to fetch tasks', e);
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('orbit_theme', newTheme);
  };

  return (
    <>
      <Sidebar currentView={currentView} setCurrentView={setCurrentView} />
      <div className="main-content">
        <div style={{ display: currentView === 'view-dashboard' ? 'block' : 'none' }}>
          <Dashboard tasks={tasks} setTasks={setTasks} fetchTasks={fetchTasks} theme={theme} toggleTheme={toggleTheme} />
        </div>
        <div style={{ display: currentView === 'view-journal' ? 'block' : 'none' }}>
          <Journal />
        </div>
        <div style={{ display: currentView === 'view-gate' ? 'block' : 'none' }}>
          <Gate />
        </div>
        <div style={{ display: currentView === 'view-schedule' ? 'block' : 'none' }}>
          <Schedule />
        </div>
      </div>
    </>
  );
}
