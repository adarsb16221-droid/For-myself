'use client';
import { useState, useEffect, useRef } from 'react';
import Header from '@/components/Header';
import Spinner from '@/components/Spinner';
import TimelineBlock from '@/components/TimelineBlock';

// Helper to format 24h time to 12h time
const formatTime12h = (time24) => {
  if (!time24) return '';
  const [h, m] = time24.split(':');
  let hours = parseInt(h, 10);
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${hours}:${m} ${ampm}`;
};

// Helper to convert "HH:MM" to minutes from midnight
const timeToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
};

// Calculate layout for overlapping blocks
const calculateLayout = (scheduleList) => {
  if (!scheduleList || scheduleList.length === 0) return [];
  
  const events = scheduleList.map(block => ({
    ...block,
    startMins: timeToMinutes(block.startTime),
    endMins: timeToMinutes(block.endTime)
  })).sort((a, b) => a.startMins - b.startMins || b.endMins - a.endMins);

  const clusters = [];
  let currentCluster = [];
  let clusterEnd = -1;

  // Group into clusters of overlapping events
  events.forEach(ev => {
    if (ev.startMins >= clusterEnd && currentCluster.length > 0) {
      clusters.push(currentCluster);
      currentCluster = [];
      clusterEnd = -1;
    }
    currentCluster.push(ev);
    clusterEnd = Math.max(clusterEnd, ev.endMins);
  });
  if (currentCluster.length > 0) {
    clusters.push(currentCluster);
  }

  // Calculate columns for each cluster
  const laidOutEvents = [];
  clusters.forEach(cluster => {
    const columns = [];
    cluster.forEach(ev => {
      let placed = false;
      for (let i = 0; i < columns.length; i++) {
        const lastEvInCol = columns[i][columns[i].length - 1];
        if (lastEvInCol.endMins <= ev.startMins) {
          columns[i].push(ev);
          ev.col = i;
          placed = true;
          break;
        }
      }
      if (!placed) {
        columns.push([ev]);
        ev.col = columns.length - 1;
      }
    });

    const numCols = columns.length;
    cluster.forEach(ev => {
      ev.width = 100 / numCols;
      ev.left = (ev.col * 100) / numCols;
      laidOutEvents.push(ev);
    });
  });

  return laidOutEvents;
};

export default function SchedulePage() {
  const [schedule, setSchedule] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const timelineRef = useRef(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/schedule').then(res => res.json()),
      fetch('/api/tasks').then(res => res.json())
    ]).then(([schedData, taskData]) => {
      setSchedule(Array.isArray(schedData) ? schedData : []);
      setTasks(Array.isArray(taskData) ? taskData : []);
      setIsLoading(false);
    }).catch(e => {
      console.error(e);
      setIsLoading(false);
    });
  }, []);

  const updateScheduleBlock = async (id, updates) => {
    // Optimistic update
    setSchedule(prev => prev.map(b => b._id === id ? { ...b, ...updates } : b));
    try {
      await fetch('/api/schedule', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ _id: id, ...updates })
      });
    } catch (e) {
      console.error('Failed to update schedule block', e);
    }
  };

  const deleteScheduleBlock = async (id) => {
    setSchedule(prev => prev.filter(b => b._id !== id));
    try {
      await fetch(`/api/schedule?id=${id}`, { method: 'DELETE' });
    } catch (e) {
      console.error('Failed to delete schedule block', e);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    const taskTitle = e.dataTransfer.getData('taskTitle');
    if (!taskTitle) return;

    const rect = timelineRef.current.getBoundingClientRect();
    const y = e.clientY - rect.top + timelineRef.current.scrollTop - 16; // 16px is p-4 padding top
    
    // 1px = 1 min
    const dropMins = y;
    const snappedMins = Math.round(dropMins / 15) * 15;
    const startMins = Math.max(0, Math.min(1440 - 60, snappedMins));
    const endMins = startMins + 60; // 1 hr default

    const mToTime = (mins) => {
      const h = Math.floor(mins / 60);
      const m = Math.floor(mins % 60);
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    };

    const newBlock = {
      title: taskTitle,
      startTime: mToTime(startMins),
      endTime: mToTime(endMins)
    };

    // Optimistic append with temp ID
    const tempId = Date.now().toString();
    setSchedule(prev => [...prev, { ...newBlock, _id: tempId }]);

    try {
      const res = await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBlock)
      });
      if (res.ok) {
        const created = await res.json();
        setSchedule(prev => prev.map(b => b._id === tempId ? created : b));
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      <Header title="Orbit" subtitle="Schedule Builder" showDate={false} />
      
      <main className="px-4 py-6 flex gap-6 max-w-7xl mx-auto w-full flex-1 h-[calc(100vh-100px)] overflow-hidden">
        
        {/* Sidebar: Tasks */}
        <div className="w-1/3 flex flex-col gap-4 bg-surface-container-low rounded-xl p-4 border border-white/5 h-full overflow-y-auto hidden md:flex shadow-sm">
          <h2 className="font-title-sm text-[18px] font-semibold flex items-center gap-2 text-primary-fixed-dim sticky top-0 bg-surface-container-low z-10 pb-2 border-b border-white/5">
            <span className="material-symbols-outlined">drag_indicator</span> Tasks Pool
          </h2>
          <p className="text-xs text-on-surface-variant mb-2">Drag cards onto the timeline to schedule them.</p>
          
          {isLoading ? (
            <Spinner size="md" className="my-8" />
          ) : tasks.length === 0 ? (
            <p className="text-on-surface-variant text-sm italic opacity-70">No tasks available.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {tasks.map(task => (
                <div 
                  key={task._id} 
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('taskTitle', task.text);
                    e.dataTransfer.effectAllowed = 'copy';
                  }}
                  className="glass-card rounded-lg p-3 border border-white/10 cursor-grab hover:bg-white/5 transition-colors active:cursor-grabbing flex flex-col gap-1 shadow-sm group"
                >
                  <div className="flex justify-between items-start">
                    <span className="font-body-sm text-[14px] font-medium text-on-surface">{task.text}</span>
                    <span className="material-symbols-outlined text-[16px] text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity">drag_indicator</span>
                  </div>
                  <div className="flex gap-2 items-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary/70">{task.category}</span>
                    {task.isRegular && <span className="text-[10px] bg-secondary/20 text-secondary px-1.5 rounded-full">Daily</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Main Area: Timeline Grid */}
        <div className="flex-1 flex flex-col bg-surface-container-low rounded-xl border border-white/5 h-full overflow-hidden relative shadow-sm">
          <div className="p-4 border-b border-white/5 bg-surface-container flex justify-between items-center z-20 shadow-sm relative">
            <h2 className="font-headline-md text-[20px] font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">calendar_month</span> Today's Timeline
            </h2>
            {isLoading && <Spinner size="sm" />}
          </div>

          <div 
            className="flex-1 overflow-y-auto relative p-4 bg-surface-container/30"
            ref={timelineRef}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
          >
            {/* Background Grid Lines (1 Hour intervals) */}
            <div className="absolute top-4 left-4 right-4 h-[1440px] pointer-events-none">
              {Array.from({ length: 25 }).map((_, i) => (
                <div key={i} className="absolute w-full border-t border-white/5 flex items-start" style={{ top: `${i * 60}px` }}>
                  <span className="text-[10px] text-on-surface-variant absolute -top-2 bg-surface-container-low px-1 -left-2 z-10">
                    {formatTime12h(`${i.toString().padStart(2, '0')}:00`)}
                  </span>
                </div>
              ))}
            </div>

            {/* Blocks Container */}
            <div className="relative h-[1440px] ml-12 mr-2">
              {calculateLayout(schedule).map(block => (
                <TimelineBlock 
                  key={block._id}
                  block={block}
                  onUpdate={updateScheduleBlock}
                  onDelete={deleteScheduleBlock}
                  pixelsPerMinute={1}
                  layout={{ left: `${block.left}%`, width: `calc(${block.width}% - 2px)` }}
                />
              ))}
            </div>
          </div>
        </div>

      </main>
    </>
  );
}
