import { Trail, ConditionReport } from '@/types';

// Mock data matching App/Services/MockTrailService.swift
class MockTrailService {
  private trails: Trail[] = [
    {
      id: '1',
      name: 'Alpine Loop',
      region: 'Colorado',
      latitude: 38.8,
      longitude: -106.9,
      description: 'Scenic mountain loop with moderate difficulty',
      latestStatus: 'clear',
      lastReportAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    },
    {
      id: '2',
      name: 'Moab Slickrock',
      region: 'Utah',
      latitude: 38.6,
      longitude: -109.5,
      description: 'Famous slickrock trail requiring 4x4',
      latestStatus: 'rough',
      lastReportAt: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
    },
    {
      id: '3',
      name: 'Rubicon Trail',
      region: 'California',
      latitude: 38.8,
      longitude: -120.0,
      description: 'Legendary extreme 4x4 trail',
      latestStatus: 'rough',
      lastReportAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    },
  ];

  private mockReports: Record<string, ConditionReport[]> = {
    '1': [
      {
        id: 'r1',
        trailId: '1',
        userId: 'user1',
        timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        status: 'clear',
        confidence: 'high',
        notes: 'All good, easy pass',
        vehicleType: 'lifted4x4_solidAxle',
      },
      {
        id: 'r2',
        trailId: '1',
        userId: 'user2',
        timestamp: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
        status: 'rough',
        confidence: 'medium',
        notes: 'Some rocks, need careful driving',
        vehicleType: 'stockSUV_solidAxle',
      },
    ],
    '2': [
      {
        id: 'r3',
        trailId: '2',
        userId: 'user3',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        status: 'rough',
        confidence: 'high',
        notes: 'Technical sections require high clearance',
        vehicleType: 'lifted4x4_IFS',
      },
    ],
    '3': [
      {
        id: 'r4',
        trailId: '3',
        userId: 'user4',
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        status: 'rough',
        confidence: 'high',
        notes: 'Very challenging, experienced drivers only',
        vehicleType: 'lifted4x4_solidAxle',
      },
    ],
  };

  // GET /trails
  async getTrails(query?: string, region?: string): Promise<Trail[]> {
    // Simulate network delay
    await this.delay(300);

    let results = [...this.trails];

    if (query) {
      const lowerQuery = query.toLowerCase();
      results = results.filter(
        (t) =>
          t.name.toLowerCase().includes(lowerQuery) ||
          t.region.toLowerCase().includes(lowerQuery)
      );
    }

    if (region) {
      results = results.filter((t) => t.region === region);
    }

    return results;
  }

  // GET /trails/{id}
  async getTrail(id: string): Promise<Trail | null> {
    await this.delay(200);
    return this.trails.find((t) => t.id === id) || null;
  }

  // GET /trails/{id}/reports
  async getConditionReports(trailId: string): Promise<ConditionReport[]> {
    await this.delay(250);
    return this.mockReports[trailId] || [];
  }

  // POST /reports
  async submitReport(
    trailId: string,
    userId: string,
    data: {
      status: ConditionReport['status'];
      confidence: ConditionReport['confidence'];
      vehicleType: ConditionReport['vehicleType'];
      notes?: string;
    }
  ): Promise<{ id: string; timestamp: string }> {
    await this.delay(500);

    const newReport: ConditionReport = {
      id: `r${Date.now()}`,
      trailId,
      userId,
      timestamp: new Date().toISOString(),
      ...data,
    };

    // Add to mock storage
    if (!this.mockReports[trailId]) {
      this.mockReports[trailId] = [];
    }
    this.mockReports[trailId].unshift(newReport);

    // Update trail's latest status
    const trail = this.trails.find((t) => t.id === trailId);
    if (trail) {
      trail.latestStatus = data.status;
      trail.lastReportAt = newReport.timestamp;
    }

    return {
      id: newReport.id,
      timestamp: newReport.timestamp,
    };
  }

  // POST /auth/anonymous
  async getAnonymousUserId(): Promise<string> {
    await this.delay(100);
    // In real app, this would come from backend
    const existingId = localStorage.getItem('userId');
    if (existingId) return existingId;

    const newId = `user-${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('userId', newId);
    return newId;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Singleton instance
export const trailService = new MockTrailService();