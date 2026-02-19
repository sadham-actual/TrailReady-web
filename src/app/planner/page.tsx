'use client';

import { useEffect, useMemo, useState } from 'react';
import { evaluateTrailFit, TrailRequirementProfile, UserVehicle } from '@/domain/planning';
import { trailService } from '@/services/trailService';
import { Trail } from '@/types';

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
    difficulty_score: Math.min(10, Math.max(1, ((trail.baseDifficulty ?? 2) * 2) + 2)),
    terrain_type: 'Rock',
    min_tire_size: 31,
    required_gear: [],
    current_status: 'Open',
  };
}

export default function PlannerPage() {
  const [vehicle] = useState<UserVehicle>(defaultVehicle);
  const [trails, setTrails] = useState<Trail[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    trailService.getTrails().then(setTrails).catch(() => setTrails([]));
  }, []);

  const selectedTrails = useMemo(
    () => trails.filter((t) => selected.includes(t.id)).slice(0, 3),
    [selected, trails]
  );

  const shareJson = useMemo(() => {
    if (selectedTrails.length !== 3) return null;
    return JSON.stringify({
      id: `bundle-${selectedTrails.join('-')}`,
      user_id: 'anonymous',
      trail_ids: selectedTrails.map((t) => t.id),
      scheduled_date: new Date('2026-01-01T00:00:00.000Z').toISOString(),
      notes,
      is_offline_cached: false,
    }, null, 2);
  }, [selectedTrails, notes]);

  const toggleTrail = (trailId: string) => {
    setSelected((prev) => {
      if (prev.includes(trailId)) return prev.filter((id) => id !== trailId);
      if (prev.length >= 3) return prev;
      return [...prev, trailId];
    });
  };

  return (
    <div className="min-h-screen p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Trail Planner (MVP)</h1>
      <p className="text-sm text-stone-600 mb-6">Select exactly 3 trails and compare fit side-by-side.</p>

      <div className="grid md:grid-cols-2 gap-6">
        <section className="border rounded p-4">
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

        <section className="border rounded p-4">
          <h2 className="font-semibold mb-3">Comparison View ({selectedTrails.length}/3)</h2>
          <div className="space-y-3">
            {selectedTrails.map((trail) => {
              const req = toRequirementProfile(trail);
              const fit = evaluateTrailFit(vehicle, req);
              return (
                <div key={trail.id} className="border rounded p-3">
                  <div className="font-medium">{trail.name}</div>
                  <div className="text-sm text-stone-600">Difficulty {req.difficulty_score}/10 · Min tire {req.min_tire_size}&quot;</div>
                  <div className="mt-2 text-sm">
                    Fit: <span className={fit.status === 'Green' ? 'text-green-700' : fit.status === 'Yellow' ? 'text-amber-700' : 'text-red-700'}>{fit.status}</span>
                  </div>
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

          {shareJson && (
            <div className="mt-4">
              <h3 className="font-medium mb-2">Shareable Trip Bundle JSON</h3>
              <pre className="text-xs bg-stone-100 p-3 rounded overflow-auto">{shareJson}</pre>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
