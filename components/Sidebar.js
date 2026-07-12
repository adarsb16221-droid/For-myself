"use client";

export default function Sidebar({ currentView, setCurrentView }) {
  const navItems = [
    { id: 'view-dashboard', icon: 'ph-squares-four', label: 'Dashboard' },
    { id: 'view-journal', icon: 'ph-book-open', label: 'Journal / Plan' },
    { id: 'view-gate', icon: 'ph-link', label: 'Quick Links' },
    { id: 'view-schedule', icon: 'ph-calendar', label: 'Schedule' }
  ];

  return (
    <aside className="sidebar glass-panel">
      <div className="sidebar-logo">
        <i className="ph-fill ph-planet"></i>
        <span>Orbit</span>
      </div>
      <nav className="sidebar-nav">
        {navItems.map(item => (
          <button 
            key={item.id}
            className={`nav-btn ${currentView === item.id ? 'active' : ''}`}
            onClick={() => setCurrentView(item.id)}
          >
            <i className={`ph ${item.icon}`}></i>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
}
