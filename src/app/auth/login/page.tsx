'use client';

import { FormEvent, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const next = searchParams.get('next') || '/profile';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) { setError(error.message); return; }
    router.push(next);
  };

  const onGoogleSignIn = async () => {
    setError('');
    setGoogleLoading(true);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${appUrl}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    if (error) {
      setError(error.message);
      setGoogleLoading(false);
    }
    // On success, browser redirects to Google — no need to set loading false
  };

  return (
    <div className="min-h-screen bg-bone flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <span className="font-mono text-sm font-bold uppercase tracking-widest text-deep-stone">TrailReady</span>
        </div>

        <div className="border border-stone-800 bg-surface shadow-[4px_4px_0_0_var(--color-stone-border)]">
          <div className="border-b border-stone-800 px-6 py-4">
            <p className="font-mono text-xs uppercase tracking-wider text-muted-stone">Account Access</p>
            <h1 className="mt-0.5 text-lg font-bold text-deep-stone">Log in</h1>
          </div>

          <div className="px-6 pt-5">
            <button
              type="button"
              onClick={onGoogleSignIn}
              disabled={googleLoading || loading}
              className="w-full flex items-center justify-center gap-3 h-11 border border-stone-800 bg-surface hover:bg-stone-50 shadow-[2px_2px_0_0_var(--color-stone-border)] active:shadow-[1px_1px_0_0_var(--color-stone-border)] active:translate-x-px active:translate-y-px transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <GoogleIcon />
              <span className="font-mono text-xs uppercase tracking-wider text-deep-stone">
                {googleLoading ? 'Redirecting...' : 'Continue with Google'}
              </span>
            </button>

            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px bg-stone-border" />
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted-stone">or</span>
              <div className="flex-1 h-px bg-stone-border" />
            </div>
          </div>

          <form onSubmit={onSubmit} className="px-6 pb-5 space-y-4">
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
              <div className="flex items-center justify-between">
                <label className="font-mono text-xs uppercase tracking-wider text-muted-stone">Password</label>
                <Link
                  href="/auth/reset-password"
                  className="font-mono text-xs uppercase tracking-wider text-action-orange hover:text-action-orange-dark"
                >
                  Forgot?
                </Link>
              </div>
              <Input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="placeholder:normal-case placeholder:tracking-normal placeholder:font-sans"
              />
            </div>

            {error && (
              <div className="border border-red-700 bg-red-50 px-3 py-2">
                <p className="font-mono text-xs uppercase tracking-wider text-red-700">{error}</p>
              </div>
            )}

            <Button type="submit" disabled={loading || googleLoading} className="w-full" size="lg">
              {loading ? 'Logging in...' : 'Log in'}
            </Button>
          </form>

          <div className="border-t border-stone-800 px-6 py-4">
            <p className="font-mono text-xs uppercase tracking-wider text-muted-stone">
              No account?{' '}
              <Link
                href={`/auth/signup?next=${encodeURIComponent(next)}`}
                className="text-action-orange hover:text-action-orange-dark"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
