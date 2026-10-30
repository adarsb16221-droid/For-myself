'use client';
import { useState } from 'react';
import AddTaskForm from '@/components/AddTaskForm';
import Spinner from '@/components/Spinner';

export default function TaskSection({ title, tasks, isLoading, emptyText, renderTask, addForm }) {
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = async (values) => {
    const created = await addForm.onAdd(values);
    if (created) setIsAdding(false);
    return created;
  };

  return (
    <section className="flex min-w-0 flex-col">
      <div className="mb-3 flex h-8 items-center justify-between">
        <h3 className="font-title-sm text-[15px] font-semibold text-on-surface">
          {title}
          {!isLoading && tasks.length > 0 && (
            <span className="ml-2 font-sans text-[13px] font-normal text-on-surface-variant">{tasks.length}</span>
          )}
        </h3>
        {addForm && !isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex h-7 items-center gap-1 rounded-md px-2 text-[13px] font-medium text-on-surface-variant transition-colors hover:bg-on-surface/5 hover:text-on-surface"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            Add
          </button>
        )}
      </div>

      {addForm && isAdding && (
        <AddTaskForm
          placeholder={addForm.placeholder}
          categories={addForm.categories}
          goals={addForm.goals}
          onSubmit={handleAdd}
          onCancel={() => setIsAdding(false)}
        />
      )}

      <div className="flex flex-col gap-2">
        {isLoading ? (
          <div className="flex justify-center py-6"><Spinner size="md" /></div>
        ) : tasks.length === 0 ? (
          <p className="rounded-xl border border-dashed border-outline-variant px-4 py-5 text-center text-[13px] text-on-surface-variant">
            {emptyText}
          </p>
        ) : (
          tasks.map(renderTask)
        )}
      </div>
    </section>
  );
}
