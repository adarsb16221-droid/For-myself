'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setMessage('');

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send OTP');

      setMessage(data.message || 'OTP sent to your email.');
      setStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setMessage('');

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reset password');

      setMessage('Password reset successfully. Redirecting to login...');
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4">
      <div className="w-full max-w-md glass-panel p-8 rounded-2xl shadow-2xl relative z-10 flex flex-col gap-6">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4 border border-primary/30">
            <span className="material-symbols-outlined text-primary text-[32px]">key</span>
          </div>
          <h1 className="font-display-lg-mobile text-[32px] font-bold text-primary mb-2">Reset Password</h1>
          <p className="text-on-surface-variant text-sm">
            {step === 1 ? 'Enter your email to receive an OTP' : 'Enter the OTP and your new password'}
          </p>
        </div>

        {error && (
          <div className="bg-error/10 text-error px-4 py-3 rounded-lg text-sm border border-error/20 flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">error</span>
            {error}
          </div>
        )}

        {message && (
          <div className="bg-primary/10 text-primary px-4 py-3 rounded-lg text-sm border border-primary/20 flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">info</span>
            {message}
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleRequestOtp} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-on-surface">Email Address</label>
              <input 
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-surface-container-high/50 border border-white/10 rounded-lg px-4 py-3 text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-body-sm"
                placeholder="you@example.com"
                required
              />
            </div>
            
            <button 
              type="submit"
              disabled={isLoading}
              className="mt-2 bg-primary text-on-primary px-6 py-3.5 rounded-lg font-title-sm text-[16px] font-semibold hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_20px_rgba(70,72,212,0.3)] disabled:opacity-70 disabled:hover:scale-100 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
              ) : (
                'Send OTP'
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-on-surface">OTP (6 Digits)</label>
              <input 
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="bg-surface-container-high/50 border border-white/10 rounded-lg px-4 py-3 text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-body-sm tracking-widest font-mono"
                placeholder="000000"
                maxLength={6}
                required
              />
            </div>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-on-surface">New Password</label>
              <input 
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="bg-surface-container-high/50 border border-white/10 rounded-lg px-4 py-3 text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-body-sm"
                placeholder="••••••••"
                required
              />
            </div>

            <button 
              type="submit"
              disabled={isLoading}
              className="mt-2 bg-primary text-on-primary px-6 py-3.5 rounded-lg font-title-sm text-[16px] font-semibold hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_20px_rgba(70,72,212,0.3)] disabled:opacity-70 disabled:hover:scale-100 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
              ) : (
                'Reset Password'
              )}
            </button>
          </form>
        )}

        <div className="text-center mt-2 border-t border-white/10 pt-4">
          <Link href="/login" className="text-on-surface-variant text-sm hover:text-primary transition-colors flex items-center justify-center gap-1">
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
