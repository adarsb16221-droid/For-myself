"use client";
import { useState, useEffect } from 'react';

export default function Journal() {
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [content, setContent] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    fetchJournalEntry();
  }, [date]);

  const fetchJournalEntry = async () => {
    try {
      const res = await fetch('/api/journal');
      if (res.ok) {
        const data = await res.json();
        setContent(data[date] || '');
      }
    } catch(e) {
      console.error(e);
    }
  };

  const saveJournal = async () => {
    try {
      setStatus('Saving...');
      const payload = { [date]: content };
      const res = await fetch('/api/journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setStatus('Saved');
        setTimeout(() => setStatus(''), 3000);
      }
    } catch (e) {
      setStatus('Error saving');
    }
  };

  return (
    <div className="page-view active" style={{ display: 'flex' }}>
      <div className="view-header">
        <div className="header-content">
          <h1>Daily <span style={{ background: 'linear-gradient(135deg, #fff, var(--text-muted))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Journal & Plan</span></h1>
          <p>Write your thoughts, plans, and retrieve past entries</p>
        </div>
      </div>
      <div className="journal-container glass-panel">
        <div className="calendar-sidebar">
          <h3 style={{ marginBottom: '1rem', fontFamily: 'var(--font-heading)' }}>Select Date</h3>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className="custom-date-picker" />
        </div>
        <div className="journal-editor">
          <div className="editor-header">
            <h3 style={{ fontFamily: 'var(--font-heading)' }}>
              {date === new Date().toISOString().split('T')[0] ? 'Today' : new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </h3>
            <span className={`status-indicator ${status ? 'show' : ''}`}>{status}</span>
          </div>
          <textarea 
            id="journalTextarea"
            value={content} 
            onChange={e => { setContent(e.target.value); setStatus('Unsaved changes...'); }} 
            placeholder="Write your daily plan or thoughts here..."
          ></textarea>
          <div className="editor-actions">
            <button onClick={saveJournal} className="btn-primary">Save Journal</button>
          </div>
        </div>
      </div>
    </div>
  );
}
