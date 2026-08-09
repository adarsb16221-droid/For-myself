"use client";
import { useState, useEffect } from 'react';

export default function Gate() {
  const [links, setLinks] = useState([]);
  const [linkName, setLinkName] = useState('');
  const [linkUrl, setLinkUrl] = useState('');

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('orbit_quickLinks')) || [];
    setLinks(saved);
  }, []);

  const addLink = (e) => {
    e.preventDefault();
    if (!linkName || !linkUrl) return;
    const newLinks = [...links, { id: Date.now().toString(), name: linkName, url: linkUrl }];
    setLinks(newLinks);
    localStorage.setItem('orbit_quickLinks', JSON.stringify(newLinks));
    setLinkName('');
    setLinkUrl('');
  };

  const deleteLink = (id) => {
    const newLinks = links.filter(l => l.id !== id);
    setLinks(newLinks);
    localStorage.setItem('orbit_quickLinks', JSON.stringify(newLinks));
  };

  return (
    <div className="page-view active" style={{ display: 'flex' }}>
      <div className="view-header">
        <div className="header-content">
          <h1>Quick <span className="gradient-text">Links</span></h1>
          <p>Manage your important links</p>
        </div>
      </div>
      <div className="gate-container glass-panel">
        <div className="quick-links-panel">
          <h2 style={{ fontFamily: 'var(--font-heading)', marginBottom: '1rem' }}>Your Links</h2>
          <form onSubmit={addLink} className="task-form" style={{ marginBottom: '1.5rem' }}>
            <div className="input-group">
              <i className="ph ph-text-t"></i>
              <input type="text" value={linkName} onChange={e => setLinkName(e.target.value)} placeholder="Link Name" required />
            </div>
            <div className="input-group" style={{ marginTop: '0.5rem' }}>
              <i className="ph ph-link"></i>
              <input type="url" value={linkUrl} onChange={e => setLinkUrl(e.target.value)} placeholder="https://..." required />
            </div>
            <button type="submit" className="btn-primary" style={{ marginTop: '1rem', width: '100%' }}>Add Link</button>
          </form>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {links.map(link => (
              <div key={link.id} className="task-item">
                <div className="task-content" style={{ cursor: 'pointer' }} onClick={() => window.open(link.url, '_blank')}>
                  <div className="task-text">
                    <span className="task-name">{link.name}</span>
                    <span className="text-xs text-on-surface-variant">{link.url}</span>
                  </div>
                </div>
                <div className="task-item-actions">
                  <button className="task-delete" onClick={() => deleteLink(link.id)}><i className="ph ph-trash"></i></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
