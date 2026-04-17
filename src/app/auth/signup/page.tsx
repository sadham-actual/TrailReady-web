'use client';

import { FormEvent, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const next = searchParams.get('next') || '/profile';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
    setLoading(true);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${appUrl}/` },
    });
    setLoading(false);
    if (error) { setError(error.message); return; }
    if (data.session) { router.push(next); return; }
    setSuccess(true);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-bone flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="mb-6 text-center">
            <span className="font-mono text-sm font-bold uppercase tracking-widest text-deep-stone">TrailReady</span>
          </div>
          <div className="border border-stone-800 bg-surface shadow-[4px_4px_0_0_var(--color-stone-border)]">
            <div className="border-b border-stone-800 px-6 py-4">
              <p className="font-mono text-xs uppercase tracking-wider text-status-clear">Verify Email</p>
              <h1 className="mt-0.5 text-lg font-bold text-deep-stone">Check your inbox</h1>
            </div>
            <div className="px-6 py-5 space-y-4">
              <p className="text-sm text-muted-stone">
                We sent a verification link to{' '}
                <span className="font-semibold text-deep-stone">{email}</span>.
                Click it to activate your account, then log in.
              </p>
              <Button asChild variant="outline" className="w-full" size="lg">
                <Link href={`/auth/login?next=${encodeURIComponent(next)}`}>Go to login</Link>
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
            <p className="font-mono text-xs uppercase tracking-wider text-muted-stone">New Account</p>
            <h1 className="mt-0.5 text-lg font-bold text-deep-stone">Create account</h1>
          </div>

          <form onSubmit={onSubmit} className="px-6 py-5 space-y-4">
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

            <div className="space-y-1">
              <label className="font-mono text-xs uppercase tracking-wider text-muted-stone">Password</label>
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
              <label className="font-mono text-xs uppercase tracking-wider text-muted-stone">Confirm Password</label>
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
              {loading ? 'Creating account...' : 'Create account'}
            </Button>
          </form>

          <div className="border-t border-stone-800 px-6 py-4">
            <p className="font-mono text-xs uppercase tracking-wider text-muted-stone">
              Already have an account?{' '}
              <Link
                href={`/auth/login?next=${encodeURIComponent(next)}`}
                className="text-action-orange hover:text-action-orange-dark"
              >
                Log in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
