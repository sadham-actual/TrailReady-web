'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function UpdatePasswordPage() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    // Supabase fires PASSWORD_RECOVERY when the user arrives via the reset link
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true);
    });
    // Also handle case where session is already established
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, [supabase]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) { setError(error.message); return; }
    setDone(true);
    setTimeout(() => router.push('/profile'), 2000);
  };

  if (done) {
    return (
      <div className="min-h-screen bg-bone flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="mb-6 text-center">
            <span className="font-mono text-sm font-bold uppercase tracking-widest text-deep-stone">TrailReady</span>
          </div>
          <div className="border border-stone-800 bg-surface shadow-[4px_4px_0_0_var(--color-stone-border)]">
            <div className="border-b border-stone-800 px-6 py-4">
              <p className="font-mono text-xs uppercase tracking-wider text-status-clear">Success</p>
              <h1 className="mt-0.5 text-lg font-bold text-deep-stone">Password updated</h1>
            </div>
            <div className="px-6 py-5">
              <p className="text-sm text-muted-stone">Your password has been changed. Redirecting you now...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bone flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <span className="font-mono text-sm font-bold uppercase tracking-widest text-deep-stone">TrailReady</span>
        </div>

        <div className="border border-stone-800 bg-surface shadow-[4px_4px_0_0_var(--color-stone-border)]">
          <div className="border-b border-stone-800 px-6 py-4">
            <p className="font-mono text-xs uppercase tracking-wider text-muted-stone">Account Recovery</p>
            <h1 className="mt-0.5 text-lg font-bold text-deep-stone">Set new password</h1>
          </div>

          {!ready ? (
            <div className="px-6 py-5">
              <p className="font-mono text-xs uppercase tracking-wider text-muted-stone">Verifying reset link...</p>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="px-6 py-5 space-y-4">
              <div className="space-y-1">
                <label className="font-mono text-xs uppercase tracking-wider text-muted-stone">New Password</label>
                <Input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="placeholder:normal-case placeholder:tracking-normal placeholder:font-sans"
                />
              </div>

              <div className="space-y-1">
                <label className="font-mono text-xs uppercase tracking-wider text-muted-stone">Confirm New Password</label>
                <Input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="placeholder:normal-case placeholder:tracking-normal placeholder:font-sans"
                />
              </div>

              {error && (
                <div className="border border-red-700 bg-red-50 px-3 py-2">
                  <p className="font-mono text-xs uppercase tracking-wider text-red-700">{error}</p>
                </div>
              )}

              <Button type="submit" disabled={loading} className="w-full" size="lg">
                {loading ? 'Updating...' : 'Update password'}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
