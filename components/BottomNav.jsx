'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { name: 'Home', href: '/', icon: 'home' },
    { name: 'Profile', href: '/profile', icon: 'person' },
    { name: 'AI', href: '/chat', icon: 'psychiatry' },
    { name: 'Plan', href: '/schedule', icon: 'event' },
    { name: 'Log', href: '/journal', icon: 'list_alt' },
    { name: 'Links', href: '/links', icon: 'link' },
    { name: 'Focus', href: '/focus', icon: 'timer' },
    { name: 'Data', href: '/analytics', icon: 'insights' },
    { name: 'Money', href: '/expenses', icon: 'account_balance_wallet' },
    { name: 'Social', href: '/community', icon: 'group' },
    { name: 'Vs', href: '/challenges', icon: 'flag' },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-2 pb-2 h-16 bg-surface-container-lowest dark:bg-surface-container-low border-t border-outline-variant">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link 
            key={item.name} 
            href={item.href}
            className={`flex flex-col items-center justify-center transition-colors ${
              isActive 
                ? 'text-primary' 
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span 
              className="material-symbols-outlined text-[18px]" 
              style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
            >
              {item.icon}
            </span>
            <span className="text-[9px] mt-0.5 font-medium">{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}
