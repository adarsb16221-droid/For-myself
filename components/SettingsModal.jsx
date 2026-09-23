'use client';
import { useState } from 'react';

export default function SettingsModal({ isOpen, onClose }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ text: '', type: '' });

    if (newPassword !== confirmPassword) {
      setMessage({ text: 'New passwords do not match.', type: 'error' });
      return;
    }

    if (newPassword.length < 6) {
      setMessage({ text: 'New password must be at least 6 characters long.', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage({ text: data.error || 'Failed to change password.', type: 'error' });
      } else {
        setMessage({ text: 'Password changed successfully!', type: 'success' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => {
          onClose();
          setMessage({ text: '', type: '' });
        }, 2000);
      }
    } catch (err) {
      setMessage({ text: 'An error occurred. Please try again.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-surface-container-highest/80 backdrop-blur-sm">
      <div className="bg-surface rounded-2xl w-full max-w-md shadow-2xl border border-on-surface/10 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-on-surface/10 flex justify-between items-center">
          <h2 className="font-title-lg font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">settings</span>
            Settings
          </h2>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-on-surface/5 text-on-surface-variant"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto">
          <h3 className="font-title-md font-bold text-on-surface mb-4">Change Password</h3>
          
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-on-surface">Current Password</label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full bg-surface-container rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary focus:outline-none text-on-surface border border-on-surface/20"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-on-surface">New Password</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-surface-container rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary focus:outline-none text-on-surface border border-on-surface/20"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-on-surface">Confirm New Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-surface-container rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary focus:outline-none text-on-surface border border-on-surface/20"
              />
            </div>

            {message.text && (
              <div className={`p-3 rounded-lg text-sm font-medium ${message.type === 'error' ? 'bg-error/10 text-error' : 'bg-primary/10 text-primary'}`}>
                {message.text}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full bg-primary text-on-primary py-2 rounded-lg font-label-lg font-bold hover:bg-primary/90 transition-colors flex items-center justify-center"
            >
              {loading ? (
                <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
              ) : (
                'Update Password'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
