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
    { name: 'Hawk AI Coach', href: '/chat', icon: 'psychiatry' },
    { name: 'Journal', href: '/journal', icon: 'auto_stories' },
    { name: 'Schedule', href: '/schedule', icon: 'calendar_month' },
    { name: 'Quick Links', href: '/links', icon: 'link' },
    { name: 'Expenses', href: '/expenses', icon: 'account_balance_wallet' },
    { name: 'Analytics', href: '/analytics', icon: 'insights' },
  ];

  return (
    <>
      <nav className="hidden md:flex bg-surface-container-low h-screen w-[220px] lg:w-[240px] sticky top-0 left-0 border-r border-outline-variant flex-col py-5 px-3 z-50">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-primary text-on-primary flex items-center justify-center flex-shrink-0 font-headline-md text-[16px] font-bold">
            H
          </div>
          <div className="min-w-0 overflow-hidden">
            <h1 className="font-headline-md text-[17px] font-semibold text-on-surface leading-tight truncate">Hawk</h1>
            <p className="font-body-sm text-[12px] text-on-surface-variant truncate">{user ? user.name : 'Deep Work Space'}</p>
          </div>
        </div>

        {/* Main Nav */}
        <div className="flex-1 flex flex-col gap-0.5 overflow-y-auto pb-2 min-h-0">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.name} 
                href={item.href}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium transition-colors ${
                  isActive 
                    ? 'text-on-surface bg-on-surface/[0.07]' 
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-on-surface/5'
                }`}
              >
                <span className={`material-symbols-outlined text-[18px] ${isActive ? 'text-primary' : ''}`}>
                  {item.icon}
                </span>
                <span className="font-body-lg text-[13px] truncate">{item.name}</span>
              </Link>
            );
          })}
        </div>

        {/* Footer Nav */}
        <div className="space-y-0.5 pt-3 border-t border-outline-variant mt-2 shrink-0">
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
