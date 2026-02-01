import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, errors } from '@/lib/api/response';
import { ConditionReport } from '@/types';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: trailId } = params;

    // Verify trail exists
    const trail = await prisma.trail.findUnique({
      where: { id: trailId },
      select: { id: true },
    });

    if (!trail) {
      return errors.notFound('Trail');
    }

    // Fetch all reports for the trail, sorted newest first
    const reports = await prisma.conditionReport.findMany({
      where: { trailId },
      orderBy: { timestamp: 'desc' },
    });

    // Transform to match frontend ConditionReport type
    const conditionReports: ConditionReport[] = reports.map((report) => ({
      id: report.id,
      trailId: report.trailId,
      userId: report.userId,
      status: report.status,
      confidence: report.confidence,
      vehicleType: report.vehicleType,
      notes: report.notes ?? undefined,
      timestamp: report.timestamp.toISOString(),
    }));

    return successResponse(conditionReports);
  } catch (error) {
    console.error('Error fetching reports:', error);
    return errors.internalError('Failed to fetch reports');
  }
}
