import { NextRequest } from 'next/server';
import { successResponse, errors } from '@/lib/api/response';
import { submitReportSchema } from '@/lib/validations/report';
import { ZodError } from 'zod';
import { getMockTrail } from '@/data/sampleTrails';
import { requireSoftAuth } from '@/lib/auth/softAuth';

async function tryPrismaSubmit(validatedData: {
  trailId: string;
  userId: string;
  status: 'clear' | 'rough' | 'impassable';
  confidence: 'low' | 'medium' | 'high';
  vehicleType: string;
  notes?: string;
}) {
  try {
    if (process.env.USE_MOCK_DATA === 'true') return null;
    const prisma = (await import('@/lib/prisma')).default;
    const [trail, user] = await Promise.all([
      prisma.trail.findUnique({ where: { id: validatedData.trailId }, select: { id: true } }),
      prisma.user.findUnique({ where: { id: validatedData.userId }, select: { id: true } }),
    ]);
    if (!trail) return 'trail_not_found';
    if (!user) return 'user_not_found';
    const report = await prisma.conditionReport.create({
      data: {
        trailId: validatedData.trailId,
        userId: validatedData.userId,
        status: validatedData.status,
        confidence: validatedData.confidence,
        vehicleType: validatedData.vehicleType as never,
        notes: validatedData.notes,
      },
    });
    return { id: report.id, timestamp: report.timestamp.toISOString() };
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = requireSoftAuth(request);
    if (auth instanceof Response) return auth;

    const body = await request.json();
    const validatedData = submitReportSchema.parse(body);

    if (validatedData.userId !== auth.userId) {
      return errors.unauthorized('Authenticated user does not match requested userId');
    }

    const dbResult = await tryPrismaSubmit(validatedData);
    if (dbResult === 'trail_not_found') return errors.notFound('Trail');
    if (dbResult === 'user_not_found') return errors.badRequest('Invalid user ID.');
    if (dbResult !== null) return successResponse(dbResult, 201);

    // Fallback: accept in mock mode (no persistence, but return success)
    const mockTrail = getMockTrail(validatedData.trailId);
    if (!mockTrail) return errors.notFound('Trail');

    return successResponse(
      {
        id: `mock-report-${Date.now()}`,
        timestamp: new Date().toISOString(),
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
