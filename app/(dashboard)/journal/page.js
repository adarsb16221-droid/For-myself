'use client';
import { useSyncExternalStore } from 'react';
import Header from '@/components/Header';
import JournalBook from '@/components/journal/JournalBook';
import { useAuth } from '@/hooks/useAuth';

const MOBILE_QUERY = '(max-width: 767px)';

function subscribe(callback) {
  const query = window.matchMedia(MOBILE_QUERY);
  query.addEventListener('change', callback);
  return () => query.removeEventListener('change', callback);
}

export default function JournalPage() {
  const { user } = useAuth();
  // null on the server, so the book only renders once we know which layout to use
  const isMobile = useSyncExternalStore(subscribe, () => window.matchMedia(MOBILE_QUERY).matches, () => null);

  return (
    <>
      <Header title="Journal" subtitle="Journal & Plan" showDate={false} />

      <main className="px-3 py-4 sm:px-6 sm:py-6 flex flex-col max-w-6xl mx-auto w-full flex-1 overflow-x-hidden">
        {isMobile !== null && <JournalBook isMobile={isMobile} ownerName={user?.name} />}
      </main>
    </>
  );
}
