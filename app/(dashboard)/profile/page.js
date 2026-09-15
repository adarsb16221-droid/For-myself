'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Spinner from '@/components/Spinner';

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch('/api/users/profile');
        if (res.ok) {
          setProfile(await res.json());
        }
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

      <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
        <div className="max-w-4xl mx-auto space-y-8">
          
          {loading ? (
            <div className="flex justify-center py-12"><Spinner /></div>
          ) : !profile ? (
            <div className="text-center py-12 text-on-surface-variant">Failed to load profile.</div>
          ) : (
            <>
              {/* Profile Card */}
              <div className="bg-surface-container rounded-3xl p-8 flex flex-col md:flex-row items-center gap-8 border border-outline-variant/30 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
                
                <div className="w-32 h-32 rounded-full bg-primary/10 flex flex-shrink-0 items-center justify-center text-primary font-bold text-5xl uppercase border border-primary/20 shadow-inner z-10">
                  {profile.user.name.charAt(0)}
                </div>
                
                <div className="text-center md:text-left flex-1 z-10">
                  <h1 className="text-4xl font-headline-lg font-bold text-on-surface mb-2 tracking-tight">
                    {profile.user.name}
                  </h1>
                  <p className="text-on-surface-variant font-body-lg mb-6">{profile.user.email}</p>
                  
                  <div className="inline-flex items-center gap-3 bg-surface rounded-2xl px-6 py-4 shadow-sm border border-outline-variant/50">
                    <div className="w-12 h-12 rounded-full bg-tertiary/10 flex items-center justify-center text-tertiary">
                      <span className="material-symbols-outlined text-[28px] font-bold">stars</span>
                    </div>
                    <div>
                      <p className="text-sm font-label-md text-on-surface-variant uppercase tracking-wider font-bold mb-0.5">Orbit Points</p>
                      <p className="text-3xl font-bold text-on-surface leading-none">{profile.user.orbitPoints || 0}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* History Timeline */}
              <div>
                <h2 className="text-2xl font-title-lg font-bold text-on-surface mb-6 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">history</span>
                  Completed History
                </h2>

                {profile.timeline.length === 0 ? (
                  <div className="bg-surface-container rounded-2xl p-8 text-center border border-outline-variant/30">
                    <span className="material-symbols-outlined text-[48px] text-on-surface-variant mb-4">hourglass_empty</span>
                    <h3 className="font-title-lg font-bold text-on-surface mb-2">No history yet</h3>
                    <p className="text-on-surface-variant">Complete tasks, habits, and challenges to earn points!</p>
                  </div>
                ) : (
                  <div className="space-y-4 relative before:absolute before:inset-0 before:ml-6 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-outline-variant/50 before:to-transparent">
                    {profile.timeline.map((item, index) => (
                      <div key={item.id + index} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                        {/* Timeline Dot */}
                        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-surface-container border-[4px] border-surface shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 relative z-10 transition-transform group-hover:scale-110">
                          {item.type === 'challenge' ? (
                            <span className="material-symbols-outlined text-tertiary text-[20px]">emoji_events</span>
                          ) : item.type === 'habit' ? (
                            <span className="material-symbols-outlined text-secondary text-[20px]">cycle</span>
                          ) : (
                            <span className="material-symbols-outlined text-primary text-[20px]">task_alt</span>
                          )}
                        </div>

                        {/* Card */}
                        <div className="w-[calc(100%-4rem)] md:w-[calc(50%-3rem)] bg-surface-container p-5 rounded-2xl border border-outline-variant/30 shadow-sm transition-shadow group-hover:shadow-md">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex flex-col gap-1">
                              <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                                {new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                              </span>
                              <h3 className="font-title-md font-bold text-on-surface leading-tight">
                                {item.title}
                              </h3>
                            </div>
                            <div className="bg-primary/10 text-primary px-2.5 py-1 rounded-lg flex items-center gap-1 font-bold text-sm shrink-0">
                              +{item.points} <span className="material-symbols-outlined text-[14px]">stars</span>
                            </div>
                          </div>
                          
                          {item.type === 'challenge' && (
                            <p className="text-sm text-on-surface-variant mt-2 flex items-center gap-1.5 bg-surface p-2 rounded-lg border border-outline-variant/20 inline-flex">
                              <span className="material-symbols-outlined text-[16px]">group</span>
                              With {item.with}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

        </div>
      </main>
    </div>
  );
}
