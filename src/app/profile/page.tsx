'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { UserVehicle } from '@/domain/planning';

const defaultVehicle: UserVehicle = {
  rig_tier: 'stockAWD',
  make: '',
  model: '',
  clearance_inches: null,
  tire_size: 0,
  has_low_range: false,
  has_winch: false,
  experience_level: 'Beginner',
};

export default function ProfilePage() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [userId, setUserId] = useState('');
  const [token, setToken] = useState('');
  const [vehicle, setVehicle] = useState<UserVehicle>(defaultVehicle);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [showDetails, setShowDetails] = useState(false);
  const [savedTrails, setSavedTrails] = useState<Array<{ trail_id: string; trail_name?: string }>>([]);
  const [unsavingId, setUnsavingId] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      const session = data.session;
      if (!session?.user?.id) {
        router.push('/auth/login?next=/profile');
        return;
      }
      setUserId(session.user.id);
      setToken(session.access_token);

      const [vehiclesRes, savedRes, trailsRes] = await Promise.all([
        fetch(`/api/planner/vehicles?userId=${session.user.id}`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        }),
        fetch('/api/trails/saved', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        }),
        fetch('/api/trails'),
      ]);

      const vehiclesJson = await vehiclesRes.json();
      if (vehiclesJson?.success && vehiclesJson.data?.length > 0) {
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

      const savedJson = await savedRes.json();
      const trailsJson = await trailsRes.json();
      if (savedJson?.success && Array.isArray(savedJson.data)) {
        const trailMap = new Map<string, string>();
        if (trailsJson?.success && Array.isArray(trailsJson.data)) {
          for (const t of trailsJson.data as Array<{ id: string; name: string }>) {
            trailMap.set(t.id, t.name);
          }
        }
        setSavedTrails(
          savedJson.data.map((s: { trail_id: string }) => ({
            trail_id: s.trail_id,
            trail_name: trailMap.get(s.trail_id),
          }))
        );
      }
    };
    void init();
  }, [router, supabase]);

  const saveVehicle = async () => {
    if (!userId || !token) return;
    setSaving(true);
    setMessage('');

    const res = await fetch('/api/planner/vehicles', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ userId, ...vehicle }),
    });

    const json = await res.json();
    setSaving(false);
    if (json?.success) setMessage('Profile saved.');
    else setMessage(json?.error?.message ?? 'Save failed.');
  };

  const unsaveTrail = async (trailId: string) => {
    setUnsavingId(trailId);
    try {
      await fetch(`/api/trails/saved?trail_id=${encodeURIComponent(trailId)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setSavedTrails((prev) => prev.filter((s) => s.trail_id !== trailId));
    } finally {
      setUnsavingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-bone p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-1">Profile</h1>
      <p className="text-sm text-stone-600 mb-6">Manage your account and vehicle setup.</p>

      <div className="border rounded p-4 bg-white space-y-4">
        <h2 className="font-semibold">Vehicle profile</h2>

        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Rig tier (required)</label>
          <select
            className="w-full border rounded px-3 py-2"
            value={vehicle.rig_tier}
            onChange={(e) => setVehicle({ ...vehicle, rig_tier: e.target.value as UserVehicle['rig_tier'] })}
          >
            <option value="stockAWD">Stock AWD</option>
            <option value="highClearance4x4">High Clearance 4x4</option>
            <option value="modified4x4">Modified 4x4</option>
            <option value="extremeBuild">Extreme Build</option>
          </select>
          <p className="text-xs text-stone-600 mt-1">This is used as your default report vehicle category.</p>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={showDetails} onChange={(e) => setShowDetails(e.target.checked)} />
          Add detailed vehicle specs (optional)
        </label>

        {showDetails && (
          <>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Vehicle make</label>
              <input
                className="w-full border rounded px-3 py-2"
                placeholder="Toyota"
                value={vehicle.make}
                onChange={(e) => setVehicle({ ...vehicle, make: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Vehicle model</label>
              <input
                className="w-full border rounded px-3 py-2"
                placeholder="4Runner"
                value={vehicle.model}
                onChange={(e) => setVehicle({ ...vehicle, model: e.target.value })}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Ground clearance (inches)</label>
                <input
                  className="w-full border rounded px-3 py-2"
                  type="number"
                  placeholder="10.0"
                  value={vehicle.clearance_inches ?? ''}
                  onChange={(e) => setVehicle({ ...vehicle, clearance_inches: e.target.value === '' ? null : Number(e.target.value) })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Tire size (inches)</label>
                <input
                  className="w-full border rounded px-3 py-2"
                  type="number"
                  placeholder="33"
                  value={vehicle.tire_size}
                  onChange={(e) => setVehicle({ ...vehicle, tire_size: Number(e.target.value) })}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Driver experience</label>
              <select
                className="w-full border rounded px-3 py-2"
                value={vehicle.experience_level}
                onChange={(e) => setVehicle({ ...vehicle, experience_level: e.target.value as UserVehicle['experience_level'] })}
              >
                <option>Beginner</option>
                <option>Intermediate</option>
                <option>Advanced</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={vehicle.has_low_range} onChange={(e) => setVehicle({ ...vehicle, has_low_range: e.target.checked })} />
                Has low-range gearing
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={vehicle.has_winch} onChange={(e) => setVehicle({ ...vehicle, has_winch: e.target.checked })} />
                Has winch
              </label>
            </div>
          </>
        )}

        <button onClick={() => void saveVehicle()} disabled={saving} className="bg-stone-900 text-white px-4 py-2 rounded disabled:bg-stone-400">
          {saving ? 'Saving...' : 'Save profile'}
        </button>

        {message && <p className="text-sm text-stone-700">{message}</p>}
      </div>

      <div className="border rounded p-4 bg-white mt-6 space-y-3">
        <h2 className="font-semibold">Saved trails</h2>
        {savedTrails.length === 0 ? (
          <p className="text-sm text-stone-500">
            No saved trails yet.{' '}
            <Link href="/trails" className="underline text-stone-700 hover:text-stone-900">
              Browse trails
            </Link>{' '}
            and bookmark ones you want to run.
          </p>
        ) : (
          <ul className="space-y-2">
            {savedTrails.map((s) => (
              <li key={s.trail_id} className="flex items-center justify-between gap-3 text-sm">
                <Link
                  href={`/trails/${s.trail_id}`}
                  className="text-stone-800 hover:text-stone-900 underline-offset-2 hover:underline truncate"
                >
                  {s.trail_name ?? s.trail_id}
                </Link>
                <button
                  onClick={() => void unsaveTrail(s.trail_id)}
                  disabled={unsavingId === s.trail_id}
                  className="shrink-0 text-xs text-stone-400 hover:text-red-600 disabled:opacity-40 transition-colors"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
