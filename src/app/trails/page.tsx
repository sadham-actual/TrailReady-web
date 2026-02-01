'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { trailService } from '@/services/trailService';
import { Trail, STATUS_LABELS } from '@/types';

export default function TrailsPage() {
  const [trails, setTrails] = useState<Trail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadTrails();
  }, []);

  async function loadTrails() {
    setIsLoading(true);
    try {
      const data = await trailService.getTrails();
      setTrails(data);
    } catch (error) {
      console.error('Failed to load trails:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSearch() {
    setIsLoading(true);
    try {
      const data = await trailService.getTrails(searchQuery);
      setTrails(data);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsLoading(false);
    }
  }

  function getStatusColor(status?: string) {
    switch (status) {
      case 'clear':
        return 'bg-green-100 text-green-800';
      case 'rough':
        return 'bg-yellow-100 text-yellow-800';
      case 'impassable':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">TrailReady</h1>
          <p className="text-gray-600 mt-1">Know before you go.</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search trails by name or region..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleSearch}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Search
          </button>
        </div>
      </div>

      {/* Trail List */}
      <div className="max-w-7xl mx-auto px-4 pb-12">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading trails...</p>
          </div>
        ) : trails.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">No trails found.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {trails.map((trail) => (
              <Link
                key={trail.id}
                href={`/trails/${trail.id}`}
                className="block bg-white rounded-lg shadow hover:shadow-md transition p-6"
              >
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  {trail.name}
                </h2>
                <p className="text-gray-600 mb-4">{trail.region}</p>
                
                {trail.latestStatus && (
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                        trail.latestStatus
                      )}`}
                    >
                      {STATUS_LABELS[trail.latestStatus]}
                    </span>
                    {trail.lastReportAt && (
                      <span className="text-xs text-gray-500">
                        {new Date(trail.lastReportAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                )}
                
                {!trail.latestStatus && (
                  <span className="text-sm text-gray-500">No recent reports</span>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
