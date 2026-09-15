'use client';

import { useState } from 'react';
import Spinner from '@/components/Spinner';

export default function TaskCard({ task, onToggle, onDelete, onUpdate, onMove, isLoading, onDragStart, onDragOver, onDrop }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editInput, setEditInput] = useState(task.text);
  const [showMoveMenu, setShowMoveMenu] = useState(false);
  
  const [showAddSubtask, setShowAddSubtask] = useState(false);
  const [subtaskInput, setSubtaskInput] = useState('');

  const isCompleted = task.completed;
  const subtasks = task.subtasks || [];

  const handleSave = (e) => {
    e.stopPropagation();
    if (editInput.trim() && editInput !== task.text) {
      onUpdate(task, { text: editInput });
    }
    setIsEditing(false);
  };

  const handleAddSubtask = (e) => {
    e.preventDefault();
    if (!subtaskInput.trim()) return;
    const newSubtask = {
      id: Date.now().toString(),
      text: subtaskInput.trim(),
      completed: false
    };
    onUpdate(task, { subtasks: [...subtasks, newSubtask] });
    setSubtaskInput('');
    setShowAddSubtask(false);
  };

  const handleToggleSubtask = (e, subtaskId) => {
    e.stopPropagation();
    const newSubtasks = subtasks.map(st => 
      st.id === subtaskId ? { ...st, completed: !st.completed } : st
    );
    onUpdate(task, { subtasks: newSubtasks });
  };

  const handleDeleteSubtask = (e, subtaskId) => {
    e.stopPropagation();
    const newSubtasks = subtasks.filter(st => st.id !== subtaskId);
    onUpdate(task, { subtasks: newSubtasks });
  };

  // Determine colors based on category/priority
  let badgeClass = 'bg-surface-variant text-on-surface-variant border border-on-surface/10';
  if (task.category === 'Work') badgeClass = 'bg-primary/20 text-primary border border-primary/10';
  if (task.category === 'Health') badgeClass = 'bg-secondary-container/20 text-secondary border border-secondary/10';
  if (task.category === 'Personal') badgeClass = 'bg-tertiary/20 text-tertiary border border-tertiary/10';
  if (task.category === 'Wealth') badgeClass = 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/10';
  if (task.category === 'Knowledge') badgeClass = 'bg-blue-500/20 text-blue-500 border border-blue-500/10';

  return (
    <div 
      className={`glass-card rounded-xl p-3 flex flex-col gap-1.5 task-item cursor-pointer ${isCompleted ? 'opacity-60' : ''}`}
      draggable={!isLoading}
      onDragStart={(e) => onDragStart && onDragStart(e, task)}
      onDragOver={(e) => onDragOver && onDragOver(e)}
      onDrop={(e) => onDrop && onDrop(e, task)}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-2.5 mt-0.5 w-full overflow-hidden">
          {isLoading ? (
            <Spinner size="sm" className="shrink-0" />
          ) : (
            <input 
              type="checkbox" 
              className="checkbox-custom shrink-0 mt-0.5 w-4 h-4" 
              checked={isCompleted}
              onChange={() => onToggle(task)}
              disabled={isLoading}
            />
          )}
          <div className="flex-1 w-full min-w-0">
            {isEditing ? (
              <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                <input 
                  type="text"
                  className="flex-1 bg-surface-container-high/50 border border-on-surface/20 rounded px-2 py-1 text-on-surface focus:outline-none focus:border-primary text-[13px]"
                  value={editInput}
                  onChange={e => setEditInput(e.target.value)}
                  autoFocus
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleSave(e);
                    if (e.key === 'Escape') setIsEditing(false);
                  }}
                />
                <button onClick={handleSave} className="text-primary hover:text-primary-fixed-dim">
                  <span className="material-symbols-outlined text-[16px]">check</span>
                </button>
                <button onClick={() => setIsEditing(false)} className="text-error hover:text-error/80">
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              </div>
            ) : (
              <span className={`font-body-md text-[14px] text-on-surface font-medium block break-words leading-snug ${isCompleted ? 'line-through text-on-surface-variant' : ''}`}>
                {task.text}
              </span>
            )}
            {task.isRegular && (
              <div className="font-body-sm text-[11px] text-on-surface-variant mt-1 flex items-center gap-3">
                <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">routine</span> Daily</span>
                <span className="flex items-center gap-1 text-secondary"><span className="material-symbols-outlined text-[12px]">local_fire_department</span> {task.history?.length || 0} Days</span>
              </div>
            )}
            {!task.isRegular && task.priority === 'high' && !task.isGoal && (
              <span className="font-body-sm text-[11px] text-error mt-1 flex items-center gap-1">
                <span className="material-symbols-outlined text-[12px]">priority_high</span> High Priority
              </span>
            )}
            {task.isGoal && (
              <div className="font-body-sm text-[11px] text-on-surface-variant mt-1 flex items-center gap-3">
                <span className="flex items-center gap-1 text-primary"><span className="material-symbols-outlined text-[12px]">flag</span> Long Term Goal</span>
              </div>
            )}

            {/* Subtasks Section */}
            {(subtasks.length > 0 || showAddSubtask) && (
              <div className="mt-3 flex flex-col gap-2 w-full" onClick={e => e.stopPropagation()}>
                {subtasks.map(st => (
                  <div key={st.id} className="flex items-start gap-2 bg-on-surface/10 rounded p-1.5 border border-on-surface/5 group">
                    <input 
                      type="checkbox" 
                      className="checkbox-custom mt-0.5 w-3.5 h-3.5 shrink-0" 
                      checked={st.completed}
                      onChange={(e) => handleToggleSubtask(e, st.id)}
                      disabled={isLoading}
                    />
                    <span className={`flex-1 text-[13px] font-medium break-words ${st.completed ? 'line-through text-on-surface-variant' : 'text-on-surface'}`}>
                      {st.text}
                    </span>
                    <button 
                      onClick={(e) => handleDeleteSubtask(e, st.id)}
                      className="opacity-0 group-hover:opacity-100 text-outline-variant hover:text-error transition-all p-0.5 shrink-0"
                      disabled={isLoading}
                    >
                      <span className="material-symbols-outlined text-[14px]">close</span>
                    </button>
                  </div>
                ))}
                
                {showAddSubtask && (
                  <form onSubmit={handleAddSubtask} className="flex items-center gap-2 mt-1">
                    <input 
                      type="text"
                      className="flex-1 bg-surface-container-high/50 border border-on-surface/20 rounded px-2 py-1 text-on-surface focus:outline-none focus:border-primary text-[13px]"
                      placeholder={task.isGoal ? "New daily habit..." : "Subtask..."}
                      value={subtaskInput}
                      onChange={e => setSubtaskInput(e.target.value)}
                      autoFocus
                      onKeyDown={e => {
                        if (e.key === 'Escape') setShowAddSubtask(false);
                      }}
                    />
                    <button type="submit" className="text-primary hover:text-primary-fixed-dim p-1 shrink-0">
                      <span className="material-symbols-outlined text-[16px]">check</span>
                    </button>
                    <button type="button" onClick={() => setShowAddSubtask(false)} className="text-error hover:text-error/80 p-1 shrink-0">
                      <span className="material-symbols-outlined text-[16px]">close</span>
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
        
        <div className="flex flex-col items-center gap-1 sm:gap-1.5 shrink-0 ml-2 -mt-1 sm:-mt-0.5">
          <button 
            onClick={(e) => { e.stopPropagation(); setShowAddSubtask(true); }}
            className="text-outline-variant hover:text-primary transition-colors p-0.5 sm:p-1"
            disabled={isLoading}
            title={task.isGoal ? "Add Daily Habit" : "Add Subtask"}
          >
            <span className="material-symbols-outlined text-[15px] sm:text-[16px]">
              {task.isGoal ? "track_changes" : "add_task"}
            </span>
          </button>
          {!isEditing && (
            <button 
              onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
              className="text-outline-variant hover:text-primary transition-colors p-0.5 sm:p-1"
              disabled={isLoading}
            >
              <span className="material-symbols-outlined text-[15px] sm:text-[16px]">edit</span>
            </button>
          )}
          <div className="relative">
            <button 
              onClick={(e) => { e.stopPropagation(); setShowMoveMenu(!showMoveMenu); }}
              className="text-outline-variant hover:text-on-surface transition-colors p-0.5 sm:p-1"
              disabled={isLoading}
            >
              <span className="material-symbols-outlined text-[16px] sm:text-[18px]">swap_vert</span>
            </button>
            {showMoveMenu && (
              <div className="absolute right-0 top-full mt-1 bg-surface-container-high border border-on-surface/10 rounded-md shadow-lg z-10 flex flex-col min-w-[140px] py-1 animate-in fade-in zoom-in-95">
                 <button className="px-3 py-1.5 text-left text-sm hover:bg-on-surface/5 text-on-surface" onClick={(e) => { e.stopPropagation(); onMove(task, 'first'); setShowMoveMenu(false); }}>Move to First</button>
                 <button className="px-3 py-1.5 text-left text-sm hover:bg-on-surface/5 text-on-surface" onClick={(e) => { e.stopPropagation(); onMove(task, 'up'); setShowMoveMenu(false); }}>Move Up</button>
                 <button className="px-3 py-1.5 text-left text-sm hover:bg-on-surface/5 text-on-surface" onClick={(e) => { e.stopPropagation(); onMove(task, 'down'); setShowMoveMenu(false); }}>Move Down</button>
                 <button className="px-3 py-1.5 text-left text-sm hover:bg-on-surface/5 text-on-surface" onClick={(e) => { e.stopPropagation(); onMove(task, 'last'); setShowMoveMenu(false); }}>Move to Last</button>
              </div>
            )}
          </div>
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete(task._id); }}
            className="text-outline-variant hover:text-error transition-colors p-0.5 sm:p-1"
            disabled={isLoading}
          >
            <span className="material-symbols-outlined text-[16px] sm:text-[18px]">delete</span>
          </button>
        </div>
      </div>
      <div className="ml-8 flex flex-wrap gap-2 mt-1">
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${badgeClass}`}>
          {task.category}
        </span>
        {task.linkedGoalId && (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-surface-variant text-on-surface-variant border border-on-surface/10 flex items-center gap-1">
             <span className="material-symbols-outlined text-[12px]">flag</span> Linked Goal
          </span>
        )}
      </div>
    </div>
  );
}
