'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

export default function NotificationsModal({ isOpen, onClose }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const [friendsRes, challengesRes, dbNotifsRes] = await Promise.all([
        fetch('/api/users/friend-request', { cache: 'no-store' }),
        fetch('/api/challenges', { cache: 'no-store' }),
        fetch('/api/notifications', { cache: 'no-store' })
      ]);
      
      let notifs = [];
      
      if (friendsRes.ok) {
        const friendsData = await friendsRes.json();
        const fNotifs = friendsData.map(f => ({
          _id: `friend_${f._id}`,
          type: 'friend_request',
          senderId: f._id,
          senderName: f.name,
          title: 'Friend Request',
          message: 'Sent you a friend request'
        }));
        notifs = [...notifs, ...fNotifs];
      }

      if (challengesRes.ok && user) {
        const challengesData = await challengesRes.json();
        const pendingChallenges = challengesData.filter(c => c.status === 'pending' && c.recipient._id === user._id);
        const cNotifs = pendingChallenges.map(c => ({
          _id: `challenge_${c._id}`,
          type: 'challenge_request',
          challengeId: c._id,
          senderName: c.creator.name,
          title: 'Challenge Received',
          message: `Sent you a ${c.type === 'mutual' ? 'mutual' : 'solo'} challenge`
        }));
        notifs = [...notifs, ...cNotifs];
      }

      if (dbNotifsRes.ok) {
        const dbNotifsData = await dbNotifsRes.json();
        const dbNotifs = dbNotifsData.map(n => ({
          _id: n._id,
          type: 'db_notification',
          senderName: 'App', // Fallback, could extract from message if we parsed it
          title: n.title,
          message: n.message,
        }));
        notifs = [...notifs, ...dbNotifs];
      }

      setNotifications(notifs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      fetchNotifications();
    }
  }, [isOpen]);

  const handleAction = async (notif, action) => {
    try {
      // Optimistic UI
      setNotifications(notifications.filter(n => n._id !== notif._id));
      
      if (notif.type === 'friend_request') {
        await fetch('/api/users/friend-request', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ requesterId: notif.senderId, action })
        });
      } else if (notif.type === 'challenge_request') {
        await fetch(`/api/challenges/${notif.challengeId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action })
        });
      } else if (notif.type === 'db_notification' && action === 'dismiss') {
        await fetch('/api/notifications', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notificationId: notif._id })
        });
      }
    } catch (err) {
      console.error(err);
      fetchNotifications(); // Revert on error
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-surface-container-highest/80 backdrop-blur-sm">
      <div className="bg-surface rounded-2xl w-full max-w-md shadow-2xl border border-on-surface/10 overflow-hidden flex flex-col max-h-[80vh]">
        <div className="p-4 border-b border-on-surface/10 flex justify-between items-center">
          <h2 className="font-title-lg font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">notifications</span>
            Notifications
          </h2>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-on-surface/5 text-on-surface-variant"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="p-4 flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center p-8 text-on-surface-variant">
              <span className="material-symbols-outlined animate-spin text-[24px]">progress_activity</span>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center p-8">
              <span className="material-symbols-outlined text-[48px] text-on-surface-variant/50 mb-2">notifications_off</span>
              <p className="text-on-surface-variant font-medium">No new notifications</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map(notif => (
                <div key={notif._id} className="bg-surface-container rounded-xl p-3 flex flex-col gap-3 border border-outline-variant/30">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg uppercase">
                      {notif.senderName.charAt(0)}
                    </div>
                    <div>
                      <p className="font-title-md font-bold text-on-surface leading-tight">{notif.senderName}</p>
                      <p className="font-body-sm text-on-surface-variant">{notif.message}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {notif.type === 'db_notification' ? (
                      <button 
                        onClick={() => handleAction(notif, 'dismiss')}
                        className="flex-1 bg-surface-variant text-on-surface-variant py-2 rounded-lg font-label-lg font-bold hover:bg-surface-variant/80 transition-colors"
                      >
                        Dismiss
                      </button>
                    ) : (
                      <>
                        <button 
                          onClick={() => handleAction(notif, 'accept')}
                          className="flex-1 bg-primary text-on-primary py-2 rounded-lg font-label-lg font-bold hover:bg-primary/90 transition-colors"
                        >
                          Accept
                        </button>
                        <button 
                          onClick={() => handleAction(notif, 'reject')}
                          className="flex-1 bg-error/10 text-error py-2 rounded-lg font-label-lg font-bold hover:bg-error/20 transition-colors"
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
