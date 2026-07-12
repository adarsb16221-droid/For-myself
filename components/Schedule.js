"use client";

export default function Schedule() {
  return (
    <div className="page-view active" style={{ display: 'flex' }}>
      <div className="view-header">
        <div className="header-content">
          <h1>Daily <span style={{ background: 'linear-gradient(135deg, #fff, var(--text-muted))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Schedule</span></h1>
          <p>Plan your day with custom time blocks</p>
        </div>
      </div>
      <div className="schedule-layout glass-panel" style={{ padding: '2rem', textAlign: 'center' }}>
        <i className="ph ph-calendar" style={{ fontSize: '3rem', color: 'var(--primary)', marginBottom: '1rem' }}></i>
        <h2>Schedule Builder</h2>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>This feature is currently available locally via browser storage.</p>
      </div>
    </div>
  );
}
