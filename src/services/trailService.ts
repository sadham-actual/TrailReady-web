import { Trail, ConditionReport } from '@/types';
import { ApiResponse } from '@/lib/api/response';

export interface TrailPhoto {
  id: string;
  url: string;
  createdAt: string;
  report: {
    vehicleType: string;
    notes: string | null;
    confidence: string;
    createdAt: string;
  } | null;
}

class TrailService {
  private async fetchAPI<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const response = await fetch(endpoint, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    const json: ApiResponse<T> = await response.json();

    if (!json.success) {
      throw new Error(json.error.message);
    }

    return json.data;
  }

  // GET /api/trails
  async getTrails(query?: string, region?: string): Promise<Trail[]> {
    const params = new URLSearchParams();
    if (query) params.set('search', query);
    if (region) params.set('region', region);

    const queryString = params.toString();
    const endpoint = queryString ? `/api/trails?${queryString}` : '/api/trails';

    return this.fetchAPI<Trail[]>(endpoint);
  }

  // GET /api/trails/{id}
  async getTrail(id: string): Promise<Trail | null> {
    try {
      return await this.fetchAPI<Trail>(`/api/trails/${id}`);
    } catch (error) {
      // Return null if trail not found (matches mock service behavior)
      console.error('Error fetching trail:', error);
      return null;
    }
  }

  // GET /api/trails/{id}/reports
  async getConditionReports(trailId: string): Promise<ConditionReport[]> {
    return this.fetchAPI<ConditionReport[]>(`/api/trails/${trailId}/reports`);
  }

  // GET /api/trails/{id}/photos
  async getTrailPhotos(id: string): Promise<TrailPhoto[]> {
    return this.fetchAPI<TrailPhoto[]>(`/api/trails/${id}/photos`);
  }

  // POST /api/reports
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
    return this.fetchAPI<{ id: string; timestamp: string }>('/api/reports', {
      method: 'POST',
      body: JSON.stringify({
        trailId,
        userId,
        ...data,
      }),
    });
  }

  // POST /api/auth/anonymous
  async getAnonymousUserId(): Promise<string> {
    // Check localStorage first
    const existingId = localStorage.getItem('userId');
    if (existingId) {
      // Verify the user still exists in the database
      try {
        const result = await this.fetchAPI<{ id: string }>(
          '/api/auth/anonymous',
          {
            method: 'POST',
            body: JSON.stringify({ userId: existingId }),
          }
        );
        return result.id;
      } catch (error) {
        // If verification fails, clear the stored ID and create a new one
        localStorage.removeItem('userId');
      }
    }

    // Create new anonymous user via API
    const result = await this.fetchAPI<{ id: string }>(
      '/api/auth/anonymous',
      {
        method: 'POST',
        body: JSON.stringify({}),
      }
    );

    localStorage.setItem('userId', result.id);
    return result.id;
  }
}

// Singleton instance
export const trailService = new TrailService();
