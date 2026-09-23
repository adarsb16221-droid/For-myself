'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import SettingsModal from './SettingsModal';

export default function SideNav() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const navItems = [
    { name: 'Dashboard', href: '/', icon: 'dashboard' },
    { name: 'Profile', href: '/profile', icon: 'person' },
    { name: 'Friends', href: '/community', icon: 'group' },
    { name: 'Challenges', href: '/challenges', icon: 'flag' },
    { name: 'Orbit AI & Focus', href: '/chat', icon: 'psychiatry' },
    { name: 'Journal', href: '/journal', icon: 'auto_stories' },
    { name: 'Schedule', href: '/schedule', icon: 'calendar_month' },
    { name: 'Quick Links', href: '/links', icon: 'link' },
    { name: 'Expenses', href: '/expenses', icon: 'account_balance_wallet' },
    { name: 'Analytics', href: '/analytics', icon: 'insights' },
  ];

  return (
    <>
      <nav className="hidden md:flex bg-surface/60 backdrop-blur-md h-screen w-[220px] lg:w-[260px] sticky top-0 left-0 border-r border-on-surface/10 shadow-2xl flex-col py-6 px-4 z-50">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6 shrink-0">
          <div className="w-8 h-8 rounded-full overflow-hidden bg-surface-variant flex items-center justify-center border border-on-surface/10 flex-shrink-0">
            <span className="material-symbols-outlined text-primary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>account_circle</span>
          </div>
          <div className="min-w-0 overflow-hidden">
            <h1 className="font-headline-md text-[20px] font-bold text-on-surface leading-tight truncate">Orbit</h1>
            <p className="font-body-sm text-[12px] text-on-surface-variant truncate">{user ? user.name : 'Deep Work Space'}</p>
          </div>
        </div>

        {/* Main Nav */}
        <div className="flex-1 flex flex-col gap-1.5 overflow-y-auto pr-1 pb-2 min-h-0">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.name} 
                href={item.href}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-all duration-200 ${
                  isActive 
                    ? 'text-primary font-bold border-r-2 border-primary bg-on-surface/5' 
                    : 'text-on-surface-variant hover:bg-on-surface/5 hover:scale-[1.02] active:scale-[0.98]'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]" style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}>
                  {item.icon}
                </span>
                <span className="font-body-lg text-[13px] truncate">{item.name}</span>
              </Link>
            );
          })}
        </div>

        {/* Footer Nav */}
        <div className="space-y-1 pt-4 border-t border-on-surface/5 mt-2 shrink-0">
          <button onClick={() => setIsSettingsOpen(true)} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-on-surface-variant font-medium hover:bg-on-surface/5 transition-all duration-200 text-[13px]">
            <span className="material-symbols-outlined text-[18px]">settings</span>
            <span>Settings</span>
          </button>
          <button onClick={logout} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-error font-medium hover:bg-error/10 transition-all duration-200 text-[13px]">
            <span className="material-symbols-outlined text-[18px]">logout</span>
            <span>Sign Out</span>
          </button>
        </div>
      </nav>

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />
    </>
  );
}
