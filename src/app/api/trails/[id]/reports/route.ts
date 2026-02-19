import { NextRequest } from 'next/server';
import { successResponse, errors } from '@/lib/api/response';
import { ConditionReport } from '@/types';
import { getMockReports, getMockTrail } from '@/data/sampleTrails';

async function tryPrismaReports(trailId: string): Promise<ConditionReport[] | null | 'not_found'> {
  try {
    if (process.env.USE_MOCK_DATA === 'true') return null;
    const prisma = (await import('@/lib/prisma')).default;
    const trail = await prisma.trail.findUnique({ where: { id: trailId }, select: { id: true } });
    if (!trail) return 'not_found';
    const reports = await prisma.conditionReport.findMany({
      where: { trailId },
      orderBy: { timestamp: 'desc' },
    });
    return reports.map((r) => ({
      id: r.id,
      trailId: r.trailId,
      userId: r.userId,
      status: r.status,
      confidence: r.confidence,
      vehicleType: r.vehicleType,
      notes: r.notes ?? undefined,
      timestamp: r.timestamp.toISOString(),
    }));
  } catch {
    return null;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: trailId } = await params;

    const dbReports = await tryPrismaReports(trailId);
    if (dbReports === 'not_found') return errors.notFound('Trail');
    if (dbReports !== null) return successResponse(dbReports);

    // Fallback: mock data
    const mockTrail = getMockTrail(trailId);
    if (!mockTrail) return errors.notFound('Trail');

    const mockReports = getMockReports(trailId).map((r) => ({
      id: r.id,
      trailId: r.trailId,
      userId: r.userId,
      status: r.status,
      confidence: r.confidence,
      vehicleType: r.vehicleType,
      notes: r.notes,
      timestamp: r.timestamp,
    }));

    return successResponse(mockReports);
  } catch (error) {
    console.error('Error fetching reports:', error);
    return errors.internalError('Failed to fetch reports');
  }
}
