'use server';

import { Status, Confidence, VehicleType } from '@/types';
import { createSupabaseServiceClient, createSupabaseServerActionClient } from '@/lib/supabase/server';
import { vehicleTypeSchema } from '@/lib/validations/report';
import { ensureWritableTrailExists } from '@/lib/writableTrail';

export type ReportState = {
  status: 'idle' | 'success' | 'error';
  message: string;
  reportId?: string;
  photoIds?: string[];
};

export interface PhotoInput {
  url: string;
  caption: string | null;
}

export interface FieldReportInput {
  trailId: string;
  status: Status;
  vehicleType: VehicleType;
  confidence: Confidence;
  notes?: string;
  photos?: PhotoInput[];
}

export async function submitFieldReport(input: FieldReportInput): Promise<ReportState> {
  const { trailId, status, vehicleType, confidence, notes, photos } = input;

  if (!trailId || typeof trailId !== 'string') {
    return { status: 'error', message: 'INVALID TRAIL IDENTIFIER' };
  }
  if (!['clear', 'rough', 'impassable'].includes(status)) {
    return { status: 'error', message: 'INVALID STATUS VALUE' };
  }
  if (!['low', 'medium', 'high'].includes(confidence)) {
    return { status: 'error', message: 'INVALID CONFIDENCE VALUE' };
  }
  if (!vehicleTypeSchema.safeParse(vehicleType).success) {
    return { status: 'error', message: 'INVALID VEHICLE TYPE' };
  }
  if (photos && photos.length > 5) {
    return { status: 'error', message: 'MAX 5 PHOTOS PER SUBMISSION' };
  }
  if (notes && notes.length > 500) {
    return { status: 'error', message: 'NOTES EXCEED 500 CHARACTER LIMIT' };
  }

  // Require authentication — reports must be tied to a real user
  const authClient = await createSupabaseServerActionClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) {
    return { status: 'error', message: 'AUTHENTICATION REQUIRED — SIGN IN TO SUBMIT REPORTS' };
  }

  try {
    const trailOk = await ensureWritableTrailExists(trailId);
    if (!trailOk) return { status: 'error', message: 'TRAIL NOT FOUND IN DATABASE' };

    const supabase = createSupabaseServiceClient();
    const userId = user.id;
    await supabase.from('users').upsert({ id: userId, is_anonymous: false });

    const reportId = crypto.randomUUID();
    const nowIso = new Date().toISOString();

    const { error: reportErr } = await supabase.from('condition_reports').insert({
      id: reportId,
      trail_id: trailId,
      user_id: userId,
      status,
      confidence,
      vehicle_type: vehicleType,
      notes: notes || null,
      timestamp: nowIso,
    });

    if (reportErr) throw reportErr;

    const validPhotos = (photos ?? []).filter((photo) => {
      try {
        const url = new URL(photo.url);
        return url.hostname.includes('uploadthing.com') || url.hostname.includes('utfs.io');
      } catch {
        return false;
      }
    });

    let photoIds: string[] = [];
    if (validPhotos.length > 0) {
      const rows = validPhotos.map((p) => ({
        id: crypto.randomUUID(),
        trail_id: trailId,
        condition_report_id: reportId,
        url: p.url,
        created_at: nowIso,
        vehicle_type: vehicleType,
        notes: p.caption,
        confidence,
      }));

      const { data: createdPhotos, error: photoErr } = await supabase
        .from('photos')
        .insert(rows)
        .select('id');
      if (photoErr) throw photoErr;
      photoIds = (createdPhotos ?? []).map((p) => p.id);
    }

    const msg = photoIds.length > 0
      ? `CONDITION LOGGED + ${photoIds.length} PHOTO${photoIds.length > 1 ? 'S' : ''} ATTACHED`
      : 'CONDITION REPORT LOGGED';

    return {
      status: 'success',
      message: msg,
      reportId,
      photoIds: photoIds.length > 0 ? photoIds : undefined,
    };
  } catch (error) {
    console.error('Field report submission failed:', error);
    return { status: 'error', message: 'DATABASE TRANSMISSION FAILED' };
  }
}

export type IntelState = ReportState;

export async function submitPhotoIntel(
  trailId: string,
  photos: PhotoInput[]
): Promise<IntelState> {
  if (!trailId || typeof trailId !== 'string') {
    return { status: 'error', message: 'INVALID TRAIL IDENTIFIER' };
  }
  if (!Array.isArray(photos) || photos.length === 0) {
    return { status: 'error', message: 'NO PHOTO INTEL PROVIDED' };
  }
  if (photos.length > 5) {
    return { status: 'error', message: 'MAX 5 PHOTOS PER SUBMISSION' };
  }

  try {
    const trailOk = await ensureWritableTrailExists(trailId);
    if (!trailOk) return { status: 'error', message: 'TRAIL NOT FOUND IN DATABASE' };

    const nowIso = new Date().toISOString();
    const rows = photos.map((photo) => ({
      id: crypto.randomUUID(),
      trail_id: trailId,
      url: photo.url,
      created_at: nowIso,
      notes: photo.caption,
    }));

    const supabase = createSupabaseServiceClient();
    const { data, error } = await supabase.from('photos').insert(rows).select('id');
    if (error) throw error;

    return {
      status: 'success',
      message: `${(data ?? []).length} PHOTO${(data ?? []).length > 1 ? 'S' : ''} LOGGED`,
      photoIds: (data ?? []).map((p) => p.id),
    };
  } catch (error) {
    console.error('Photo intel submission failed:', error);
    return { status: 'error', message: 'DATABASE TRANSMISSION FAILED' };
  }
}
