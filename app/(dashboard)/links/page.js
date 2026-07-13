'use client';
import { useState, useEffect } from 'react';
import Header from '@/components/Header';

export default function LinksPage() {
  const [links, setLinks] = useState([]);
  const [linkName, setLinkName] = useState('');
  const [linkUrl, setLinkUrl] = useState('');


  async function fetchLinks() {
    try {
      const res = await fetch('/api/links');
      if (res.ok) {
        const data = await res.json();
        setLinks(data);
      }
    } catch (e) {
      console.error(e);
    }
  }

  const addLink = async (e) => {
    e.preventDefault();
    if (!linkName || !linkUrl) return;
    
    try {
      const res = await fetch('/api/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: linkName, url: linkUrl })
      });
      if (res.ok) {
        const newLink = await res.json();
        setLinks([newLink, ...links]);
        setLinkName('');
        setLinkUrl('');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const deleteLink = async (id) => {
    try {
      await fetch(`/api/links?id=${id}`, { method: 'DELETE' });
      setLinks(links.filter(l => l._id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchLinks();
  }, []);

  return (
    <>
      <Header title="Orbit" subtitle="Quick Links" showDate={false} />
      
      <main className="px-4 py-6 flex flex-col gap-6 max-w-2xl mx-auto w-full flex-1">
        <section className="glass-panel p-6 rounded-xl flex flex-col gap-4 shadow-md">
          <h2 className="font-headline-md text-[24px] font-bold mb-2">Your Links</h2>
          
          <form onSubmit={addLink} className="flex flex-col gap-3">
            <div className="flex gap-2 items-center">
              <span className="material-symbols-outlined text-primary">title</span>
              <input 
                type="text" 
                value={linkName} 
                onChange={e => setLinkName(e.target.value)} 
                placeholder="Link Name" 
                required 
                className="flex-1 bg-surface-container-high/50 border border-white/10 rounded-lg px-4 py-3 text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-body-sm"
              />
            </div>
            <div className="flex gap-2 items-center mt-1">
              <span className="material-symbols-outlined text-primary">link</span>
              <input 
                type="url" 
                value={linkUrl} 
                onChange={e => setLinkUrl(e.target.value)} 
                placeholder="https://..." 
                required 
                className="flex-1 bg-surface-container-high/50 border border-white/10 rounded-lg px-4 py-3 text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-body-sm"
              />
            </div>
            <button 
              type="submit" 
              className="mt-2 w-full bg-primary text-on-primary px-6 py-3 rounded-lg font-title-sm text-[16px] font-semibold hover:scale-105 transition-transform shadow-[0_0_15px_rgba(192,193,255,0.3)]"
            >
              Add Link
            </button>
          </form>

          <div className="flex flex-col gap-3 mt-4">
            {links.map(link => (
              <div key={link._id} className="glass-card rounded-xl p-4 flex items-center justify-between task-item cursor-pointer">
                <div 
                  className="flex items-center gap-3 flex-1"
                  onClick={() => window.open(link.url, '_blank')}
                >
                  <span className="material-symbols-outlined text-secondary text-3xl">language</span>
                  <div className="flex flex-col">
                    <span className="font-body-lg text-[16px] text-on-surface font-medium">{link.name}</span>
                    <span className="font-body-sm text-[12px] text-on-surface-variant truncate max-w-[200px] sm:max-w-xs">{link.url}</span>
                  </div>
                </div>
                <button 
                  onClick={() => deleteLink(link._id)} 
                  className="text-outline-variant hover:text-error transition-colors p-2"
                >
                  <span className="material-symbols-outlined text-[20px]">delete</span>
                </button>
              </div>
            ))}
            {links.length === 0 && (
              <p className="text-on-surface-variant text-sm italic opacity-70 text-center mt-4">No quick links saved yet.</p>
            )}
          </div>
        </section>
      </main>
    </>
  );
}
