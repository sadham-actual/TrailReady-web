'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { evaluateTrailFit, TrailRequirementProfile, TripBundle, UserVehicle } from '@/domain/planning';
import { trailService } from '@/services/trailService';
import { Trail } from '@/types';
import { IndexedDbCacheAdapter } from '@/services/offline/indexedDbCache';
import { PlannerSyncService } from '@/services/offline/plannerSyncService';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

type PlannerVehicleResponse = {
  success?: boolean;
  data?: Array<{
    rig_tier?: UserVehicle['rig_tier'];
    make: string;
    model: string;
    clearance_inches: number | string;
    tire_size: number | string;
    has_low_range: boolean;
    has_winch: boolean;
    experience_level: UserVehicle['experience_level'];
  }>;
};

type PlannerBundlesResponse = {
  success?: boolean;
  data?: Array<{
    id: string;
    user_id: string;
    scheduled_date: string;
    notes?: string;
    is_offline_cached?: boolean;
    trails?: Array<{ trail_id: string }>;
  }>;
};

const cache = new PlannerSyncService(new IndexedDbCacheAdapter());

const defaultVehicle: UserVehicle = {
  rig_tier: 'highClearance4x4',
  make: 'Jeep',
  model: 'Wrangler',
  clearance_inches: null,
  tire_size: 33,
  has_low_range: true,
  has_winch: false,
  experience_level: 'Intermediate',
};

function toRequirementProfile(trail: Trail): TrailRequirementProfile {
  return {
    id: trail.id,
    name: trail.name,
    difficulty_score: trail.difficultyScore ?? Math.min(10, Math.max(1, ((trail.baseDifficulty ?? 2) * 2) + 2)),
    terrain_type: trail.terrainType ?? 'Rock',
    min_tire_size: trail.minTireSize ?? 31,
    required_gear: trail.requiredGear ?? [],
    current_status: trail.currentStatus ?? 'Open',
  };
}

