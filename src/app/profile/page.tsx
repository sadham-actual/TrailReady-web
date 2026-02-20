'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { UserVehicle } from '@/domain/planning';

const defaultVehicle: UserVehicle = {
  make: '',
  model: '',
  clearance_inches: 0,
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

      const res = await fetch(`/api/planner/vehicles?userId=${session.user.id}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const json = await res.json();
      if (json?.success && json.data?.length > 0) {
        const v = json.data[0];
        setVehicle({
          make: v.make,
          model: v.model,
          clearance_inches: Number(v.clearance_inches),
          tire_size: Number(v.tire_size),
          has_low_range: Boolean(v.has_low_range),
          has_winch: Boolean(v.has_winch),
          experience_level: v.experience_level,
        });
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

  return (
    <div className="min-h-screen bg-bone p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-1">Profile</h1>
      <p className="text-sm text-stone-600 mb-6">Manage your account and vehicle setup.</p>

      <div className="border rounded p-4 bg-white space-y-4">
        <h2 className="font-semibold">Vehicle profile</h2>

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
              value={vehicle.clearance_inches}
              onChange={(e) => setVehicle({ ...vehicle, clearance_inches: Number(e.target.value) })}
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

        <button onClick={() => void saveVehicle()} disabled={saving} className="bg-stone-900 text-white px-4 py-2 rounded disabled:bg-stone-400">
          {saving ? 'Saving...' : 'Save profile'}
        </button>

        {message && <p className="text-sm text-stone-700">{message}</p>}
      </div>
    </div>
  );
}
