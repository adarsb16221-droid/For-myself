'use client';

export default function TaskCard({ task, onToggle, onDelete }) {
  const isCompleted = task.completed;

  // Determine colors based on category/priority
  let badgeClass = 'bg-surface-variant text-on-surface-variant border border-white/10';
  if (task.category === 'Work') badgeClass = 'bg-primary/20 text-primary border border-primary/10';
  if (task.category === 'Health') badgeClass = 'bg-secondary-container/20 text-secondary border border-secondary/10';
  if (task.category === 'Personal') badgeClass = 'bg-tertiary/20 text-tertiary border border-tertiary/10';

  return (
    <div className={`glass-card rounded-xl p-4 flex flex-col gap-2 task-item cursor-pointer ${isCompleted ? 'opacity-60' : ''}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 mt-1">
          <input 
            type="checkbox" 
            className="checkbox-custom mt-0.5" 
            checked={isCompleted}
            onChange={() => onToggle(task)}
          />
          <div>
            <span className={`font-body-lg text-[16px] text-on-surface font-medium block ${isCompleted ? 'line-through text-on-surface-variant' : ''}`}>
              {task.text}
            </span>
            {task.isRegular && (
              <span className="font-body-sm text-[12px] text-on-surface-variant mt-1 flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">routine</span> Daily
              </span>
            )}
            {!task.isRegular && task.priority === 'high' && (
              <span className="font-body-sm text-[12px] text-error mt-1 flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">priority_high</span> High Priority
              </span>
            )}
          </div>
        </div>
        <button 
          onClick={(e) => { e.stopPropagation(); onDelete(task._id); }}
          className="text-outline-variant hover:text-error transition-colors p-1"
        >
          <span className="material-symbols-outlined text-[20px]">delete</span>
        </button>
      </div>
      <div className="ml-8 flex gap-2 mt-1">
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${badgeClass}`}>
          {task.category}
        </span>
      </div>
    </div>
  );
}
