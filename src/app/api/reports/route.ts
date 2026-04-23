import { NextRequest } from 'next/server';
import { successResponse, errors } from '@/lib/api/response';
import { submitReportSchema } from '@/lib/validations/report';
import { ZodError } from 'zod';
import { createSupabaseServiceClient, getSupabaseUserIdFromRequestAuthHeader } from '@/lib/supabase/server';
import { ensureWritableTrailExists } from '@/lib/writableTrail';

export async function POST(request: NextRequest) {
  try {
    const authUserId = await getSupabaseUserIdFromRequestAuthHeader(request.headers.get('authorization'));
    if (!authUserId) {
      return errors.unauthorized('Authentication required for this action. Sign in to continue.');
    }

    const body = await request.json();
    const validatedData = submitReportSchema.parse(body);

    if (validatedData.userId !== authUserId) {
      return errors.unauthorized('Authenticated user does not match requested userId');
    }

    const supabase = createSupabaseServiceClient();

    await supabase.from('users').upsert({ id: validatedData.userId, is_anonymous: false });

    const trailOk = await ensureWritableTrailExists(validatedData.trailId);
    if (!trailOk) {
      return errors.notFound('Trail');
    }

    const reportId = crypto.randomUUID();
    const nowIso = new Date().toISOString();
    const { data, error } = await supabase
      .from('condition_reports')
      .insert({
        id: reportId,
        trail_id: validatedData.trailId,
        user_id: validatedData.userId,
        status: validatedData.status,
        confidence: validatedData.confidence,
        vehicle_type: validatedData.vehicleType,
        notes: validatedData.notes ?? null,
        timestamp: nowIso,
      })
      .select('id,timestamp')
      .single();

    if (error) return errors.internalError(error.message);

    return successResponse(
      {
        id: data.id,
        timestamp: data.timestamp,
      },
      201
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return errors.validationError(error.errors[0]?.message || 'Invalid request data');
    }
    if (error instanceof SyntaxError) {
      return errors.badRequest('Invalid JSON in request body');
    }
    console.error('Error creating report:', error);
    return errors.internalError('Failed to create report');
  }
}
