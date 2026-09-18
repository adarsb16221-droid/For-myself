'use client';

import { useEffect, useMemo, useState } from 'react';
import Header from '@/components/Header';
import Spinner from '@/components/Spinner';

const categories = ['Food', 'Transport', 'Shopping', 'Bills', 'Health', 'Entertainment', 'Education', 'Other'];
const emptyForm = { type: 'expense', title: '', amount: '', category: 'Food', date: new Date().toISOString().split('T')[0], note: '' };

function formatMoney(amount) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(amount);
}

export default function ExpensesPage() {
  const [transactions, setTransactions] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [filter, setFilter] = useState('all');
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [editingId, setEditingId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const loadTransactions = async (selectedMonth = month) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/expenses?month=${selectedMonth}`, { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to load transactions');
      setTransactions(data);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => loadTransactions(), 0);
    return () => clearTimeout(timer);
  }, [month]); // eslint-disable-line react-hooks/exhaustive-deps

  const visibleTransactions = useMemo(
    () => filter === 'all' ? transactions : transactions.filter(item => item.type === filter),
    [filter, transactions],
  );
  const totals = useMemo(() => transactions.reduce((result, item) => {
    result[item.type] += item.amount;
    return result;
  }, { income: 0, expense: 0 }), [transactions]);
  const categoryTotals = useMemo(() => transactions
    .filter(item => item.type === 'expense')
    .reduce((result, item) => ({ ...result, [item.category]: (result[item.category] || 0) + item.amount }), {}), [transactions]);
  const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setIsSaving(true);
    try {
      const response = await fetch('/api/expenses', {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingId ? { ...form, _id: editingId } : form),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to save transaction');
      setForm({ ...emptyForm, date: form.date });
      setEditingId(null);
      await loadTransactions();
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setIsSaving(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this transaction?')) return;
    const response = await fetch(`/api/expenses?id=${id}`, { method: 'DELETE' });
    if (response.ok) setTransactions(current => current.filter(item => item._id !== id));
    else setError('Failed to delete transaction');
  };

  const startEditing = (item) => {
    setEditingId(item._id);
    setForm({ type: item.type, title: item.title, amount: item.amount, category: item.category, date: item.date, note: item.note || '' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <Header title="Expenses" subtitle="Understand where your money goes" showDate={false} />
      <main className="px-4 py-6 md:px-6 flex flex-col gap-6 max-w-7xl mx-auto w-full flex-1">
        {error && <div className="rounded-xl border border-error/30 bg-error/10 text-error px-4 py-3 text-sm">{error}</div>}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-headline-md text-2xl font-bold text-on-surface">Money overview</h2>
            <p className="text-sm text-on-surface-variant">Track income and spending for the selected month.</p>
          </div>
          <input type="month" value={month} onChange={event => setMonth(event.target.value)} className="rounded-lg border border-on-surface/15 bg-surface px-3 py-2 text-on-surface" />
        </div>

        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[
            ['Income', totals.income, 'text-secondary', 'trending_up'],
            ['Expenses', totals.expense, 'text-error', 'trending_down'],
            ['Balance', totals.income - totals.expense, totals.income - totals.expense >= 0 ? 'text-primary' : 'text-error', 'account_balance'],
            ['Top category', topCategory ? `${topCategory[0]} · ${formatMoney(topCategory[1])}` : 'No spending yet', 'text-tertiary', 'category'],
          ].map(([label, value, color, icon]) => (
            <div key={label} className="glass-panel rounded-xl border border-on-surface/10 p-5">
              <span className={`material-symbols-outlined ${color}`}>{icon}</span>
              <p className="text-sm text-on-surface-variant mt-3">{label}</p>
              <p className={`text-xl font-bold mt-1 ${color}`}>{typeof value === 'number' ? formatMoney(value) : value}</p>
            </div>
          ))}
        </section>

        <div className="grid grid-cols-1 xl:grid-cols-[minmax(280px,360px)_1fr] gap-6 items-start">
          <form onSubmit={submit} className="glass-panel rounded-xl border border-on-surface/10 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-title-sm text-lg font-semibold">{editingId ? 'Edit transaction' : 'Add transaction'}</h3>
              {editingId && <button type="button" onClick={() => { setEditingId(null); setForm(emptyForm); }} className="text-xs text-primary">Cancel</button>}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {['expense', 'income'].map(type => <button type="button" key={type} onClick={() => setForm({ ...form, type })} className={`rounded-lg px-3 py-2 text-sm capitalize ${form.type === type ? 'bg-primary text-on-primary' : 'bg-on-surface/5 text-on-surface-variant'}`}>{type}</button>)}
            </div>
            <input required placeholder="What was it for?" value={form.title} onChange={event => setForm({ ...form, title: event.target.value })} className="input-field" />
            <div className="grid grid-cols-2 gap-3">
              <input required min="0.01" step="0.01" type="number" placeholder="Amount" value={form.amount} onChange={event => setForm({ ...form, amount: event.target.value })} className="input-field" />
              <input required type="date" value={form.date} onChange={event => setForm({ ...form, date: event.target.value })} className="input-field" />
            </div>
            <select value={form.category} onChange={event => setForm({ ...form, category: event.target.value })} className="input-field">{categories.map(category => <option key={category}>{category}</option>)}</select>
            <textarea placeholder="Note (optional)" rows="2" value={form.note} onChange={event => setForm({ ...form, note: event.target.value })} className="input-field resize-none" />
            <button disabled={isSaving} className="w-full rounded-lg bg-primary text-on-primary px-4 py-2.5 font-semibold disabled:opacity-60">{isSaving ? 'Saving...' : editingId ? 'Update transaction' : 'Add transaction'}</button>
          </form>

          <section className="glass-panel rounded-xl border border-on-surface/10 p-5 min-h-[420px]">
            <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
              <h3 className="font-title-sm text-lg font-semibold">Transactions</h3>
              <div className="flex gap-1 rounded-lg bg-on-surface/5 p-1">{['all', 'expense', 'income'].map(value => <button key={value} onClick={() => setFilter(value)} className={`rounded-md px-3 py-1 text-xs capitalize ${filter === value ? 'bg-surface text-primary shadow-sm' : 'text-on-surface-variant'}`}>{value}</button>)}</div>
            </div>
            {isLoading ? <div className="h-64 flex items-center justify-center"><Spinner size="lg" /></div> : visibleTransactions.length === 0 ? <div className="h-64 flex flex-col items-center justify-center text-center text-on-surface-variant"><span className="material-symbols-outlined text-4xl mb-2">receipt_long</span><p>No transactions for this month.</p></div> : <div className="space-y-2">{visibleTransactions.map(item => <div key={item._id} className="flex items-center gap-3 rounded-lg bg-on-surface/5 px-3 py-3"><span className="material-symbols-outlined rounded-full bg-primary/10 p-2 text-primary">{item.type === 'income' ? 'payments' : 'shopping_bag'}</span><div className="min-w-0 flex-1"><p className="font-medium truncate text-on-surface">{item.title}</p><p className="text-xs text-on-surface-variant">{item.category} · {item.date}</p></div><p className={`font-semibold ${item.type === 'income' ? 'text-secondary' : 'text-error'}`}>{item.type === 'income' ? '+' : '-'}{formatMoney(item.amount)}</p><button aria-label={`Edit ${item.title}`} onClick={() => startEditing(item)} className="text-on-surface-variant hover:text-primary"><span className="material-symbols-outlined text-lg">edit</span></button><button aria-label={`Delete ${item.title}`} onClick={() => remove(item._id)} className="text-on-surface-variant hover:text-error"><span className="material-symbols-outlined text-lg">delete</span></button></div>)}</div>}
          </section>
        </div>

        <section className="glass-panel rounded-xl border border-on-surface/10 p-5">
          <h3 className="font-title-sm text-lg font-semibold mb-4">Spending by category</h3>
          {Object.keys(categoryTotals).length === 0 ? <p className="text-sm text-on-surface-variant">Add expenses to see your category breakdown.</p> : <div className="grid sm:grid-cols-2 gap-4">{Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]).map(([category, amount]) => { const percentage = totals.expense ? (amount / totals.expense) * 100 : 0; return <div key={category}><div className="flex justify-between text-sm mb-1"><span>{category}</span><span className="text-on-surface-variant">{formatMoney(amount)}</span></div><div className="h-2 rounded-full bg-on-surface/10 overflow-hidden"><div className="h-full rounded-full bg-primary" style={{ width: `${percentage}%` }} /></div></div>; })}</div>}
        </section>
      </main>
    </>
  );
}
