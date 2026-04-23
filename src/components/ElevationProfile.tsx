'use client';

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { GpxPoint } from '@/lib/gpx';

export function ElevationProfile({ points }: { points: GpxPoint[] }) {
  const data = points
    .filter((p) => typeof p.ele === 'number')
    .map((p) => ({
      distance: Number(p.distanceKm.toFixed(2)),
      elevation: Number((p.ele as number).toFixed(0)),
    }));

  if (data.length < 2) {
    return (
      <div className="h-56 border border-dashed border-stone-400 flex items-center justify-center text-sm text-stone-600">
        No elevation data in this GPX track.
      </div>
    );
  }

  return (
    <div className="h-56 border border-stone-800 bg-white p-2">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
          <defs>
            <linearGradient id="elevFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f97316" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#f97316" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#d6d3d1" />
          <XAxis
            dataKey="distance"
            tick={{ fontSize: 11 }}
            label={{ value: 'Distance (km)', position: 'insideBottom', offset: -4 }}
          />
          <YAxis
            tick={{ fontSize: 11 }}
            width={48}
            label={{ value: 'Elevation (m)', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip
            formatter={(value: number | string, name: string) => {
              const safeValue = typeof value === 'number' ? value : Number(value ?? 0);
              const safeName = typeof name === 'string' ? name : 'value';
              return safeName === 'elevation' ? [`${safeValue} m`, 'Elevation'] : [safeValue, safeName];
            }}
            labelFormatter={(value) => `Distance: ${value} km`}
          />
          <Area type="monotone" dataKey="elevation" stroke="#ea580c" fill="url(#elevFill)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
