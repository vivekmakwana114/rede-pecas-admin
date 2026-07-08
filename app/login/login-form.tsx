'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle } from 'lucide-react';

export function LoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setLoginError(data.error || 'Incorrect password.');
        return;
      }

      router.push('/dashboard');
      router.refresh();
    } catch {
      setLoginError('Could not reach the server. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleLogin} className="space-y-6">
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">Access Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter the administrator password"
          className="w-full px-4 py-3 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
          required
        />
      </div>

      {loginError && (
        <div className="flex items-center gap-2 text-red-600 text-xs bg-red-50 p-3 rounded-lg">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{loginError}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg transition-all disabled:opacity-60"
      >
        {submitting ? 'Logging in…' : 'Log In to Panel'}
      </button>
    </form>
  );
}
