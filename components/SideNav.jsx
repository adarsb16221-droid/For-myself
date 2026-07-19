'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from '@/components/ThemeProvider';
import { useAuth } from '@/hooks/useAuth';

export default function SideNav() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();

  const navItems = [
    { name: 'Dashboard', href: '/', icon: 'dashboard' },
    { name: 'Journal', href: '/journal', icon: 'auto_stories' },
    { name: 'Quick Links', href: '/links', icon: 'link' },
    { name: 'Schedule', href: '/schedule', icon: 'calendar_month' },
    { name: 'Analytics', href: '/analytics', icon: 'insights' },
  ];

  return (
    <nav className="hidden md:flex bg-surface/60 backdrop-blur-md h-screen w-[280px] sticky top-0 left-0 border-r border-white/10 shadow-2xl flex-col py-8 px-6 z-50">
      {/* Header */}
      <div className="flex items-center gap-4 mb-12">
        <div className="w-10 h-10 rounded-full overflow-hidden bg-surface-variant flex items-center justify-center border border-white/10">
          <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>account_circle</span>
        </div>
        <div>
          <h1 className="font-headline-md text-[24px] font-bold text-on-surface leading-tight">Orbit</h1>
          <p className="font-body-sm text-[14px] text-on-surface-variant">{user ? user.name : 'Deep Work Space'}</p>
        </div>
      </div>

      {/* Main Nav */}
      <div className="flex-1 flex flex-col gap-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link 
              key={item.name} 
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                isActive 
                  ? 'text-primary font-bold border-r-2 border-primary bg-white/5' 
                  : 'text-on-surface-variant hover:bg-white/5 hover:scale-[1.02] active:scale-[0.98]'
              }`}
            >
              <span className="material-symbols-outlined" style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}>
                {item.icon}
              </span>
              <span className="font-body-lg text-[16px]">{item.name}</span>
            </Link>
          );
        })}
      </div>

      {/* Footer Nav */}
      <div className="space-y-2 pt-4 border-t border-white/5">
        <button onClick={toggleTheme} className="w-full flex items-center justify-between px-4 py-2 rounded-lg text-on-surface-variant font-medium hover:bg-white/5 transition-all duration-200 text-sm">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[20px]">{theme === 'dark' ? 'light_mode' : 'dark_mode'}</span>
            <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
          </div>
        </button>
        <button className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-on-surface-variant font-medium hover:bg-white/5 transition-all duration-200 text-sm">
          <span className="material-symbols-outlined text-[20px]">settings</span>
          <span>Settings</span>
        </button>
        <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-error font-medium hover:bg-error/10 transition-all duration-200 text-sm">
          <span className="material-symbols-outlined text-[20px]">logout</span>
          <span>Sign Out</span>
        </button>
      </div>
    </nav>
  );
}
