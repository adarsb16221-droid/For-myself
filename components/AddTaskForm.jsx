'use client';
import { useRef, useState } from 'react';
import Button from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';

export default function AddTaskForm({ placeholder, categories, goals, onSubmit, onCancel }) {
  const [text, setText] = useState('');
  const [category, setCategory] = useState(categories[0]);
  const [linkedGoalId, setLinkedGoalId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  // A ref (not state) so a second submit fired before React re-renders is still blocked
  const isSubmittingRef = useRef(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim() || isSubmittingRef.current) return;

    isSubmittingRef.current = true;
    setIsSubmitting(true);
    try {
      const created = await onSubmit({ text: text.trim(), category, linkedGoalId: linkedGoalId || null });
      if (created) {
        setText('');
        setLinkedGoalId('');
      }
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      onKeyDown={e => { if (e.key === 'Escape') onCancel(); }}
      className="mb-3 flex flex-col gap-2 rounded-xl border border-outline-variant bg-surface-container-low dark:bg-surface-container p-3"
    >
      <Input placeholder={placeholder} autoFocus value={text} onChange={e => setText(e.target.value)} />
      <div className="flex flex-wrap items-center gap-2">
        <Select options={categories} value={category} onChange={e => setCategory(e.target.value)} className="text-[13px]" />
        {goals && goals.length > 0 && (
          <Select
            options={[{ value: '', label: 'No goal' }, ...goals.map(g => ({ value: g._id, label: g.text }))]}
            value={linkedGoalId}
            onChange={e => setLinkedGoalId(e.target.value)}
            className="max-w-[140px] truncate text-[13px]"
          />
        )}
        <div className="ml-auto flex gap-1.5">
          <Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
          <Button type="submit" size="sm" disabled={isSubmitting || !text.trim()}>
            {isSubmitting ? 'Adding…' : 'Add'}
          </Button>
        </div>
      </div>
    </form>
  );
}