export default function PlannerPage() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [userId, setUserId] = useState<string>('');
  const [authToken, setAuthToken] = useState<string>('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [vehicle, setVehicle] = useState<UserVehicle>(defaultVehicle);
  const [trails, setTrails] = useState<Trail[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [scheduledDate, setScheduledDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [savedBundles, setSavedBundles] = useState<TripBundle[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingBundleId, setDeletingBundleId] = useState<string | null>(null);

  useEffect(() => {
    const boot = async () => {
      try {
        const [{ data: sessionData }, liveTrails] = await Promise.all([
          supabase.auth.getSession(),
          trailService.getTrails(),
        ]);

        setTrails(liveTrails);
        await cache.cacheTrailMetadata(liveTrails);

        const session = sessionData.session;
        if (session?.user?.id) {
          setUserId(session.user.id);
          setAuthToken(session.access_token);
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
          setUserId('');
          setAuthToken('');
        }
      } catch {
        const fallback = await cache.loadOfflineTrails();
        setTrails(fallback);
      }
    };

    void boot();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user?.id) {
        setUserId(session.user.id);
        setAuthToken(session.access_token);
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
        setUserId('');
        setAuthToken('');
      }
    });

    return () => sub.subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    if (!userId || !authToken) return;

    const loadPlannerState = async () => {
      try {
        const [vehiclesRes, bundlesRes] = await Promise.all([
          fetch(`/api/planner/vehicles?userId=${encodeURIComponent(userId)}`, {
            headers: { Authorization: `Bearer ${authToken}` },
          }),
          fetch(`/api/planner/trip-bundles?userId=${encodeURIComponent(userId)}`, {
            headers: { Authorization: `Bearer ${authToken}` },
          }),
        ]);

        const vehiclesJson = (await vehiclesRes.json()) as PlannerVehicleResponse;
        const bundlesJson = (await bundlesRes.json()) as PlannerBundlesResponse;

        if (vehiclesJson?.success && vehiclesJson.data && vehiclesJson.data.length > 0) {
          const v = vehiclesJson.data[0];
          setVehicle({
            rig_tier: v.rig_tier ?? 'stockAWD',
            make: v.make,
            model: v.model,
            clearance_inches: v.clearance_inches != null && v.clearance_inches !== '' ? Number(v.clearance_inches) : null,
            tire_size: Number(v.tire_size),
            has_low_range: Boolean(v.has_low_range),
            has_winch: Boolean(v.has_winch),
            experience_level: v.experience_level,
          });
        }

        if (bundlesJson?.success && Array.isArray(bundlesJson.data)) {
          const mapped: TripBundle[] = bundlesJson.data.map((bundle) => ({
            id: bundle.id,
            user_id: bundle.user_id,
            trail_ids: (bundle.trails ?? []).map((trail) => trail.trail_id),
            scheduled_date: bundle.scheduled_date,
            notes: bundle.notes ?? '',
            is_offline_cached: Boolean(bundle.is_offline_cached),
          }));
          setSavedBundles(mapped);
          await cache.cacheTripBundles(mapped);
        }
      } catch {
        const localBundles = await cache.loadOfflineTripBundles();
        setSavedBundles(localBundles.filter((b) => b.user_id === userId));
      }
    };

    void loadPlannerState();
  }, [userId, authToken]);

  const selectedTrails = useMemo(
    () => trails.filter((t) => selected.includes(t.id)).slice(0, 3),
    [selected, trails]
  );

  const toggleTrail = (trailId: string) => {
    setSelected((prev) => {
      if (prev.includes(trailId)) return prev.filter((id) => id !== trailId);
      if (prev.length >= 3) return prev;
      return [...prev, trailId];
    });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const saveVehicleProfile = async () => {
    if (!userId || !isAuthenticated || !authToken) return;
    await fetch('/api/planner/vehicles', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        userId,
        ...vehicle,
      }),
    });
  };

  const saveBundle = async () => {
    if (!userId || !isAuthenticated || !authToken || selectedTrails.length !== 3) return;
    setIsSaving(true);
    try {
      const res = await fetch('/api/planner/trip-bundles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          user_id: userId,
          trail_ids: selectedTrails.map((t) => t.id),
          scheduled_date: new Date(scheduledDate).toISOString(),
          notes,
          is_offline_cached: false,
        }),
      });
      const json = await res.json();
      if (json?.success) {
        const created: TripBundle = {
          id: json.data.id,
          user_id: userId,
          trail_ids: selectedTrails.map((t) => t.id),
          scheduled_date: json.data.scheduled_date ?? new Date(scheduledDate).toISOString(),
          notes,
          is_offline_cached: Boolean(json.data.is_offline_cached),
        };
        const next = [created, ...savedBundles].slice(0, 10);
        setSavedBundles(next);
        await cache.cacheTripBundles(next);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const deleteBundle = async (bundleId: string) => {
    if (!isAuthenticated || !authToken) return;
    setDeletingBundleId(bundleId);
    try {
      await fetch(`/api/planner/trip-bundles?id=${encodeURIComponent(bundleId)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const next = savedBundles.filter((b) => b.id !== bundleId);
      setSavedBundles(next);
      await cache.cacheTripBundles(next);
    } finally {
      setDeletingBundleId(null);
    }
  };

  const [trailSearch, setTrailSearch] = useState('');

  const filteredTrails = useMemo(() => {
    const q = trailSearch.trim().toLowerCase();
    if (!q) return trails;
    return trails.filter((t) => t.name.toLowerCase().includes(q) || (t.region ?? '').toLowerCase().includes(q));
  }, [trails, trailSearch]);

  const trailNameMap = useMemo(() => new Map(trails.map((t) => [t.id, t.name])), [trails]);

  return (
    <div className="min-h-screen p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Trail Planner</h1>
      <p className="text-sm text-stone-600 mb-3">Select up to 3 trails, compare vehicle fit side-by-side, and save trip bundles.</p>
      <div className="mb-6 flex items-center justify-between border rounded px-3 py-2 bg-stone-50">
        <p className="text-sm text-stone-700">
          {isAuthenticated ? `Signed in as ${userId}` : 'Read-only mode. Sign in required for save/report actions.'}
        </p>
        {isAuthenticated ? (
          <button onClick={() => void signOut()} className="text-sm px-3 py-1 border rounded">Sign out</button>
        ) : (
          <button onClick={() => router.push('/auth/login?next=/planner')} className="text-sm px-3 py-1 bg-stone-900 text-white rounded">Sign in</button>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <section className="border rounded p-4 lg:col-span-1">
          <h2 className="font-semibold mb-3">My Vehicle</h2>
          <div className="space-y-3 text-sm">
            <div>
              <label className="block text-xs uppercase tracking-wide text-stone-600 mb-1">Rig Tier</label>
              <select className="w-full border rounded px-2 py-1" value={vehicle.rig_tier} onChange={(e) => setVehicle({ ...vehicle, rig_tier: e.target.value as UserVehicle['rig_tier'] })}>
                <option value="stockAWD">Stock AWD</option>
                <option value="highClearance4x4">High Clearance 4x4</option>
                <option value="modified4x4">Modified 4x4</option>
                <option value="extremeBuild">Extreme Build</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs uppercase tracking-wide text-stone-600 mb-1">Make</label>
                <input className="w-full border rounded px-2 py-1" value={vehicle.make} onChange={(e) => setVehicle({ ...vehicle, make: e.target.value })} placeholder="e.g. Jeep" />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wide text-stone-600 mb-1">Model</label>
                <input className="w-full border rounded px-2 py-1" value={vehicle.model} onChange={(e) => setVehicle({ ...vehicle, model: e.target.value })} placeholder="e.g. Wrangler" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs uppercase tracking-wide text-stone-600 mb-1">Clearance (in) <span className="normal-case text-stone-400">optional</span></label>
                <input
                  className="w-full border rounded px-2 py-1"
                  type="number"
                  value={vehicle.clearance_inches ?? ''}
                  placeholder="e.g. 10"
                  onChange={(e) => setVehicle({ ...vehicle, clearance_inches: e.target.value === '' ? null : Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wide text-stone-600 mb-1">Tire Size (in)</label>
                <input className="w-full border rounded px-2 py-1" type="number" value={vehicle.tire_size} onChange={(e) => setVehicle({ ...vehicle, tire_size: Number(e.target.value) })} />
              </div>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wide text-stone-600 mb-1">Experience Level</label>
              <select className="w-full border rounded px-2 py-1" value={vehicle.experience_level} onChange={(e) => setVehicle({ ...vehicle, experience_level: e.target.value as UserVehicle['experience_level'] })}>
                <option>Beginner</option>
                <option>Intermediate</option>
                <option>Advanced</option>
              </select>
            </div>
            <div className="flex gap-4 pt-1">
              <label className="flex items-center gap-2"><input type="checkbox" checked={vehicle.has_low_range} onChange={(e) => setVehicle({ ...vehicle, has_low_range: e.target.checked })} /> Low range</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={vehicle.has_winch} onChange={(e) => setVehicle({ ...vehicle, has_winch: e.target.checked })} /> Winch</label>
            </div>
            <button disabled={!isAuthenticated} onClick={() => void saveVehicleProfile()} className="w-full bg-stone-900 disabled:bg-stone-400 text-white rounded px-3 py-2">
              {isAuthenticated ? 'Save Vehicle' : 'Sign in to Save Vehicle'}
            </button>
          </div>
        </section>

        <section className="border rounded p-4 lg:col-span-1">
          <h2 className="font-semibold mb-3">Available Trails</h2>
          <input
            type="text"
            value={trailSearch}
            onChange={(e) => setTrailSearch(e.target.value)}
            placeholder="Filter trails..."
            className="w-full border rounded px-2 py-1 text-sm mb-3"
          />
          <div className="space-y-2 max-h-[380px] overflow-auto">
            {filteredTrails.length === 0 && (
              <p className="text-sm text-stone-500 py-2">No trails match &ldquo;{trailSearch}&rdquo;.</p>
            )}
            {filteredTrails.map((trail) => (
              <button
                key={trail.id}
                onClick={() => toggleTrail(trail.id)}
                className={`w-full text-left border rounded px-3 py-2 ${selected.includes(trail.id) ? 'bg-stone-900 text-white' : 'bg-white'}`}
              >
                {trail.name} <span className="text-xs opacity-80">({trail.region})</span>
              </button>
            ))}

          </div>
        </section>

        <section className="border rounded p-4 lg:col-span-1">
          <h2 className="font-semibold mb-3">Comparison View ({selectedTrails.length}/3)</h2>
          <div className="space-y-3">
            {selectedTrails.map((trail) => {
              const req = toRequirementProfile(trail);
              const fit = evaluateTrailFit(vehicle, req);
              return (
                <div key={trail.id} className="border rounded p-3">
                  <div className="font-medium">{trail.name}</div>
                  <div className="text-sm text-stone-600">{req.terrain_type} · Difficulty {req.difficulty_score}/10 · Min tire {req.min_tire_size}&quot;</div>
                  <div className="mt-2 text-sm">Fit: <span className={fit.status === 'Green' ? 'text-green-700' : fit.status === 'Yellow' ? 'text-amber-700' : 'text-red-700'}>{fit.status}</span></div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 space-y-2">
            <label className="block text-xs uppercase tracking-wide text-stone-600">Trip date</label>
            <input
              type="date"
              className="w-full border rounded px-2 py-1 text-sm"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
            />
          </div>

          <textarea
            className="w-full border rounded p-2 mt-3"
            rows={3}
            placeholder="Trip notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          <button
            disabled={!isAuthenticated || selectedTrails.length !== 3 || isSaving}
            onClick={() => void saveBundle()}
            className="w-full mt-3 bg-stone-900 disabled:bg-stone-400 text-white rounded px-3 py-2"
          >
            {isSaving ? 'Saving...' : isAuthenticated ? 'Save Trip Bundle' : 'Sign in to Save Bundle'}
          </button>
        </section>
      </div>

      <section className="border rounded p-4 mt-6">
        <h2 className="font-semibold mb-3">Saved Bundles</h2>
        {savedBundles.length === 0 ? (
          <p className="text-sm text-stone-500">No bundles saved yet. Select 3 trails and save a trip.</p>
        ) : (
          <div className="space-y-3">
            {savedBundles.map((b) => {
              const date = b.scheduled_date
                ? new Date(b.scheduled_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
                : '—';
              const trailNames = b.trail_ids.map((id) => trailNameMap.get(id) ?? id);
              return (
                <div key={b.id} className="border rounded p-3 text-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-medium text-stone-900">{date}</div>
                      <div className="text-stone-600 mt-0.5">{trailNames.join(' · ')}</div>
                      {b.notes && <div className="text-stone-500 mt-1 text-xs">{b.notes}</div>}
                    </div>
                    <button
                      onClick={() => void deleteBundle(b.id)}
                      disabled={deletingBundleId === b.id}
                      className="shrink-0 text-xs text-stone-400 hover:text-red-600 disabled:opacity-40 transition-colors mt-0.5"
                    >
                      {deletingBundleId === b.id ? 'Deleting…' : 'Delete'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
