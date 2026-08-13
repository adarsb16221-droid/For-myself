'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { name: 'Home', href: '/', icon: 'home' },
    { name: 'AI', href: '/chat', icon: 'psychiatry' },
    { name: 'Plan', href: '/schedule', icon: 'event' },
    { name: 'Log', href: '/journal', icon: 'list_alt' },
    { name: 'Links', href: '/links', icon: 'link' },
    { name: 'Focus', href: '/focus', icon: 'timer' },
    { name: 'Data', href: '/analytics', icon: 'insights' },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-2 h-16 bg-on-surface/5 dark:bg-surface-container-lowest/40 backdrop-blur-2xl border-t border-on-surface/10 rounded-t-xl shadow-[0_-10px_40px_rgba(0,0,0,0.4)]">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link 
            key={item.name} 
            href={item.href}
            className={`flex flex-col items-center justify-center transition-all duration-150 active:scale-90 ${
              isActive 
                ? 'text-primary scale-110' 
                : 'text-outline-variant opacity-60 hover:opacity-100'
            }`}
          >
            <span 
              className="material-symbols-outlined text-[20px]" 
              style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
            >
              {item.icon}
            </span>
            <span className="font-label-caps text-[9px] mt-0.5 font-bold uppercase">{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}
