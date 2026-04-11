'use client';

import { useState } from 'react';

function ViewfinderCorners() {
  return (
    <>
      <span className="absolute left-0 top-0 h-3 w-3 border-l border-t border-stone-800" />
      <span className="absolute right-0 top-0 h-3 w-3 border-r border-t border-stone-800" />
      <span className="absolute left-0 bottom-0 h-3 w-3 border-l border-b border-stone-800" />
      <span className="absolute right-0 bottom-0 h-3 w-3 border-r border-b border-stone-800" />
    </>
  );
}

export default function ExpeditionWaitlistPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!email.trim()) return;
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col items-center justify-center px-6 py-16">
        <header className="mb-12 text-center">
          <div className="font-mono text-xs uppercase tracking-[0.3em] text-stone-900">
            TRAILREADY
          </div>
        </header>

        <section className="w-full">
          <div className="relative border border-stone-800 bg-stone-100 px-6 py-10 sm:px-10">
            <ViewfinderCorners />
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.06)_1px,transparent_1px)] bg-[size:24px_24px]" />

            <div className="relative z-10 space-y-8">
              <div className="text-center">
                <h1 className="font-mono text-xl sm:text-2xl uppercase tracking-wider">
                  JOIN THE EXPEDITION. GET REAL-TIME INTEL BEFORE YOU REACH THE TRAILHEAD.
                </h1>
              </div>

              {!submitted ? (
                <form onSubmit={handleSubmit} className="mx-auto flex w-full max-w-xl flex-col gap-4 sm:flex-row">
                  <label className="sr-only" htmlFor="waitlist-email">
                    Email
                  </label>
                  <input
                    id="waitlist-email"
                    type="email"
                    placeholder="YOUR EMAIL"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="h-12 w-full flex-1 rounded-none border border-stone-800 bg-stone-50 px-4 font-mono text-xs uppercase tracking-wider text-stone-900 placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-action-orange/40"
                    required
                  />
                  <button
                    type="submit"
                    className="h-12 whitespace-nowrap rounded-none border border-stone-800 bg-stone-900 px-6 font-mono text-xs uppercase tracking-wider text-stone-100 transition-colors hover:bg-action-orange"
                  >
                    ENLIST
                  </button>
                </form>
              ) : (
                <div className="text-center font-mono text-xs uppercase tracking-wider text-stone-900">
                  COMMUNICATION RECEIVED
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
