'use client';

import { useState, useEffect, useRef } from 'react';
import Header from '@/components/Header';
import Spinner from '@/components/Spinner';
import ProfileHero from '@/components/profile/ProfileHero';
import BadgeShelf from '@/components/profile/BadgeShelf';
import ActivityHeatmap from '@/components/profile/ActivityHeatmap';
import HistoryTimeline from '@/components/profile/HistoryTimeline';

// ── Profile Page ────────────────────────────────────────────────
export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const scrollerRef = useRef(null);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch('/api/users/profile', { cache: 'no-store' });
        if (res.ok) setProfile(await res.json());
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  return (
    <div className="flex flex-col h-full bg-surface">
      <div className="sticky top-0 z-40 bg-surface/80 backdrop-blur-md">
        <Header title="Profile" />
      </div>

      <main ref={scrollerRef} className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="max-w-6xl mx-auto space-y-5">
          {loading ? (
            <div className="flex justify-center py-16"><Spinner /></div>
          ) : !profile ? (
            <div className="text-center py-16 text-on-surface-variant">Failed to load profile.</div>
          ) : (
            <>
              <ProfileHero profile={profile} />

              <div className="grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)] items-start">
                <div className="lg:sticky lg:top-0">
                  <BadgeShelf profile={profile} />
                </div>

                <div className="min-w-0 space-y-5">
                  <ActivityHeatmap activityMap={profile.activityMap} streak={profile.streak ?? 0} />
                  <HistoryTimeline timeline={profile.timeline} scrollerRef={scrollerRef} />
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
