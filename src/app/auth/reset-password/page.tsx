'use client';

import { FormEvent, useMemo, useState } from 'react';
import Link from 'next/link';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function ResetPasswordPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${appUrl}/auth/update-password`,
    });
    setLoading(false);
    if (error) { setError(error.message); return; }
    setSent(true);
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-bone flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="mb-6 text-center">
            <span className="font-mono text-sm font-bold uppercase tracking-widest text-deep-stone">TrailReady</span>
          </div>
          <div className="border border-stone-800 bg-surface shadow-[4px_4px_0_0_var(--color-stone-border)]">
            <div className="border-b border-stone-800 px-6 py-4">
              <p className="font-mono text-xs uppercase tracking-wider text-status-clear">Email Sent</p>
              <h1 className="mt-0.5 text-lg font-bold text-deep-stone">Check your inbox</h1>
            </div>
            <div className="px-6 py-5 space-y-4">
              <p className="text-sm text-muted-stone">
                If an account exists for{' '}
                <span className="font-semibold text-deep-stone">{email}</span>,
                you&apos;ll receive a reset link shortly.
              </p>
              <Button asChild variant="outline" className="w-full" size="lg">
                <Link href="/auth/login">Back to login</Link>
              </Button>
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
            <h1 className="mt-0.5 text-lg font-bold text-deep-stone">Reset password</h1>
          </div>

          <form onSubmit={onSubmit} className="px-6 py-5 space-y-4">
            <p className="text-sm text-muted-stone">
              Enter your email and we&apos;ll send you a link to reset your password.
            </p>

            <div className="space-y-1">
              <label className="font-mono text-xs uppercase tracking-wider text-muted-stone">Email</label>
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="placeholder:normal-case placeholder:tracking-normal placeholder:font-sans"
              />
            </div>

            {error && (
              <div className="border border-red-700 bg-red-50 px-3 py-2">
                <p className="font-mono text-xs uppercase tracking-wider text-red-700">{error}</p>
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full" size="lg">
              {loading ? 'Sending...' : 'Send reset link'}
            </Button>
          </form>

          <div className="border-t border-stone-800 px-6 py-4">
            <p className="font-mono text-xs uppercase tracking-wider text-muted-stone">
              Remember it?{' '}
              <Link href="/auth/login" className="text-action-orange hover:text-action-orange-dark">
                Back to login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
