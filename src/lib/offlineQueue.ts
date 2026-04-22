/**
 * Offline Report Queue
 *
 * When a user submits a field report without network connectivity,
 * the report is saved here and automatically retried when the device
 * comes back online. Photos that were already uploaded to UploadThing
 * are preserved via their URLs.
 */

import { Status, Confidence, VehicleType } from '@/types';

export interface PendingReport {
  id: string;
  trailId: string;
  trailName: string;
  status: Status;
  vehicleType: VehicleType;
  confidence: Confidence;
  notes?: string;
  photos?: { url: string; caption: string | null }[];
  queuedAt: string;
}

const QUEUE_KEY = 'trailready_pending_reports';

export function getPendingReports(): PendingReport[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? (JSON.parse(raw) as PendingReport[]) : [];
  } catch {
    return [];
  }
}

export function queueReport(
  report: Omit<PendingReport, 'id' | 'queuedAt'>
): string {
  const id = crypto.randomUUID();
  const pending = getPendingReports();
  pending.push({ ...report, id, queuedAt: new Date().toISOString() });
  localStorage.setItem(QUEUE_KEY, JSON.stringify(pending));
  return id;
}

export function removeFromQueue(id: string): void {
  const pending = getPendingReports().filter((r) => r.id !== id);
  localStorage.setItem(QUEUE_KEY, JSON.stringify(pending));
}

export function clearQueue(): void {
  localStorage.removeItem(QUEUE_KEY);
}

/** Returns true if the error looks like a network / connectivity failure */
export function isNetworkError(err: unknown): boolean {
  if (!navigator.onLine) return true;
  if (err instanceof TypeError && err.message.toLowerCase().includes('fetch')) return true;
  if (err instanceof Error && err.message.toLowerCase().includes('network')) return true;
  return false;
}
