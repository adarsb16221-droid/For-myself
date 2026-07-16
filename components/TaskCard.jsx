'use client';

import { useState } from 'react';
import Spinner from '@/components/Spinner';

export default function TaskCard({ task, onToggle, onDelete, onEdit, onMove, isLoading }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editInput, setEditInput] = useState(task.text);
  const [showMoveMenu, setShowMoveMenu] = useState(false);
  const isCompleted = task.completed;

  const handleSave = (e) => {
    e.stopPropagation();
    if (editInput.trim() && editInput !== task.text) {
      onEdit(task, editInput);
    }
    setIsEditing(false);
  };

  // Determine colors based on category/priority
  let badgeClass = 'bg-surface-variant text-on-surface-variant border border-white/10';
  if (task.category === 'Work') badgeClass = 'bg-primary/20 text-primary border border-primary/10';
  if (task.category === 'Health') badgeClass = 'bg-secondary-container/20 text-secondary border border-secondary/10';
  if (task.category === 'Personal') badgeClass = 'bg-tertiary/20 text-tertiary border border-tertiary/10';
  if (task.category === 'Wealth') badgeClass = 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/10';
  if (task.category === 'Knowledge') badgeClass = 'bg-blue-500/20 text-blue-500 border border-blue-500/10';

  return (
    <div className={`glass-card rounded-xl p-4 flex flex-col gap-2 task-item cursor-pointer ${isCompleted ? 'opacity-60' : ''}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 mt-1">
          {isLoading ? (
            <Spinner size="sm" className="mt-0.5" />
          ) : (
            <input 
              type="checkbox" 
              className="checkbox-custom mt-0.5" 
              checked={isCompleted}
              onChange={() => onToggle(task)}
              disabled={isLoading}
            />
          )}
          <div className="flex-1 w-full">
            {isEditing ? (
              <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                <input 
                  type="text"
                  className="flex-1 bg-surface-container-high/50 border border-white/20 rounded px-2 py-1 text-on-surface focus:outline-none focus:border-primary text-[15px]"
                  value={editInput}
                  onChange={e => setEditInput(e.target.value)}
                  autoFocus
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleSave(e);
                    if (e.key === 'Escape') setIsEditing(false);
                  }}
                />
                <button onClick={handleSave} className="text-primary hover:text-primary-fixed-dim">
                  <span className="material-symbols-outlined text-[18px]">check</span>
                </button>
                <button onClick={() => setIsEditing(false)} className="text-error hover:text-error/80">
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>
            ) : (
              <span className={`font-body-lg text-[16px] text-on-surface font-medium block ${isCompleted ? 'line-through text-on-surface-variant' : ''}`}>
                {task.text}
              </span>
            )}
            {task.isRegular && (
              <div className="font-body-sm text-[12px] text-on-surface-variant mt-1 flex items-center gap-3">
                <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">routine</span> Daily</span>
                <span className="flex items-center gap-1 text-secondary"><span className="material-symbols-outlined text-[14px]">local_fire_department</span> {task.history?.length || 0} Days</span>
              </div>
            )}
            {!task.isRegular && task.priority === 'high' && (
              <span className="font-body-sm text-[12px] text-error mt-1 flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">priority_high</span> High Priority
              </span>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          {!isEditing && (
            <button 
              onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
              className="text-outline-variant hover:text-primary transition-colors p-1"
              disabled={isLoading}
            >
              <span className="material-symbols-outlined text-[18px]">edit</span>
            </button>
          )}
          <div className="relative">
            <button 
              onClick={(e) => { e.stopPropagation(); setShowMoveMenu(!showMoveMenu); }}
              className="text-outline-variant hover:text-on-surface transition-colors p-1"
              disabled={isLoading}
            >
              <span className="material-symbols-outlined text-[20px]">swap_vert</span>
            </button>
            {showMoveMenu && (
              <div className="absolute right-0 top-full mt-1 bg-surface-container-high border border-white/10 rounded-md shadow-lg z-10 flex flex-col min-w-[140px] py-1 animate-in fade-in zoom-in-95">
                 <button className="px-3 py-1.5 text-left text-sm hover:bg-white/5 text-on-surface" onClick={(e) => { e.stopPropagation(); onMove(task, 'first'); setShowMoveMenu(false); }}>Move to First</button>
                 <button className="px-3 py-1.5 text-left text-sm hover:bg-white/5 text-on-surface" onClick={(e) => { e.stopPropagation(); onMove(task, 'up'); setShowMoveMenu(false); }}>Move Up</button>
                 <button className="px-3 py-1.5 text-left text-sm hover:bg-white/5 text-on-surface" onClick={(e) => { e.stopPropagation(); onMove(task, 'down'); setShowMoveMenu(false); }}>Move Down</button>
                 <button className="px-3 py-1.5 text-left text-sm hover:bg-white/5 text-on-surface" onClick={(e) => { e.stopPropagation(); onMove(task, 'last'); setShowMoveMenu(false); }}>Move to Last</button>
              </div>
            )}
          </div>
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete(task._id); }}
            className="text-outline-variant hover:text-error transition-colors p-1"
            disabled={isLoading}
          >
            <span className="material-symbols-outlined text-[20px]">delete</span>
          </button>
        </div>
      </div>
      <div className="ml-8 flex gap-2 mt-1">
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${badgeClass}`}>
          {task.category}
        </span>
      </div>
    </div>
  );
}
