'use client';

import { useEffect, useMemo, useState } from 'react';
import { evaluateTrailFit, TrailRequirementProfile, TripBundle, UserVehicle } from '@/domain/planning';
import { trailService } from '@/services/trailService';
import { Trail } from '@/types';
import { IndexedDbCacheAdapter } from '@/services/offline/indexedDbCache';
import { PlannerSyncService } from '@/services/offline/plannerSyncService';

const cache = new PlannerSyncService(new IndexedDbCacheAdapter());

const defaultVehicle: UserVehicle = {
  make: 'Jeep',
  model: 'Wrangler',
  clearance_inches: 10.8,
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
  const [userId, setUserId] = useState<string>('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [vehicle, setVehicle] = useState<UserVehicle>(defaultVehicle);
  const [trails, setTrails] = useState<Trail[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [savedBundles, setSavedBundles] = useState<TripBundle[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const boot = async () => {
      try {
        const accountId = localStorage.getItem('trailready_account_user_id');
        if (accountId) {
          setUserId(accountId);
          setIsAuthenticated(true);
        } else {
          const uid = await trailService.getAnonymousUserId();
          setUserId(uid);
          setIsAuthenticated(false);
        }

        const liveTrails = await trailService.getTrails();
        setTrails(liveTrails);
        await cache.cacheTrailMetadata(liveTrails);
      } catch {
        const fallback = await cache.loadOfflineTrails();
        setTrails(fallback);
      }
    };

    void boot();
  }, []);

  useEffect(() => {
    if (!userId) return;

    const loadPlannerState = async () => {
      try {
        const [vehiclesRes, bundlesRes] = await Promise.all([
          fetch(`/api/planner/vehicles?userId=${encodeURIComponent(userId)}`),
          fetch(`/api/planner/trip-bundles?userId=${encodeURIComponent(userId)}`),
        ]);

        const vehiclesJson = await vehiclesRes.json();
        const bundlesJson = await bundlesRes.json();

        if (vehiclesJson?.success && vehiclesJson.data?.length > 0) {
          const v = vehiclesJson.data[0];
          setVehicle({
            make: v.make,
            model: v.model,
            clearance_inches: Number(v.clearanceInches),
            tire_size: Number(v.tireSize),
            has_low_range: Boolean(v.hasLowRange),
            has_winch: Boolean(v.hasWinch),
            experience_level: v.experienceLevel,
          });
        }

        if (bundlesJson?.success && Array.isArray(bundlesJson.data)) {
          const mapped: TripBundle[] = bundlesJson.data.map((b: any) => ({
            id: b.id,
            user_id: b.userId,
            trail_ids: (b.trails ?? []).map((t: any) => t.trailId),
            scheduled_date: b.scheduledDate,
            notes: b.notes ?? '',
            is_offline_cached: Boolean(b.isOfflineCached),
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
  }, [userId]);

  const selectedTrails = useMemo(
    () => trails.filter((t) => selected.includes(t.id)).slice(0, 3),
    [selected, trails]
  );

  const shareJson = useMemo(() => {
    if (selectedTrails.length !== 3) return null;
    return JSON.stringify({
      id: `bundle-${selectedTrails.map((t) => t.id).join('-')}`,
      user_id: userId || 'anonymous',
      trail_ids: selectedTrails.map((t) => t.id),
      scheduled_date: new Date().toISOString(),
      notes,
      is_offline_cached: false,
    }, null, 2);
  }, [selectedTrails, notes, userId]);

  const toggleTrail = (trailId: string) => {
    setSelected((prev) => {
      if (prev.includes(trailId)) return prev.filter((id) => id !== trailId);
      if (prev.length >= 3) return prev;
      return [...prev, trailId];
    });
  };

  const saveVehicleProfile = async () => {
    if (!userId || !isAuthenticated) return;
    await fetch('/api/planner/vehicles', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-trailready-user-id': userId,
        'x-trailready-authenticated': 'true',
      },
      body: JSON.stringify({
        userId,
        ...vehicle,
      }),
    });
  };

  const saveBundle = async () => {
    if (!userId || !isAuthenticated || selectedTrails.length !== 3) return;
    setIsSaving(true);
    try {
      const res = await fetch('/api/planner/trip-bundles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-trailready-user-id': userId,
          'x-trailready-authenticated': 'true',
        },
        body: JSON.stringify({
          user_id: userId,
          trail_ids: selectedTrails.map((t) => t.id),
          scheduled_date: new Date().toISOString(),
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
          scheduled_date: json.data.scheduledDate ?? new Date().toISOString(),
          notes,
          is_offline_cached: Boolean(json.data.isOfflineCached),
        };
        const next = [created, ...savedBundles].slice(0, 10);
        setSavedBundles(next);
        await cache.cacheTripBundles(next);
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Trail Planner (MVP)</h1>
      <p className="text-sm text-stone-600 mb-3">Select exactly 3 trails, compare fit side-by-side, and save reusable bundles.</p>
      <div className="mb-6 flex items-center justify-between border rounded px-3 py-2 bg-stone-50">
        <p className="text-sm text-stone-700">
          {isAuthenticated ? `Signed in as ${userId}` : 'Read-only mode. Sign in required for save/report actions.'}
        </p>
        {isAuthenticated ? (
          <button
            onClick={() => {
              localStorage.removeItem('trailready_account_user_id');
              setIsAuthenticated(false);
            }}
            className="text-sm px-3 py-1 border rounded"
          >
            Sign out
          </button>
        ) : (
          <button
            onClick={() => {
              const demoId = `acct_${Math.random().toString(36).slice(2, 10)}`;
              localStorage.setItem('trailready_account_user_id', demoId);
              setUserId(demoId);
              setIsAuthenticated(true);
            }}
            className="text-sm px-3 py-1 bg-stone-900 text-white rounded"
          >
            Sign in (demo)
          </button>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <section className="border rounded p-4 lg:col-span-1">
          <h2 className="font-semibold mb-3">My Vehicle</h2>
          <div className="space-y-2 text-sm">
            <input className="w-full border rounded px-2 py-1" value={vehicle.make} onChange={(e) => setVehicle({ ...vehicle, make: e.target.value })} placeholder="Make" />
            <input className="w-full border rounded px-2 py-1" value={vehicle.model} onChange={(e) => setVehicle({ ...vehicle, model: e.target.value })} placeholder="Model" />
            <input className="w-full border rounded px-2 py-1" type="number" value={vehicle.clearance_inches} onChange={(e) => setVehicle({ ...vehicle, clearance_inches: Number(e.target.value) })} placeholder="Clearance (in)" />
            <input className="w-full border rounded px-2 py-1" type="number" value={vehicle.tire_size} onChange={(e) => setVehicle({ ...vehicle, tire_size: Number(e.target.value) })} placeholder="Tire size" />
            <select className="w-full border rounded px-2 py-1" value={vehicle.experience_level} onChange={(e) => setVehicle({ ...vehicle, experience_level: e.target.value as UserVehicle['experience_level'] })}>
              <option>Beginner</option>
              <option>Intermediate</option>
              <option>Advanced</option>
            </select>
            <label className="flex items-center gap-2"><input type="checkbox" checked={vehicle.has_low_range} onChange={(e) => setVehicle({ ...vehicle, has_low_range: e.target.checked })} /> Low range</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={vehicle.has_winch} onChange={(e) => setVehicle({ ...vehicle, has_winch: e.target.checked })} /> Winch</label>
            <button disabled={!isAuthenticated} onClick={() => void saveVehicleProfile()} className="w-full bg-stone-900 disabled:bg-stone-400 text-white rounded px-3 py-2">
              {isAuthenticated ? 'Save Vehicle' : 'Sign in to Save Vehicle'}
            </button>
          </div>
        </section>

        <section className="border rounded p-4 lg:col-span-1">
          <h2 className="font-semibold mb-3">Available Trails</h2>
          <div className="space-y-2 max-h-[420px] overflow-auto">
            {trails.map((trail) => (
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

          <textarea
            className="w-full border rounded p-2 mt-4"
            rows={3}
            placeholder="Trip notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          <button
            disabled={!isAuthenticated || selectedTrails.length !== 3 || isSaving}
            onClick={() => void saveBundle()}
            className="w-full mt-3 bg-emerald-700 disabled:bg-stone-400 text-white rounded px-3 py-2"
          >
            {isSaving ? 'Saving...' : isAuthenticated ? 'Save Trip Bundle' : 'Sign in to Save Bundle'}
          </button>

          {shareJson && (
            <div className="mt-4">
              <h3 className="font-medium mb-2">Shareable Trip Bundle JSON</h3>
              <pre className="text-xs bg-stone-100 p-3 rounded overflow-auto">{shareJson}</pre>
            </div>
          )}
        </section>
      </div>

      <section className="border rounded p-4 mt-6">
        <h2 className="font-semibold mb-3">Recent Bundles</h2>
        {savedBundles.length === 0 ? (
          <p className="text-sm text-stone-500">No bundles saved yet.</p>
        ) : (
          <div className="space-y-2">
            {savedBundles.map((b) => (
              <div key={b.id} className="border rounded p-3 text-sm">
                <div className="font-medium">Bundle {b.id.slice(0, 8)}</div>
                <div className="text-stone-600">Trails: {b.trail_ids.join(', ')}</div>
                <div className="text-stone-600">Notes: {b.notes || '—'}</div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
